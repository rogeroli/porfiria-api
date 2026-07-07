import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { RedisService } from '../redis/redis.service';
import { UserProfile } from '../users/enums/user-profile.enum';
import { UsersService } from '../users/users.service';
import { PublicUser } from '../users/types/public-user';
import { LoginUserDto } from './dto/login-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthSession } from './types/auth-session';
import { StoredRefreshToken } from './types/stored-refresh-token';

const PASSWORD_SALT_ROUNDS = 12;
const ACCESS_TOKEN_TTL_SECONDS = 60 * 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly usersService: UsersService,
  ) {}

  async register(input: RegisterUserDto): Promise<PublicUser> {
    if (input.password !== input.confirmPassword) {
      throw new BadRequestException('A confirmação de senha não confere.');
    }

    const existingUser = await this.usersService.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictException('Email já cadastrado.');
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);

    return this.usersService.create({
      name: input.name,
      profile: input.profile,
      email: input.email.toLowerCase(),
      passwordHash,
    });
  }

  async login(input: LoginUserDto): Promise<AuthSession> {
    const user = await this.usersService.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos.');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou senha inválidos.');
    }

    return this.createSession({
      id: user.id,
      name: user.name,
      profile: user.profile as UserProfile,
      email: user.email,
      createdAt: user.createdAt,
    });
  }

  async refresh(input: RefreshTokenDto): Promise<AuthSession> {
    const tokenHash = this.hashRefreshToken(input.refreshToken);
    const storedToken = await this.redisService.getJson<StoredRefreshToken>(
      this.getRefreshTokenKey(tokenHash),
    );

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    const user = await this.usersService.findPublicById(storedToken.userId);

    if (!user) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    await this.redisService.delete(this.getRefreshTokenKey(tokenHash));

    return this.createSession(user);
  }

  async logout(input: RefreshTokenDto): Promise<{ revoked: boolean }> {
    const tokenHash = this.hashRefreshToken(input.refreshToken);
    const revoked = await this.redisService.delete(this.getRefreshTokenKey(tokenHash));

    return { revoked };
  }

  private async createSession(user: PublicUser): Promise<AuthSession> {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        profile: user.profile,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      },
    );
    const refreshToken = this.generateRefreshToken();
    const refreshTokenTtlHours = Number(this.configService.get('REFRESH_TOKEN_TTL_HOURS') ?? '24');
    const refreshTokenTtlSeconds = refreshTokenTtlHours * 60 * 60;

    await this.redisService.setJson<StoredRefreshToken>(
      this.getRefreshTokenKey(this.hashRefreshToken(refreshToken)),
      {
        userId: user.id,
        createdAt: new Date().toISOString(),
      },
      refreshTokenTtlSeconds,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user,
    };
  }

  private generateRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private getRefreshTokenKey(tokenHash: string): string {
    return `auth:refresh-token:${tokenHash}`;
  }
}

