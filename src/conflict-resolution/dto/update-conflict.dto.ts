import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ConflictType, ConflictPriority, ConflictStatus } from '../enums/conflict.enum';

export class UpdateConflictDto {
  @ApiProperty({ 
    description: 'Type of conflict',
    enum: ConflictType,
    required: false,
    example: ConflictType.BOUNDARY_DISPUTE
  })
  @IsEnum(ConflictType)
  @IsOptional()
  conflictType?: ConflictType;

  @ApiProperty({ 
    description: 'Brief title describing the conflict',
    required: false,
    example: 'Boundary dispute between plots 123 and 124',
    maxLength: 200
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiProperty({ 
    description: 'Detailed description of the conflict',
    required: false,
    example: 'The boundary fence was moved 2 meters into my property by the neighbor'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    description: 'Priority level of the conflict',
    enum: ConflictPriority,
    required: false,
    example: ConflictPriority.HIGH
  })
  @IsEnum(ConflictPriority)
  @IsOptional()
  priority?: ConflictPriority;

  @ApiProperty({ 
    description: 'Current status of the conflict',
    enum: ConflictStatus,
    required: false,
    example: ConflictStatus.INVESTIGATING
  })
  @IsEnum(ConflictStatus)
  @IsOptional()
  status?: ConflictStatus;

  @ApiProperty({ 
    description: 'Additional evidence or documentation',
    required: false,
    example: 'Survey report and witness statements attached'
  })
  @IsString()
  @IsOptional()
  evidence?: string;

  @ApiProperty({ 
    description: 'Names of other parties involved in the conflict',
    required: false,
    example: 'Jean Baptiste (neighboring property owner)'
  })
  @IsString()
  @IsOptional()
  involvedParties?: string;

  @ApiProperty({ 
    description: 'Resolution notes and outcome',
    required: false,
    example: 'Mediation successful. Boundary markers repositioned according to original survey.'
  })
  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}
