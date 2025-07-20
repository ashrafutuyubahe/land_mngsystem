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
import { TransferStatus } from '../../common/enums/status.enum';

@Entity('land_transfers')
export class LandTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  transferNumber: string;

  @Column('decimal', { precision: 15, scale: 2 })
  transferValue: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  taxAmount: number;

  @Column({
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.INITIATED,
  })
  status: TransferStatus;

  @Column('text', { nullable: true })
  reason: string;

  @Column('text', { nullable: true })
  documents: string; // JSON array of document URLs

  @Column({ nullable: true })
  initiatedBy: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column('text', { nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.transfersAsCurrentOwner)
  currentOwner: User;

  @ManyToOne(() => User, (user) => user.transfersAsNewOwner)
  newOwner: User;

  @ManyToOne(() => LandRecord, (land) => land.transfers)
  land: LandRecord;
}
