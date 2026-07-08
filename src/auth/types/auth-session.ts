import { PublicUser } from '../../users/types/public-user';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  mustChangePassword: boolean;
  user: PublicUser;
}
