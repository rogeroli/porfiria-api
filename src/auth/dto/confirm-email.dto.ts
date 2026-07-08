import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ConfirmEmailDto {
  @ApiProperty({ example: 'opaque-email-confirmation-token' })
  @IsString()
  @MinLength(16)
  token!: string;
}
