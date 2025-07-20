import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { LandRecord } from '../../land-registration/entities/land-record.entity';
import { TaxStatus } from '../../common/enums/status.enum';

@Entity('land_taxes')
export class LandTax {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  taxYear: number;

  @Column('decimal', { precision: 15, scale: 2 })
  assessedValue: number;

  @Column('decimal', { precision: 5, scale: 4 })
  taxRate: number; // percentage

  @Column('decimal', { precision: 15, scale: 2 })
  taxAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  paidAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  penaltyAmount: number;

  @Column({
    type: 'enum',
    enum: TaxStatus,
    default: TaxStatus.PENDING,
  })
  status: TaxStatus;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  paidDate: Date;

  @Column({ nullable: true })
  paymentReference: string;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => LandRecord, (land) => land.taxes)
  land: LandRecord;
}
