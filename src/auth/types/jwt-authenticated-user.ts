import { ProfileSummary } from '../../profiles/types/profile-summary';
import { UserRole } from '../../users/enums/user-role.enum';
import { UserStatus } from '../../users/enums/user-status.enum';

export interface JwtAuthenticatedUser {
  id: string;
  email: string;
  profileId: string;
  profile: ProfileSummary;
  status: UserStatus;
  role: UserRole;
}
