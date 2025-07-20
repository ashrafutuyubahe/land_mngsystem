import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '+250788123456', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: '1234567890123456', required: false })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiProperty({ enum: UserRole, default: UserRole.CITIZEN, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ example: 'Kigali', required: false })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ example: 'Nyarugenge', required: false })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiProperty({ example: 'Kiyovu', required: false })
  @IsOptional()
  @IsString()
  cell?: string;
}
