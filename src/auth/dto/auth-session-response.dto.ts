import { ApiProperty } from '@nestjs/swagger';
import { AuthUserResponseDto } from './auth-user-response.dto';

export class AuthSessionResponseDto {
  @ApiProperty({ example: 'jwt-access-token' })
  accessToken!: string;

  @ApiProperty({ example: 'opaque-refresh-token' })
  refreshToken!: string;

  @ApiProperty({ example: 1800 })
  expiresIn!: number;

  @ApiProperty({ type: AuthUserResponseDto })
  user!: AuthUserResponseDto;
}
