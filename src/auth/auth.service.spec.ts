import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../redis/redis.service';
import { UserProfile } from '../users/enums/user-profile.enum';
import { UserStatus } from '../users/enums/user-status.enum';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

type UsersServiceMock = Pick<
  UsersService,
  'findByEmail' | 'findPublicById' | 'create' | 'updateStatus' | 'updatePasswordAndStatus'
>;
type JwtServiceMock = Pick<JwtService, 'signAsync'>;
type ConfigServiceMock = Pick<ConfigService, 'get' | 'getOrThrow'>;
type RedisServiceMock = Pick<RedisService, 'setJson' | 'getJson' | 'delete'>;
type MailServiceMock = Pick<MailService, 'sendMail'>;

const userCreatedAt = new Date('2026-07-07T00:00:00.000Z');
const baseUser = {
  id: 'user-id',
  name: 'Maria Silva',
  profile: UserProfile.Patient,
  status: UserStatus.Available,
  email: 'maria@example.com',
  passwordHash: 'hash',
  createdAt: userCreatedAt,
  updatedAt: userCreatedAt,
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersServiceMock>;
  let redisService: jest.Mocked<RedisServiceMock>;
  let mailService: jest.Mocked<MailServiceMock>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findPublicById: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      updatePasswordAndStatus: jest.fn(),
    };
    const jwtService: jest.Mocked<JwtServiceMock> = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    };
    const configService: jest.Mocked<ConfigServiceMock> = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'WEB_APP_URL') {
          return 'http://localhost:3001';
        }

        return '24';
      }),
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
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
        {
          provide: RedisService,
          useValue: redisService,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  it('creates a pending user with hashed password and sends confirmation email', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue({
      id: 'user-id',
      name: 'Maria Silva',
      profile: UserProfile.Patient,
      status: UserStatus.Pending,
      email: 'maria@example.com',
      createdAt: userCreatedAt,
    });

    const result = await authService.register({
      name: 'Maria Silva',
      profile: UserProfile.Patient,
      email: 'MARIA@example.com',
      password: 'Senha@123',
      confirmPassword: 'Senha@123',
    });

    expect(result.email).toBe('maria@example.com');
    expect(result.status).toBe(UserStatus.Pending);
    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Maria Silva',
        profile: UserProfile.Patient,
        email: 'maria@example.com',
        status: UserStatus.Pending,
      }),
    );
    expect(usersService.create.mock.calls[0]?.[0].passwordHash).not.toBe('Senha@123');
    expect(redisService.setJson).toHaveBeenCalledWith(
      expect.stringMatching(/^auth:email-confirmation:/),
      expect.objectContaining({ userId: 'user-id' }),
      86400,
    );
    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'maria@example.com',
        subject: 'Confirme seu email no Porfiria Academy',
      }),
    );
  });

  it('throws conflict when email already exists', async () => {
    usersService.findByEmail.mockResolvedValue(baseUser);

    await expect(
      authService.register({
        name: 'Maria Silva',
        profile: UserProfile.Patient,
        email: 'maria@example.com',
        password: 'Senha@123',
        confirmPassword: 'Senha@123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws bad request when password confirmation does not match', async () => {
    await expect(
      authService.register({
        name: 'Maria Silva',
        profile: UserProfile.Patient,
        email: 'maria@example.com',
        password: 'Senha@123',
        confirmPassword: 'Senha@456',
      }),
    ).rejects.toThrow('A confirmacao de senha nao confere.');
  });

  it('confirms email with a valid token', async () => {
    redisService.getJson.mockResolvedValue({
      userId: 'user-id',
      createdAt: '2026-07-07T00:00:00.000Z',
    });
    usersService.updateStatus.mockResolvedValue({
      id: 'user-id',
      name: 'Maria Silva',
      profile: UserProfile.Patient,
      status: UserStatus.Available,
      email: 'maria@example.com',
      createdAt: userCreatedAt,
    });
    redisService.delete.mockResolvedValue(true);

    const result = await authService.confirmEmail({ token: 'valid-confirmation-token' });

    expect(result.message).toBe('Email confirmado com sucesso.');
    expect(usersService.updateStatus).toHaveBeenCalledWith('user-id', UserStatus.Available);
    expect(redisService.delete).toHaveBeenCalledWith(
      expect.stringMatching(/^auth:email-confirmation:/),
    );
  });

  it('returns a generic message and sends temporary password when recovering password', async () => {
    usersService.findByEmail.mockResolvedValue(baseUser);
    usersService.updatePasswordAndStatus.mockResolvedValue({
      id: 'user-id',
      name: 'Maria Silva',
      profile: UserProfile.Patient,
      status: UserStatus.ChangePassword,
      email: 'maria@example.com',
      createdAt: userCreatedAt,
    });

    const result = await authService.forgotPassword({ email: 'maria@example.com' });

    expect(result.message).toBe(
      'Se o email estiver cadastrado, enviaremos instrucoes de recuperacao.',
    );
    expect(usersService.updatePasswordAndStatus).toHaveBeenCalledWith(
      'user-id',
      expect.any(String),
      UserStatus.ChangePassword,
    );
    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'maria@example.com',
        subject: 'Senha temporaria do Porfiria Academy',
      }),
    );
  });

  it('logs in and stores refresh token in Redis with 24h ttl', async () => {
    const passwordHash = await bcrypt.hash('Senha@123', 4);

    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      passwordHash,
    });

    const result = await authService.login({
      email: 'maria@example.com',
      password: 'Senha@123',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toHaveLength(64);
    expect(result.expiresIn).toBe(1800);
    expect(result.mustChangePassword).toBe(false);
    expect(result.user.email).toBe('maria@example.com');
    expect(redisService.setJson).toHaveBeenCalledWith(
      expect.stringMatching(/^auth:refresh-token:/),
      expect.objectContaining({ userId: 'user-id' }),
      86400,
    );
  });

  it('throws forbidden when pending user tries to login', async () => {
    const passwordHash = await bcrypt.hash('Senha@123', 4);

    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      status: UserStatus.Pending,
      passwordHash,
    });

    await expect(
      authService.login({
        email: 'maria@example.com',
        password: 'Senha@123',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns mustChangePassword when user status requires password change', async () => {
    const passwordHash = await bcrypt.hash('Senha@123', 4);

    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      status: UserStatus.ChangePassword,
      passwordHash,
    });

    const result = await authService.login({
      email: 'maria@example.com',
      password: 'Senha@123',
    });

    expect(result.mustChangePassword).toBe(true);
    expect(result.user.status).toBe(UserStatus.ChangePassword);
  });

  it('changes password and returns available session', async () => {
    const passwordHash = await bcrypt.hash('Temporaria@123', 4);

    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      status: UserStatus.ChangePassword,
      passwordHash,
    });
    usersService.updatePasswordAndStatus.mockResolvedValue({
      id: 'user-id',
      name: 'Maria Silva',
      profile: UserProfile.Patient,
      status: UserStatus.Available,
      email: 'maria@example.com',
      createdAt: userCreatedAt,
    });

    const result = await authService.changePassword({
      email: 'maria@example.com',
      currentPassword: 'Temporaria@123',
      newPassword: 'NovaSenha@123',
      confirmPassword: 'NovaSenha@123',
    });

    expect(usersService.updatePasswordAndStatus).toHaveBeenCalledWith(
      'user-id',
      expect.any(String),
      UserStatus.Available,
    );
    expect(result.mustChangePassword).toBe(false);
  });



  it('allows available user to change password voluntarily', async () => {
    const passwordHash = await bcrypt.hash('Senha@123', 4);

    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      status: UserStatus.Available,
      passwordHash,
    });
    usersService.updatePasswordAndStatus.mockResolvedValue({
      id: 'user-id',
      name: 'Maria Silva',
      profile: UserProfile.Patient,
      status: UserStatus.Available,
      email: 'maria@example.com',
      createdAt: userCreatedAt,
    });

    const result = await authService.changePassword({
      email: 'maria@example.com',
      currentPassword: 'Senha@123',
      newPassword: 'NovaSenha@123',
      confirmPassword: 'NovaSenha@123',
    });

    expect(usersService.updatePasswordAndStatus).toHaveBeenCalledWith(
      'user-id',
      expect.any(String),
      UserStatus.Available,
    );
    expect(result.user.status).toBe(UserStatus.Available);
  });

  it('throws unauthorized when login credentials are invalid', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'maria@example.com',
        password: 'Senha@123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws unauthorized when refresh token is invalid', async () => {
    redisService.getJson.mockResolvedValue(null);

    await expect(authService.refresh({ refreshToken: 'invalid-token' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rotates refresh token when refreshing session', async () => {
    redisService.getJson.mockResolvedValue({
      userId: 'user-id',
      createdAt: '2026-07-07T00:00:00.000Z',
    });
    usersService.findPublicById.mockResolvedValue({
      id: 'user-id',
      name: 'Maria Silva',
      profile: UserProfile.Patient,
      status: UserStatus.Available,
      email: 'maria@example.com',
      createdAt: userCreatedAt,
    });
    redisService.delete.mockResolvedValue(true);

    const result = await authService.refresh({ refreshToken: 'refresh-token' });

    expect(result.accessToken).toBe('access-token');
    expect(redisService.delete).toHaveBeenCalledWith(expect.stringMatching(/^auth:refresh-token:/));
    expect(redisService.setJson).toHaveBeenCalledTimes(1);
  });

  it('revokes refresh token on logout', async () => {
    redisService.delete.mockResolvedValue(true);

    const result = await authService.logout({ refreshToken: 'refresh-token' });

    expect(result.revoked).toBe(true);
    expect(redisService.delete).toHaveBeenCalledWith(expect.stringMatching(/^auth:refresh-token:/));
  });
});
