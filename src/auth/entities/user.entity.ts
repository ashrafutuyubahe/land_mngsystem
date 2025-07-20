import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { LandRecord } from '../../land-registration/entities/land-record.entity';
import { LandTransfer } from '../../land-transfer/entities/land-transfer.entity';
import { Conflict } from '../../conflict-resolution/entities/conflict.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  nationalId: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CITIZEN,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  sector: string;

  @Column({ nullable: true })
  cell: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => LandRecord, (landRecord) => landRecord.owner)
  landRecords: LandRecord[];

  @OneToMany(() => LandTransfer, (transfer) => transfer.currentOwner)
  transfersAsCurrentOwner: LandTransfer[];

  @OneToMany(() => LandTransfer, (transfer) => transfer.newOwner)
  transfersAsNewOwner: LandTransfer[];

  @OneToMany(() => Conflict, (conflict) => conflict.complainant)
  conflicts: Conflict[];
}
export { UserRole };

