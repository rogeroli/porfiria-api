import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateQuizOptionDto {
  @ApiProperty({ example: 'Deficiencia em uma enzima da via do heme.' })
  @IsString()
  @MinLength(1)
  text!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isCorrect!: boolean;
}

export class CreateQuizItemDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @ApiProperty({ example: 'O que caracteriza uma porfiria?' })
  @IsString()
  @MinLength(5)
  question!: string;

  @ApiProperty({ type: [CreateQuizOptionDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateQuizOptionDto)
  options!: CreateQuizOptionDto[];
}
