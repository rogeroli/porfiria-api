import { ProfileSummary } from '../../profiles/types/profile-summary';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

export interface PublicUser {
  id: string;
  name: string;
  profileId: string;
  profile: ProfileSummary;
  status: UserStatus;
  role: UserRole;
  email: string;
  createdAt: Date;
}
