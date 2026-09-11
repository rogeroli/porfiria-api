import { UserRole } from '../../users/enums/user-role.enum';
import { UserStatus } from '../../users/enums/user-status.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  profileId: string;
  status: UserStatus;
  role: UserRole;
}
