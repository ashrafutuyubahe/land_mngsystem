import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { LandRecord } from '../../land-registration/entities/land-record.entity';
import { PermitStatus } from '../../common/enums/status.enum';

@Entity('construction_permits')
export class ConstructionPermit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  permitNumber: string;

  @Column()
  projectTitle: string;

  @Column('text')
  projectDescription: string;

  @Column('decimal', { precision: 15, scale: 2 })
  estimatedCost: number;

  @Column('decimal', { precision: 10, scale: 2 })
  constructionArea: number; // in square meters

  @Column()
  buildingType: string; // residential, commercial, etc.

  @Column()
  numberOfFloors: number;

  @Column({
    type: 'enum',
    enum: PermitStatus,
    default: PermitStatus.DRAFT,
  })
  status: PermitStatus;

  @Column('text', { nullable: true })
  documents: string; // JSON array of document URLs (plans, etc.)

  @Column({ nullable: true })
  submittedAt: Date;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column('text', { nullable: true })
  conditions: string;

  @Column('text', { nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  applicant: User;

  @ManyToOne(() => LandRecord)
  land: LandRecord;
}
