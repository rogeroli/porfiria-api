import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ProfileStatus } from '../enums/profile-status.enum';

export class UpdateProfileStatusDto {
  @ApiProperty({ enum: ProfileStatus })
  @IsEnum(ProfileStatus)
  status!: ProfileStatus;
}
