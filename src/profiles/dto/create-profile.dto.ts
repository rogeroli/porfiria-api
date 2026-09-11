import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProfileDto {
  @ApiProperty({ example: 'Cuidador' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'Perfil destinado a cuidadores e familiares.' })
  @IsOptional()
  @IsString()
  description?: string;
}
