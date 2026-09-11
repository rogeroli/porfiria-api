import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { QuestionnaireContentFormat } from '../enums/questionnaire-content-format.enum';

export class UpdateQuestionnaireDto {
  @ApiPropertyOptional({ example: 'Introducao as porfirias' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @ApiPropertyOptional({ example: 'Questionario introdutorio sobre conceitos basicos de porfiria.' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiPropertyOptional({ enum: QuestionnaireContentFormat })
  @IsOptional()
  @IsEnum(QuestionnaireContentFormat)
  contentFormat?: QuestionnaireContentFormat;

  @ApiPropertyOptional({ example: '<p>Conteudo introdutorio sobre porfirias.</p>' })
  @IsOptional()
  @IsString()
  contentText?: string;
}
