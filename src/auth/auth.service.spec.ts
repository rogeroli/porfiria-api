import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../redis/redis.service';
import { UserProfile } from '../users/enums/user-profile.enum';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type RedisValue<TValue> = TValue;
type UsersServiceMock = Pick<UsersService, 'findByEmail' | 'findPublicById' | 'create'>;
type JwtServiceMock = Pick<JwtService, 'signAsync'>;
type ConfigServiceMock = Pick<ConfigService, 'get' | 'getOrThrow'>;
type RedisServiceMock = Pick<RedisService, 'setJson' | 'getJson' | 'delete'>;

const userCreatedAt = new Date('2026-07-07T00:00:00.000Z');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersServiceMock>;
  let redisService: jest.Mocked<RedisServiceMock>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findPublicById: jest.fn(),
      create: jest.fn(),
    };
    const jwtService: jest.Mocked<JwtServiceMock> = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    };
    const configService: jest.Mocked<ConfigServiceMock> = {
      get: jest.fn().mockReturnValue('24'),
      getOrThrow: jest.fn().mockReturnValue('jwt-secret'),
    };
    redisService = {
      setJson: jest.fn().mockResolvedValue(undefined),
      getJson: jest.fn(),
      delete: jest.fn(),
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

  it('creates a user with hashed password', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue({
      id: 'user-id',
      name: 'Maria Silva',
      profile: UserProfile.Patient,
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
    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Maria Silva',
        profile: UserProfile.Patient,
        email: 'maria@example.com',
      }),
    );
    expect(usersService.create.mock.calls[0]?.[0].passwordHash).not.toBe('Senha@123');
  });

  it('throws conflict when email already exists', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      name: 'Maria Silva',
      profile: UserProfile.Patient,
      email: 'maria@example.com',
      passwordHash: 'hash',
      createdAt: userCreatedAt,
      updatedAt: userCreatedAt,
    });

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
    ).rejects.toThrow('A confirmação de senha não confere.');
  });

  it('logs in and stores refresh token in Redis with 24h ttl', async () => {
    const passwordHash = await bcrypt.hash('Senha@123', 4);

    usersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      name: 'Maria Silva',
      profile: UserProfile.Patient,
      email: 'maria@example.com',
      passwordHash,
      createdAt: userCreatedAt,
      updatedAt: userCreatedAt,
    });

    const result = await authService.login({
      email: 'maria@example.com',
      password: 'Senha@123',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toHaveLength(64);
    expect(result.expiresIn).toBe(1800);
    expect(result.user.email).toBe('maria@example.com');
    expect(redisService.setJson).toHaveBeenCalledWith(
      expect.stringMatching(/^auth:refresh-token:/),
      expect.objectContaining({ userId: 'user-id' }),
      86400,
    );
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
