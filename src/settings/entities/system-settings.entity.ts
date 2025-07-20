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
import {
  SettingCategory,
  SettingType,
  SettingScope,
} from '../enums/settings.enum';

@Entity('system_settings')
export class SystemSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column('text')
  value: string;

  @Column('text', { nullable: true })
  defaultValue: string;

  @Column({ nullable: true })
  displayName: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: SettingCategory,
    default: SettingCategory.SYSTEM,
  })
  category: SettingCategory;

  @Column({
    type: 'enum',
    enum: SettingType,
    default: SettingType.STRING,
  })
  dataType: SettingType;

  @Column({
    type: 'enum',
    enum: SettingScope,
    default: SettingScope.GLOBAL,
  })
  scope: SettingScope;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isReadOnly: boolean;

  @Column({ default: false })
  isSecret: boolean; // For sensitive settings like passwords

  @Column('json', { nullable: true })
  validationRules: any; // JSON object with validation rules

  @Column('json', { nullable: true })
  enumOptions: string[]; // For ENUM type settings

  @Column({ nullable: true })
  unit: string; // For numeric settings (days, hours, MB, etc.)

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updatedById' })
  updatedBy: User;
  type: any;
  options: any;
}

export { SettingCategory, SettingType, SettingScope };
