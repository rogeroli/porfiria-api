import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID, Matches, MinLength } from 'class-validator';
import { PASSWORD_POLICY_MESSAGE, PASSWORD_POLICY_REGEX } from '../constants/password-policy';

export class RegisterUserDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  profileId!: string;

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
