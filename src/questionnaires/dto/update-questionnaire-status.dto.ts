import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { QuestionnaireStatus } from '../enums/questionnaire-status.enum';

export class UpdateQuestionnaireStatusDto {
  @ApiProperty({ enum: QuestionnaireStatus })
  @IsEnum(QuestionnaireStatus)
  status!: QuestionnaireStatus;
}
