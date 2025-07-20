import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Workflow } from './workflow.entity';

export enum StepType {
  START = 'start',
  REVIEW = 'review',
  APPROVAL = 'approval',
  NOTIFICATION = 'notification',
  ASSIGNMENT = 'assignment',
  INSPECTION = 'inspection',
  PAYMENT = 'payment',
  COMPLETION = 'completion',
  END = 'end',
}

export enum StepCondition {
  ALWAYS = 'always',
  CONDITIONAL = 'conditional',
  PARALLEL = 'parallel',
  SEQUENTIAL = 'sequential',
}

@Entity('workflow_steps')
export class WorkflowStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: StepType,
  })
  stepType: StepType;

  @Column({ default: 1 })
  orderIndex: number;

  @Column({
    type: 'enum',
    enum: StepCondition,
    default: StepCondition.SEQUENTIAL,
  })
  condition: StepCondition;

  @Column('json', { nullable: true })
  assignedRoles: string[]; // Array of UserRole values

  @Column('json', { nullable: true })
  requiredFields: string[]; // Fields required in this step

  @Column('json', { nullable: true })
  validationRules: any; // Custom validation rules

  @Column('json', { nullable: true })
  notifications: any; // Notification configuration

  @Column({ default: 0 })
  timeoutHours: number; // Auto-escalation timeout

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Workflow, (workflow) => workflow.steps)
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'defaultAssigneeId' })
  defaultAssignee: User;
}
