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
import { ConflictStatus } from '../../common/enums/status.enum';

@Entity('conflicts')
export class Conflict {
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
    enum: ConflictStatus,
    default: ConflictStatus.SUBMITTED,
  })
  status: ConflictStatus;

  @Column('text', { nullable: true })
  evidence: string; // JSON array of evidence URLs

  @Column({ nullable: true })
  mediatorId: string;

  @Column({ nullable: true })
  mediationDate: Date;

  @Column('text', { nullable: true })
  resolution: string;

  @Column({ nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  resolvedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.conflicts)
  complainant: User;

  @ManyToOne(() => LandRecord, { nullable: true })
  relatedLand: LandRecord;
}
