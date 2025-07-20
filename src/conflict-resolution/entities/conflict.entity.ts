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
import { LandRecord } from '../../land-registration/entities/land-record.entity';
import {
  ConflictType,
  ConflictPriority,
  ConflictStatus,
} from '../enums/conflict.enum';

@Entity('conflicts')
export class Conflict {
  [x: string]: any;
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  caseNumber: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ConflictType,
  })
  conflictType: ConflictType;

  @Column({
    type: 'enum',
    enum: ConflictPriority,
    default: ConflictPriority.MEDIUM,
  })
  priority: ConflictPriority;

  @Column({
    type: 'enum',
    enum: ConflictStatus,
    default: ConflictStatus.REPORTED,
  })
  status: ConflictStatus;

  @Column('text', { nullable: true })
  evidence: string;

  @Column({ nullable: true })
  involvedParties: string;

  @Column('text', { nullable: true })
  resolutionNotes: string;

  @Column({ nullable: true })
  assignmentNotes: string;

  @Column()
  reportedAt: Date;

  @Column({ nullable: true })
  assignedAt: Date;

  @Column({ nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'reportedById' })
  reportedBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolvedById' })
  resolvedBy: User;

  @ManyToOne(() => LandRecord, { eager: true })
  @JoinColumn({ name: 'landRecordId' })
  landRecord: LandRecord;
}

export { ConflictType, ConflictPriority, ConflictStatus };
