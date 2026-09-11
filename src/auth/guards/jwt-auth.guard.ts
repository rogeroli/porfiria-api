import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { UserStatus } from '../../users/enums/user-status.enum';
import { AuthenticatedRequest } from '../types/authenticated-request';
import { JwtPayload } from '../types/jwt-payload';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Token de acesso nao informado.');
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Token de acesso invalido ou expirado.');
    }

    const user = await this.usersService.findPublicById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Usuario autenticado nao encontrado.');
    }

    if (user.status === UserStatus.Pending) {
      throw new ForbiddenException('Confirme seu email antes de acessar a plataforma.');
    }

    request.user = {
      id: user.id,
      email: user.email,
      profileId: user.profileId,
      profile: user.profile,
      status: user.status,
      role: user.role,
    };

    return true;
  }

  private extractToken(authorizationHeader: string | undefined): string | null {
    if (!authorizationHeader) {
      return null;
    }

    const [type, token] = authorizationHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
