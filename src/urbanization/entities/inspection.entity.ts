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
import { ConstructionPermit } from './construction-permit.entity';
import { InspectionType, InspectionStatus } from '../enums/construction.enum';

@Entity('inspections')
export class Inspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  inspectionNumber: string;

  @Column({
    type: 'enum',
    enum: InspectionType,
  })
  type: InspectionType;

  @Column({
    type: 'enum',
    enum: InspectionStatus,
    default: InspectionStatus.SCHEDULED,
  })
  status: InspectionStatus;

  @Column()
  scheduledDate: Date;

  @Column({ nullable: true })
  completedDate: Date;

  @Column('text', { nullable: true })
  notes: string;

  @Column('text', { nullable: true })
  findings: string;

  @Column('text', { nullable: true })
  recommendations: string;

  @Column('text', { nullable: true })
  deficiencies: string; // Issues found during inspection

  @Column('text', { nullable: true })
  photos: string; // JSON array of photo URLs

  @Column({ nullable: true })
  nextInspectionDate: Date;

  @Column({ default: false })
  isReinspection: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => ConstructionPermit, { eager: true })
  @JoinColumn({ name: 'permitId' })
  permit: ConstructionPermit;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'inspectorId' })
  inspector: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'scheduledById' })
  scheduledBy: User;
}
