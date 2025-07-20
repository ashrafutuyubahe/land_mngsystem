import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
} from 'class-validator';
import {
  SettingCategory,
  SettingType,
  SettingScope,
} from '../enums/settings.enum';

export class UpdateSystemSettingDto {
  @ApiProperty({
    description: 'Unique key identifier for the setting',
    required: false,
    example: 'land_tax_default_rate',
  })
  @IsString()
  @IsOptional()
  key?: string;

  @ApiProperty({
    description: 'The value of the setting',
    required: false,
    example: '0.6',
  })
  @IsString()
  @IsOptional()
  value?: string;

  @ApiProperty({
    description: 'Default value for the setting',
    required: false,
    example: '0.5',
  })
  @IsString()
  @IsOptional()
  defaultValue?: string;

  @ApiProperty({
    description: 'Human-readable display name',
    required: false,
    example: 'Default Land Tax Rate',
  })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiProperty({
    description: 'Description of what this setting controls',
    required: false,
    example: 'Default percentage rate for land tax calculations',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Category of the setting',
    enum: SettingCategory,
    required: false,
    example: SettingCategory.LAND_TAXES,
  })
  @IsEnum(SettingCategory)
  @IsOptional()
  category?: SettingCategory;

  @ApiProperty({
    description: 'Data type of the setting value',
    enum: SettingType,
    required: false,
    example: SettingType.NUMBER,
  })
  @IsEnum(SettingType)
  @IsOptional()
  dataType?: SettingType;

  @ApiProperty({
    description: 'Scope of the setting application',
    enum: SettingScope,
    required: false,
    example: SettingScope.GLOBAL,
  })
  @IsEnum(SettingScope)
  @IsOptional()
  scope?: SettingScope;

  @ApiProperty({
    description: 'Whether the setting is active',
    required: false,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Whether the setting is read-only',
    required: false,
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isReadOnly?: boolean;

  @ApiProperty({
    description: 'Whether the setting contains sensitive information',
    required: false,
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isSecret?: boolean;

  @ApiProperty({
    description: 'Available options for enum type settings',
    required: false,
    type: [String],
    example: ['pending', 'approved', 'rejected'],
  })
  @IsArray()
  @IsOptional()
  enumOptions?: string[];

  @ApiProperty({
    description: 'Unit of measurement for numeric settings',
    required: false,
    example: 'percentage',
  })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({
    description: 'Sort order for displaying settings',
    required: false,
    example: 1,
  })
  @IsNumber()
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
