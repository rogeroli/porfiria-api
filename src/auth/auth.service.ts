import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomInt } from 'crypto';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../redis/redis.service';
import { UserStatus } from '../users/enums/user-status.enum';
import { UsersService } from '../users/users.service';
import { PublicUser } from '../users/types/public-user';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthSession } from './types/auth-session';
import { StoredEmailConfirmationToken } from './types/stored-email-confirmation-token';
import { JwtAuthenticatedUser } from './types/jwt-authenticated-user';
import { StoredRefreshToken } from './types/stored-refresh-token';

const PASSWORD_SALT_ROUNDS = 12;
const ACCESS_TOKEN_TTL_SECONDS = 60 * 30;
const EMAIL_CONFIRMATION_TTL_SECONDS = 60 * 60 * 24;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly usersService: UsersService,
  ) {}

  async register(input: RegisterUserDto): Promise<PublicUser> {
    if (input.password !== input.confirmPassword) {
      throw new BadRequestException('A confirmacao de senha nao confere.');
    }

    const existingUser = await this.usersService.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictException('Email ja cadastrado.');
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
    this.logger.log(`Criando usuario pendente para confirmacao de email: ${input.email.toLowerCase()}`);
    const user = await this.usersService.create({
      name: input.name,
      profileId: input.profileId,
      email: input.email.toLowerCase(),
      passwordHash,
      status: UserStatus.Pending,
    });

    await this.sendConfirmationEmail(user);
    this.logger.log(`Usuario cadastrado como ${user.status}: ${user.email}`);

    return user;
  }

  async confirmEmail(input: ConfirmEmailDto): Promise<{ message: string }> {
    const tokenHash = this.hashToken(input.token);
    const storedToken = await this.redisService.getJson<StoredEmailConfirmationToken>(
      this.getEmailConfirmationKey(tokenHash),
    );

    if (!storedToken) {
      throw new BadRequestException('Link de confirmacao invalido ou expirado.');
    }

    await this.usersService.updateStatus(storedToken.userId, UserStatus.Available);
    await this.redisService.delete(this.getEmailConfirmationKey(tokenHash));

    return { message: 'Email confirmado com sucesso.' };
  }

  async forgotPassword(input: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(input.email);

    if (!user) {
      return this.getPasswordRecoveryMessage();
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, PASSWORD_SALT_ROUNDS);

    await this.usersService.updatePasswordAndStatus(
      user.id,
      passwordHash,
      UserStatus.ChangePassword,
    );
    await this.sendTemporaryPasswordEmail(user.email, user.name, temporaryPassword);

    return this.getPasswordRecoveryMessage();
  }

  async getAuthenticatedUser(user: JwtAuthenticatedUser): Promise<PublicUser> {
    const publicUser = await this.usersService.findPublicById(user.id);

    if (!publicUser) {
      throw new UnauthorizedException('Usuario autenticado nao encontrado.');
    }

    return publicUser;
  }

  async changePassword(userId: string, input: ChangePasswordDto): Promise<AuthSession> {
    if (input.newPassword !== input.confirmPassword) {
      throw new BadRequestException('A confirmacao de senha nao confere.');
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Usuario autenticado nao encontrado.');
    }

    const isPasswordValid = await bcrypt.compare(input.currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha atual invalida.');
    }

    if ((user.status as UserStatus) === UserStatus.Pending) {
      throw new ForbiddenException('Confirme seu email antes de alterar a senha.');
    }

    const passwordHash = await bcrypt.hash(input.newPassword, PASSWORD_SALT_ROUNDS);
    const updatedUser = await this.usersService.updatePasswordAndStatus(
      user.id,
      passwordHash,
      UserStatus.Available,
    );

    return this.createSession(updatedUser);
  }

  async login(input: LoginUserDto): Promise<AuthSession> {
    const user = await this.usersService.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException('Email ou senha invalidos.');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou senha invalidos.');
    }

    if ((user.status as UserStatus) === UserStatus.Pending) {
      this.logger.warn(`Login bloqueado para usuario PENDING: ${user.email}`);
      throw new ForbiddenException('Confirme seu email antes de acessar a plataforma.');
    }

    const publicUser = await this.usersService.findPublicById(user.id);

    if (!publicUser) {
      throw new UnauthorizedException('Usuario autenticado nao encontrado.');
    }

    return this.createSession(publicUser);
  }

  async refresh(input: RefreshTokenDto): Promise<AuthSession> {
    const tokenHash = this.hashRefreshToken(input.refreshToken);
    const storedToken = await this.redisService.getJson<StoredRefreshToken>(
      this.getRefreshTokenKey(tokenHash),
    );

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token invalido.');
    }

    const user = await this.usersService.findPublicById(storedToken.userId);

    if (!user) {
      throw new UnauthorizedException('Refresh token invalido.');
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
        profileId: user.profileId,
        status: user.status,
        role: user.role,
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
      mustChangePassword: user.status === UserStatus.ChangePassword,
      user,
    };
  }

  private async sendConfirmationEmail(user: PublicUser): Promise<void> {
    const token = this.generateOpaqueToken();
    const confirmationUrl = `${this.getWebAppUrl()}/confirm-email?token=${token}`;

    await this.redisService.setJson<StoredEmailConfirmationToken>(
      this.getEmailConfirmationKey(this.hashToken(token)),
      {
        userId: user.id,
        createdAt: new Date().toISOString(),
      },
      EMAIL_CONFIRMATION_TTL_SECONDS,
    );
    this.logger.log(`Token de confirmacao armazenado no Redis para ${user.email}`);

    this.logger.log(`Solicitando envio de email de confirmacao para ${user.email}`);
    await this.mailService.sendMail({
      to: user.email,
      subject: 'Confirme seu email no Porfiria Academy',
      text: `Ola, ${user.name}. Confirme seu email acessando: ${confirmationUrl}`,
      html: `<p>Ola, ${user.name}.</p><p>Confirme seu email para ativar seu acesso ao Porfiria Academy.</p><p><a href="${confirmationUrl}">Confirmar email</a></p>`,
    });
  }

  private async sendTemporaryPasswordEmail(
    email: string,
    name: string,
    temporaryPassword: string,
  ): Promise<void> {
    this.logger.log(`Solicitando envio de senha temporaria para ${email}`);
    await this.mailService.sendMail({
      to: email,
      subject: 'Senha temporaria do Porfiria Academy',
      text: `Ola, ${name}. Sua senha temporaria e: ${temporaryPassword}. Apos o login, crie uma nova senha.`,
      html: `<p>Ola, ${name}.</p><p>Sua senha temporaria e:</p><p><strong>${temporaryPassword}</strong></p><p>Apos o login, crie uma nova senha.</p>`,
    });
  }

  private getPasswordRecoveryMessage(): { message: string } {
    return {
      message: 'Se o email estiver cadastrado, enviaremos instrucoes de recuperacao.',
    };
  }

  private getWebAppUrl(): string {
    return this.configService.get<string>('WEB_APP_URL') ?? 'http://localhost:3001';
  }

  private generateTemporaryPassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const special = '!@#$%&*?';
    const all = `${upper}${lower}${numbers}${special}`;
    const required = [
      this.pickRandom(upper),
      this.pickRandom(lower),
      this.pickRandom(numbers),
      this.pickRandom(special),
    ];

    while (required.length < 14) {
      required.push(this.pickRandom(all));
    }

    return required.sort(() => randomInt(3) - 1).join('');
  }

  private pickRandom(characters: string): string {
    return characters[randomInt(characters.length)] ?? characters[0];
  }

  private generateRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private generateOpaqueToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashRefreshToken(refreshToken: string): string {
    return this.hashToken(refreshToken);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getRefreshTokenKey(tokenHash: string): string {
    return `auth:refresh-token:${tokenHash}`;
  }

  private getEmailConfirmationKey(tokenHash: string): string {
    return `auth:email-confirmation:${tokenHash}`;
  }
}
