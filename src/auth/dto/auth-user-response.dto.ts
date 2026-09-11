import { ApiProperty } from '@nestjs/swagger';
import { ProfileStatus } from '../../profiles/enums/profile-status.enum';
import { UserRole } from '../../users/enums/user-role.enum';
import { UserStatus } from '../../users/enums/user-status.enum';

class ProfileResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: ProfileStatus })
  status!: ProfileStatus;
}

export class AuthUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  profileId!: string;

  @ApiProperty({ type: ProfileResponseDto })
  profile!: ProfileResponseDto;

  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  createdAt!: Date;
}
