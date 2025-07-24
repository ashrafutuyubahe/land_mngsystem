import {
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsUUID,
  IsArray,
  Min,
  Max,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConstructionType } from '../enums/construction.enum';

export class CreateConstructionPermitDto {
  @ApiProperty({
    description: 'Project title',
    example: 'Residential Building Construction',
  })
  @IsString()
  @Length(5, 200)
  projectTitle: string;

  @ApiProperty({
    description: 'Detailed description of the construction project',
    example:
      'Construction of a 3-story residential building with modern amenities',
  })
  @IsString()
  @Length(10, 1000)
  description: string;

  @ApiProperty({
    description: 'Type of construction',
    enum: ConstructionType,
    example: ConstructionType.RESIDENTIAL,
  })
  @IsEnum(ConstructionType)
  constructionType: ConstructionType;

  @ApiProperty({
    description: 'Estimated cost of construction in RWF',
    example: 150000000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1000000)
  estimatedCost: number;

  @ApiProperty({
    description: 'Construction area in square meters',
    example: 250.5,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10)
  constructionArea: number;

  @ApiPropertyOptional({
    description: 'Number of floors',
    example: 3,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  numberOfFloors?: number;

  @ApiPropertyOptional({
    description: 'Contractor name/company',
    example: 'ABC Construction Ltd',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  contractor?: string;

  @ApiPropertyOptional({
    description: 'Architect name/company',
    example: 'XYZ Architects',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  architect?: string;

  @ApiPropertyOptional({
    description: 'Technical specifications',
    example: 'Reinforced concrete structure with steel framework',
  })
  @IsOptional()
  @IsString()
  @Length(10, 2000)
  technicalSpecs?: string;

  @ApiProperty({
    description: 'Planned start date',
    example: '2024-03-01',
  })
  @IsDateString()
  plannedStartDate: string;

  @ApiProperty({
    description: 'Planned completion date',
    example: '2024-12-31',
  })
  @IsDateString()
  plannedCompletionDate: string;

  @ApiProperty({
    description: 'Land record ID associated with this permit',
    example: 'uuid-land-record-id',
  })
  @IsUUID()
  landRecordId: string;

  @ApiPropertyOptional({
    description: 'Array of document URLs',
    example: [
      'https://example.com/blueprint.pdf',
      'https://example.com/survey.pdf',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @ApiPropertyOptional({
    description: 'Special conditions or requirements',
    example: 'Must comply with environmental impact assessment',
  })
  @IsOptional()
  @IsString()
  @Length(10, 1000)
  conditions?: string;
}
