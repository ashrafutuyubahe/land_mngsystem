import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { LandRecord } from '../../land-registration/entities/land-record.entity';
import { ConstructionType, PermitStatus } from '../enums/construction.enum';
import { Inspection } from './inspection.entity';

@Entity('construction_permits')
export class ConstructionPermit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  permitNumber: string;

  @Column()
  projectTitle: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ConstructionType,
  })
  constructionType: ConstructionType;

  @Column('decimal', { precision: 15, scale: 2 })
  estimatedCost: number;

  @Column('decimal', { precision: 10, scale: 2 })
  constructionArea: number; // in square meters

  @Column({ default: 1 })
  numberOfFloors: number;

  @Column({ nullable: true })
  contractor: string;

  @Column({ nullable: true })
  architect: string;

  @Column('text', { nullable: true })
  technicalSpecs: string;

  @Column()
  plannedStartDate: Date;

  @Column()
  plannedCompletionDate: Date;

  @Column({ nullable: true })
  actualStartDate: Date;

  @Column({ nullable: true })
  actualCompletionDate: Date;

  @Column({
    type: 'enum',
    enum: PermitStatus,
    default: PermitStatus.DRAFT,
  })
  status: PermitStatus;

  @Column('text', { nullable: true })
  documents: string; // JSON array of document URLs

  @Column({ nullable: true })
  submittedAt: Date;

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column('text', { nullable: true })
  conditions: string;

  @Column('text', { nullable: true })
  reviewComments: string;

  @Column('text', { nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'applicantId' })
  applicant: User;

  @ManyToOne(() => LandRecord, { eager: true })
  @JoinColumn({ name: 'landRecordId' })
  landRecord: LandRecord;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User;

  @OneToMany(() => Inspection, (inspection) => inspection.permit)
  inspections: Inspection[];
}

export { ConstructionType, PermitStatus };

