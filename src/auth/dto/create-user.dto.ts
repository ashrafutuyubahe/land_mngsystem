import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  Length,
  Matches,
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

  @ApiProperty({
    example: '+250788123456',
    description: 'Rwanda phone number format',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+250[0-9]{9}$/, {
    message: 'Phone number must be in Rwanda format (+250xxxxxxxxx)',
  })
  phoneNumber?: string;

  @ApiProperty({
    example: '1199780123456789',
    description: 'Rwanda National ID (16 digits)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(16, 16, { message: 'National ID must be exactly 16 digits' })
  @Matches(/^[0-9]{16}$/, { message: 'National ID must contain only numbers' })
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
