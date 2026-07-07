import { UserProfile } from '../enums/user-profile.enum';

export interface PublicUser {
  id: string;
  name: string;
  profile: UserProfile;
  email: string;
  createdAt: Date;
}
