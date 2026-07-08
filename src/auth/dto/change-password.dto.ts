import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Matches, MinLength } from 'class-validator';
import { PASSWORD_POLICY_MESSAGE, PASSWORD_POLICY_REGEX } from '../constants/password-policy';

export class ChangePasswordDto {
  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail({}, { message: 'Informe um email valido.' })
  email!: string;

  @ApiProperty({ example: 'SenhaTemporaria@123' })
  @MinLength(1, { message: 'Informe a senha atual.' })
  currentPassword!: string;

  @ApiProperty({ example: 'NovaSenha@123' })
  @Matches(PASSWORD_POLICY_REGEX, { message: PASSWORD_POLICY_MESSAGE })
  newPassword!: string;

  @ApiProperty({ example: 'NovaSenha@123' })
  @MinLength(1, { message: 'Confirme a nova senha.' })
  confirmPassword!: string;
}
