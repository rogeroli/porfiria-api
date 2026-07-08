import { UserProfile } from '../enums/user-profile.enum';
import { UserStatus } from '../enums/user-status.enum';

export interface PublicUser {
  id: string;
  name: string;
  profile: UserProfile;
  status: UserStatus;
  email: string;
  createdAt: Date;
}
