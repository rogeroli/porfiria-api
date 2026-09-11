import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class UpdateProfileQuestionnairesDto {
  @ApiProperty({ type: [String], example: ['2ec0f751-8c37-4a58-b143-f0a2b57ac7b2'] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  questionnaireIds!: string[];
}
