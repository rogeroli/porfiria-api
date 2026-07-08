import { ApiProperty } from '@nestjs/swagger';
import { UserProfile } from '../../users/enums/user-profile.enum';
import { UserStatus } from '../../users/enums/user-status.enum';

export class AuthUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: UserProfile })
  profile!: UserProfile;

  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  createdAt!: Date;
}
