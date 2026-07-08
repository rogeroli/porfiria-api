import { ApiProperty } from '@nestjs/swagger';
import { AuthUserResponseDto } from './auth-user-response.dto';

export class AuthSessionResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ example: 1800 })
  expiresIn!: number;

  @ApiProperty({ example: false })
  mustChangePassword!: boolean;

  @ApiProperty({ type: AuthUserResponseDto })
  user!: AuthUserResponseDto;
}
