import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ConflictType, ConflictPriority } from '../enums/conflict.enum';

export class CreateConflictDto {
  @ApiProperty({ 
    description: 'ID of the land record in dispute',
    example: 'e12f8c3a-4b5d-6e7f-8a9b-0c1d2e3f4a5b'
  })
  @IsUUID()
  @IsNotEmpty()
  landRecordId: string;

  @ApiProperty({ 
    description: 'Type of conflict',
    enum: ConflictType,
    example: ConflictType.BOUNDARY_DISPUTE
  })
  @IsEnum(ConflictType)
  @IsNotEmpty()
  conflictType: ConflictType;

  @ApiProperty({ 
    description: 'Brief title describing the conflict',
    example: 'Boundary dispute between plots 123 and 124',
    maxLength: 200
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ 
    description: 'Detailed description of the conflict',
    example: 'The boundary fence was moved 2 meters into my property by the neighbor'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ 
    description: 'Priority level of the conflict',
    enum: ConflictPriority,
    example: ConflictPriority.MEDIUM
  })
  @IsEnum(ConflictPriority)
  @IsNotEmpty()
  priority: ConflictPriority;

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
}
