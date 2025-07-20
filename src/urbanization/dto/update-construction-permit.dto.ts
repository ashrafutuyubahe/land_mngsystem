import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  MaxLength,
  IsDateString,
} from 'class-validator';
import {
  PermitStatus,
  ConstructionPermit,
} from '../entities/construction-permit.entity';

export class UpdateConstructionPermitDto {
  @ApiProperty({
    description: 'Type of construction',
    enum: ConstructionPermit['constructionType'],
    required: false,
    example: 'RESIDENTIAL_HOUSE',
  })
  @IsString()
  @IsOptional()
  constructionType?: string;

  @ApiProperty({
    description: 'Title of the construction project',
    required: false,
    example: 'Two-story family residence',
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  projectTitle?: string;

  @ApiProperty({
    description: 'Detailed description of the construction project',
    required: false,
    example:
      'Construction of a modern two-story family house with 4 bedrooms, 3 bathrooms, and a garage',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Estimated construction cost in Rwandan Francs',
    required: false,
    example: 25000000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedCost?: number;

  @ApiProperty({
    description: 'Total construction area in square meters',
    required: false,
    example: 150.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  constructionArea?: number;

  @ApiProperty({
    description: 'Planned start date for construction',
    required: false,
    example: '2024-03-01',
  })
  @IsDateString()
  @IsOptional()
  plannedStartDate?: string;

  @ApiProperty({
    description: 'Planned completion date for construction',
    required: false,
    example: '2024-12-31',
  })
  @IsDateString()
  @IsOptional()
  plannedCompletionDate?: string;

  @ApiProperty({
    description: 'Current status of the permit',
    enum: PermitStatus,
    required: false,
    example: PermitStatus.UNDER_REVIEW,
  })
  @IsEnum(PermitStatus)
  @IsOptional()
  status?: PermitStatus;

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

  @ApiProperty({
    description: 'Official review comments',
    required: false,
    example: 'Application meets all zoning requirements. Approval granted.',
  })
  @IsString()
  @IsOptional()
  reviewComments?: string;

  @ApiProperty({
    description: 'Actual start date of construction',
    required: false,
    example: '2024-03-15',
  })
  @IsDateString()
  @IsOptional()
  actualStartDate?: string;

  @ApiProperty({
    description: 'Actual completion date of construction',
    required: false,
    example: '2025-01-20',
  })
  @IsDateString()
  @IsOptional()
  actualCompletionDate?: string;
}
