import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { LandStatus, LandUseType } from '../../common/enums/status.enum';
import { LandTransfer } from '../../land-transfer/entities/land-transfer.entity';
import { LandTax } from '../../land-taxes/entities/land-tax.entity';

@Entity('land_records')
export class LandRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  parcelNumber: string;

  @Column({ unique: true })
  upiNumber: string; // Unique Parcel Identifier

  @Column('decimal', { precision: 10, scale: 2 })
  area: number; // in square meters

  @Column()
  district: string;

  @Column()
  sector: string;

  @Column()
  cell: string;

  @Column()
  village: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: LandUseType,
    default: LandUseType.RESIDENTIAL,
  })
  landUseType: LandUseType;

  @Column({
    type: 'enum',
    enum: LandStatus,
    default: LandStatus.PENDING,
  })
  status: LandStatus;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  marketValue: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  governmentValue: number;

  // PostGIS geometry columns for spatial data
  @Column('geometry', {
    nullable: true,
    spatialFeatureType: 'Polygon',
    srid: 4326,
  })
  geometry: string; // PostGIS geometry for polygon

  @Column('geometry', {
    nullable: true,
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  centerPoint: string; // PostGIS geometry for center point

  @Column('decimal', { precision: 15, scale: 6, nullable: true })
  calculatedArea: number; // Area calculated by PostGIS

  @Column('text', { nullable: true })
  documents: string; // JSON array of document URLs

  @Column({ nullable: true })
  registeredBy: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column('text', { nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.landRecords)
  owner: User;

  @OneToMany(() => LandTransfer, (transfer) => transfer.land)
  transfers: LandTransfer[];

  @OneToMany(() => LandTax, (tax) => tax.land)
  taxes: LandTax[];
  ownerId: string;
}
