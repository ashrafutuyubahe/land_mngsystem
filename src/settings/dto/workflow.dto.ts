import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
} from 'class-validator';
import { WorkflowStatus } from '../enums/settings.enum';
import { StepType, StepCondition } from '../entities/workflow-step.entity';

export class CreateWorkflowDto {
  @ApiProperty({
    description: 'Name of the workflow',
    example: 'Land Registration Approval Process',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the workflow',
    required: false,
    example: 'Standard workflow for processing land registration applications',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Module this workflow applies to',
    example: 'land_registration',
  })
  @IsString()
  @IsNotEmpty()
  module: string;

  @ApiProperty({
    description: 'Whether this should be the default workflow for the module',
    required: false,
    example: true,
  })
  @IsOptional()
  isDefault?: boolean;
}

export class CreateWorkflowStepDto {
  @ApiProperty({
    description: 'Name of the workflow step',
    example: 'Initial Review',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the step',
    required: false,
    example: 'Initial review of application documents',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Type of step',
    enum: StepType,
    example: StepType.REVIEW,
  })
  @IsEnum(StepType)
  stepType: StepType;

  @ApiProperty({
    description: 'Order index of this step in the workflow',
    example: 1,
  })
  @IsNumber()
  orderIndex: number;

  @ApiProperty({
    description: 'Condition for step execution',
    enum: StepCondition,
    example: StepCondition.SEQUENTIAL,
  })
  @IsEnum(StepCondition)
  condition: StepCondition;

  @ApiProperty({
    description: 'Roles that can handle this step',
    type: [String],
    example: ['LAND_OFFICER', 'DISTRICT_ADMIN'],
  })
  @IsArray()
  @IsOptional()
  assignedRoles?: string[];

  @ApiProperty({
    description: 'Fields required to be completed in this step',
    type: [String],
    required: false,
    example: ['applicantName', 'landLocation'],
  })
  @IsArray()
  @IsOptional()
  requiredFields?: string[];

  @ApiProperty({
    description: 'Auto-escalation timeout in hours',
    required: false,
    example: 72,
  })
  @IsNumber()
  @IsOptional()
  timeoutHours?: number;
}

export class UpdateWorkflowDto {
  @ApiProperty({
    description: 'Name of the workflow',
    required: false,
    example: 'Land Registration Approval Process v2',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Description of the workflow',
    required: false,
    example: 'Updated workflow for processing land registration applications',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Status of the workflow',
    enum: WorkflowStatus,
    required: false,
    example: WorkflowStatus.ACTIVE,
  })
  @IsEnum(WorkflowStatus)
  @IsOptional()
  status?: WorkflowStatus;

  @ApiProperty({
    description: 'Whether this should be the default workflow for the module',
    required: false,
    example: true,
  })
  @IsOptional()
  isDefault?: boolean;
}

export class SettingsFilterDto {
  @ApiProperty({
    description: 'Filter by category',
    enum: Object.values(['system', 'workflow', 'notification', 'security']),
    required: false,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Search term for key or display name',
    required: false,
    example: 'tax',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filter by active status',
    required: false,
    example: true,
  })
  @IsOptional()
  isActive?: boolean;
}
