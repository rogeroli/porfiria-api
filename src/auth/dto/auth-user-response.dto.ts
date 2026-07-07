import { ApiProperty } from '@nestjs/swagger';
import { UserProfile } from '../../users/enums/user-profile.enum';

export class AuthUserResponseDto {
  @ApiProperty({ example: '7a9341e7-bf8f-4d15-98fc-5f94192c39cb' })
  id!: string;

  @ApiProperty({ example: 'Maria Silva' })
  name!: string;

  @ApiProperty({ enum: UserProfile, example: UserProfile.Patient })
  profile!: UserProfile;

  @ApiProperty({ example: 'maria@example.com' })
  email!: string;

  @ApiProperty({ example: '2026-07-07T00:00:00.000Z' })
  createdAt!: Date;
}
