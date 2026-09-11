import { ProfileStatus } from '../enums/profile-status.enum';

export interface ProfileSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: ProfileStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
