import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { ConstructionType } from '../enums/construction.enum';

export class CreateConstructionPermitDto {
  @ApiProperty({
    description: 'ID of the land record where construction will take place',
    example: 'e12f8c3a-4b5d-6e7f-8a9b-0c1d2e3f4a5b',
  })
  @IsUUID()
  @IsNotEmpty()
  landRecordId: string;

  @ApiProperty({
    description: 'Type of construction',
    enum: ConstructionType,
    example: ConstructionType.RESIDENTIAL_HOUSE,
  })
  @IsEnum(ConstructionType)
  @IsNotEmpty()
  constructionType: ConstructionType;

  @ApiProperty({
    description: 'Title of the construction project',
    example: 'Two-story family residence',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  projectTitle: string;

  @ApiProperty({
    description: 'Detailed description of the construction project',
    example:
      'Construction of a modern two-story family house with 4 bedrooms, 3 bathrooms, and a garage',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Estimated construction cost in Rwandan Francs',
    example: 25000000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  estimatedCost: number;

  @ApiProperty({
    description: 'Total construction area in square meters',
    example: 150.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  constructionArea: number;

  @ApiProperty({
    description: 'Planned start date for construction',
    example: '2024-03-01',
  })
  @IsDateString()
  @IsNotEmpty()
  plannedStartDate: string;

  @ApiProperty({
    description: 'Planned completion date for construction',
    example: '2024-12-31',
  })
  @IsDateString()
  @IsNotEmpty()
  plannedCompletionDate: string;

  @ApiProperty({
    description: 'Name of the contractor or construction company',
    required: false,
    example: 'Rwanda Construction Ltd',
  })
  @IsString()
  @IsOptional()
  contractor?: string;

  @ApiProperty({
    description: 'Architect or engineer details',
    required: false,
    example: 'John Doe, Licensed Architect (License #12345)',
  })
  @IsString()
  @IsOptional()
  architect?: string;

  @ApiProperty({
    description: 'Additional technical specifications',
    required: false,
    example:
      'Foundation: Reinforced concrete, Walls: Brick and mortar, Roof: Iron sheets',
  })
  @IsString()
  @IsOptional()
  technicalSpecs?: string;
}
