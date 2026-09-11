import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { QuestionnaireContentFormat } from '../enums/questionnaire-content-format.enum';

export class CreateQuestionnaireDto {
  @ApiProperty({ example: 'Introducao as porfirias' })
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiProperty({ example: 'Questionario introdutorio sobre conceitos basicos de porfiria.' })
  @IsString()
  @MinLength(10)
  description!: string;

  @ApiProperty({ enum: QuestionnaireContentFormat })
  @IsEnum(QuestionnaireContentFormat)
  contentFormat!: QuestionnaireContentFormat;

  @ApiPropertyOptional({ example: '<p>Conteudo introdutorio sobre porfirias.</p>' })
  @IsOptional()
  @IsString()
  contentText?: string;
}
