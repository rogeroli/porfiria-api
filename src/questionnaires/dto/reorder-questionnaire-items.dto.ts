import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

export class ReorderQuestionnaireItemDto {
  @ApiProperty({ example: '2ec0f751-8c37-4a58-b143-f0a2b57ac7b2' })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  order!: number;
}

export class ReorderQuestionnaireItemsDto {
  @ApiProperty({ type: [ReorderQuestionnaireItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderQuestionnaireItemDto)
  items!: ReorderQuestionnaireItemDto[];
}
