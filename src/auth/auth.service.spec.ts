import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { ProfileStatus } from '../profiles/enums/profile-status.enum';
import { RedisService } from '../redis/redis.service';
import { UserRole } from '../users/enums/user-role.enum';
import { UserStatus } from '../users/enums/user-status.enum';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

type UsersServiceMock = Pick<
  UsersService,
  | 'findByEmail'
  | 'findById'
  | 'findPublicById'
  | 'create'
  | 'updateStatus'
  | 'updatePasswordAndStatus'
>;
type JwtServiceMock = Pick<JwtService, 'signAsync'>;
type ConfigServiceMock = Pick<ConfigService, 'get' | 'getOrThrow'>;
type RedisServiceMock = Pick<RedisService, 'setJson' | 'getJson' | 'delete'>;
type MailServiceMock = Pick<MailService, 'sendMail'>;

const now = new Date('2026-07-07T00:00:00.000Z');
const profile = {
  id: '11111111-1111-4111-8111-111111111111',
  code: 'PATIENT',
  name: 'Paciente',
  description: 'Perfil destinado a pacientes.',
  status: ProfileStatus.Active,
  createdAt: now,
  updatedAt: now,
};
const publicUser = {
  id: 'user-id',
  name: 'Maria Silva',
  profileId: profile.id,
  profile,
  status: UserStatus.Available,
  role: UserRole.User,
  email: 'maria@example.com',
  createdAt: now,
};
const userWithPassword = {
  ...publicUser,
  passwordHash: 'hash',
  updatedAt: now,
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersServiceMock>;
  let redisService: jest.Mocked<RedisServiceMock>;
  let mailService: jest.Mocked<MailServiceMock>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findPublicById: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      updatePasswordAndStatus: jest.fn(),
    };
    const jwtService: jest.Mocked<JwtServiceMock> = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    };
    const configService: jest.Mocked<ConfigServiceMock> = {
      get: jest.fn().mockImplementation((key: string) => (key === 'WEB_APP_URL' ? 'http://localhost:3001' : '24')),
      getOrThrow: jest.fn().mockReturnValue('jwt-secret'),
    };
    redisService = {
      setJson: jest.fn().mockResolvedValue(undefined),
      getJson: jest.fn(),
      delete: jest.fn(),
    };
    mailService = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: configService },
        { provide: JwtService, useValue: jwtService },
        { provide: MailService, useValue: mailService },
        { provide: RedisService, useValue: redisService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  it('creates a pending user with hashed password and sends confirmation email', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue({ ...publicUser, status: UserStatus.Pending });

    const result = await authService.register({
      name: 'Maria Silva',
      profileId: profile.id,
      email: 'MARIA@example.com',
      password: 'Senha@123',
      confirmPassword: 'Senha@123',
    });

    expect(result.email).toBe('maria@example.com');
    expect(result.status).toBe(UserStatus.Pending);
    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Maria Silva',
        profileId: profile.id,
        email: 'maria@example.com',
        status: UserStatus.Pending,
      }),
    );
    expect(usersService.create.mock.calls[0]?.[0].passwordHash).not.toBe('Senha@123');
    expect(mailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'maria@example.com' }));
  });

  it('throws conflict when email already exists', async () => {
    usersService.findByEmail.mockResolvedValue(userWithPassword);

    await expect(
      authService.register({
        name: 'Maria Silva',
        profileId: profile.id,
        email: 'maria@example.com',
        password: 'Senha@123',
        confirmPassword: 'Senha@123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('confirms email with a valid token', async () => {
    redisService.getJson.mockResolvedValue({ userId: 'user-id', createdAt: now.toISOString() });
    usersService.updateStatus.mockResolvedValue(publicUser);
    redisService.delete.mockResolvedValue(true);

    const result = await authService.confirmEmail({ token: 'valid-confirmation-token' });

    expect(result.message).toBe('Email confirmado com sucesso.');
    expect(usersService.updateStatus).toHaveBeenCalledWith('user-id', UserStatus.Available);
  });

  it('blocks pending users on login', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...userWithPassword,
      status: UserStatus.Pending,
      passwordHash: await bcrypt.hash('Senha@123', 4),
    });

    await expect(authService.login({ email: 'maria@example.com', password: 'Senha@123' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('creates a session for a valid login', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...userWithPassword,
      passwordHash: await bcrypt.hash('Senha@123', 4),
    });
    usersService.findPublicById.mockResolvedValue(publicUser);

    const session = await authService.login({ email: 'maria@example.com', password: 'Senha@123' });

    expect(session.accessToken).toBe('access-token');
    expect(session.user.profile.id).toBe(profile.id);
    expect(redisService.setJson).toHaveBeenCalled();
  });

  it('rejects invalid login credentials', async () => {
    usersService.findByEmail.mockResolvedValue(userWithPassword);

    await expect(authService.login({ email: 'maria@example.com', password: 'errada' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('changes password for authenticated users', async () => {
    const passwordHash = await bcrypt.hash('Senha@123', 4);
    usersService.findById.mockResolvedValue({ ...userWithPassword, passwordHash });
    usersService.updatePasswordAndStatus.mockResolvedValue(publicUser);

    const session = await authService.changePassword('user-id', {
      currentPassword: 'Senha@123',
      newPassword: 'Nova@1234',
      confirmPassword: 'Nova@1234',
    });

    expect(session.accessToken).toBe('access-token');
    expect(usersService.updatePasswordAndStatus).toHaveBeenCalledWith(
      'user-id',
      expect.any(String),
      UserStatus.Available,
    );
  });
});
