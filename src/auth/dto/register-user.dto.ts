import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, Matches, MinLength } from 'class-validator';
import { UserProfile } from '../../users/enums/user-profile.enum';
import { PASSWORD_POLICY_MESSAGE, PASSWORD_POLICY_REGEX } from '../constants/password-policy';

export class RegisterUserDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ enum: UserProfile, example: UserProfile.Patient })
  @IsEnum(UserProfile)
  profile!: UserProfile;

  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Senha@123', minLength: 9 })
  @IsString()
  @Matches(PASSWORD_POLICY_REGEX, {
    message: PASSWORD_POLICY_MESSAGE,
  })
  password!: string;

  @ApiProperty({ example: 'Senha@123', minLength: 9 })
  @IsString()
  @MinLength(1)
  confirmPassword!: string;
}
