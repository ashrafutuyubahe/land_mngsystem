import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsUUID,
  IsArray,
  IsBoolean,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InspectionType, InspectionStatus } from '../enums/construction.enum';

export class CreateInspectionDto {
  @ApiProperty({
    description: 'Type of inspection',
    enum: InspectionType,
    example: InspectionType.FOUNDATION,
  })
  @IsEnum(InspectionType)
  inspectionType: InspectionType;

  @ApiProperty({
    description: 'Scheduled date for inspection',
    example: '2024-03-15T10:00:00Z',
  })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({
    description: 'Construction permit ID',
    example: 'uuid-permit-id',
  })
  @IsUUID()
  permitId: string;

  @ApiProperty({
    description: 'Inspector user ID',
    example: 'uuid-inspector-id',
  })
  @IsUUID()
  inspectorId: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the inspection',
    example: 'Focus on foundation depth and concrete quality',
  })
  @IsOptional()
  @IsString()
  @Length(5, 1000)
  notes?: string;
}

export class UpdateInspectionDto {
  @ApiPropertyOptional({
    description: 'Inspection status',
    enum: InspectionStatus,
    example: InspectionStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;

  @ApiPropertyOptional({
    description: 'Completion date',
    example: '2024-03-15T14:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @ApiPropertyOptional({
    description: 'Inspection findings',
    example: 'Foundation meets all structural requirements',
  })
  @IsOptional()
  @IsString()
  @Length(10, 2000)
  findings?: string;

  @ApiPropertyOptional({
    description: 'Recommendations for improvement',
    example: 'Ensure proper curing of concrete before proceeding',
  })
  @IsOptional()
  @IsString()
  @Length(10, 2000)
  recommendations?: string;

  @ApiPropertyOptional({
    description: 'Identified deficiencies',
    example: 'Minor crack in southeast corner foundation',
  })
  @IsOptional()
  @IsString()
  @Length(5, 2000)
  deficiencies?: string;

  @ApiPropertyOptional({
    description: 'Next inspection date if required',
    example: '2024-04-01T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  nextInspectionDate?: string;

  @ApiPropertyOptional({
    description: 'Array of photo URLs',
    example: [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional({
    description: 'Array of document URLs',
    example: ['https://example.com/report.pdf'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Weather conditions were favorable for inspection',
  })
  @IsOptional()
  @IsString()
  @Length(5, 1000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Whether the construction is compliant',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isCompliant?: boolean;
}
