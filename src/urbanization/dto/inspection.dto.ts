import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import {
  InspectionType,
  InspectionStatus,
} from '../entities/inspection.entity';

export class ScheduleInspectionDto {
  @ApiProperty({
    description: 'Type of inspection to schedule',
    enum: InspectionType,
    example: InspectionType.SITE_ASSESSMENT,
  })
  @IsEnum(InspectionType)
  inspectionType: InspectionType;

  @ApiProperty({
    description: 'Scheduled date for the inspection',
    required: false,
    example: '2024-03-15T10:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @ApiProperty({
    description: 'Additional notes for the inspection',
    required: false,
    example: 'Please ensure site is accessible',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ConductInspectionDto {
  @ApiProperty({
    description: 'Result of the inspection',
    enum: InspectionStatus,
    example: InspectionStatus.PASSED,
  })
  @IsEnum(InspectionStatus)
  result: InspectionStatus;

  @ApiProperty({
    description: 'Detailed notes about the inspection',
    example: 'Foundation meets all requirements. No issues found.',
  })
  @IsString()
  notes: string;

  @ApiProperty({
    description: 'Any findings or issues discovered',
    required: false,
    example: 'Minor crack in eastern wall needs attention',
  })
  @IsString()
  @IsOptional()
  findings?: string;

  @ApiProperty({
    description: 'Recommendations for the applicant',
    required: false,
    example: 'Repair the minor crack before proceeding to next phase',
  })
  @IsString()
  @IsOptional()
  recommendations?: string;
}

export class ReviewPermitDto {
  @ApiProperty({
    description: 'Review decision',
    enum: ['approved', 'rejected', 'conditionally_approved'],
    example: 'approved',
  })
  @IsString()
  decision: string;

  @ApiProperty({
    description: 'Review comments',
    example: 'Application meets all requirements. Approved for construction.',
  })
  @IsString()
  comments: string;
}
