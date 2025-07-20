import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import {
  ConflictType,
  ConflictPriority,
  ConflictStatus,
} from '../enums/conflict.enum';

export class ConflictFilterDto {
  @ApiProperty({
    description: 'Filter by conflict type',
    enum: ConflictType,
    required: false,
  })
  @IsEnum(ConflictType)
  @IsOptional()
  conflictType?: ConflictType;

  @ApiProperty({
    description: 'Filter by conflict status',
    enum: ConflictStatus,
    required: false,
  })
  @IsEnum(ConflictStatus)
  @IsOptional()
  status?: ConflictStatus;

  @ApiProperty({
    description: 'Filter by priority level',
    enum: ConflictPriority,
    required: false,
  })
  @IsEnum(ConflictPriority)
  @IsOptional()
  priority?: ConflictPriority;

  @ApiProperty({
    description: 'Filter conflicts reported from this date',
    required: false,
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  reportedAfter?: string;

  @ApiProperty({
    description: 'Filter conflicts reported before this date',
    required: false,
    example: '2024-12-31',
  })
  @IsDateString()
  @IsOptional()
  reportedBefore?: string;

  @ApiProperty({
    description: 'Search in title and description',
    required: false,
    example: 'boundary',
  })
  @IsString()
  @IsOptional()
  search?: string;
}

export class AssignConflictDto {
  @ApiProperty({
    description: 'ID of the officer to assign to this conflict',
    example: 'e12f8c3a-4b5d-6e7f-8a9b-0c1d2e3f4a5b',
  })
  @IsString()
  assignedToId: string;

  @ApiProperty({
    description: 'Notes about the assignment',
    required: false,
    example: 'Officer specialized in boundary disputes',
  })
  @IsString()
  @IsOptional()
  assignmentNotes?: string;
}
