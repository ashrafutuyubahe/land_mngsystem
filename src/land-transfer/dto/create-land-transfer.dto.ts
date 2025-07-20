import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLandTransferDto {
  @ApiProperty({ example: 'TRF-2024-001' })
  @IsString()
  @IsNotEmpty()
  transferNumber: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Land record ID to transfer',
  })
  @IsUUID()
  @IsNotEmpty()
  landId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'New owner user ID',
  })
  @IsUUID()
  @IsNotEmpty()
  newOwnerId: string;

  @ApiProperty({ example: 50000000, description: 'Transfer value in RWF' })
  @IsNumber()
  @Min(0)
  transferValue: number;

  @ApiProperty({
    example: 2500000,
    description: 'Tax amount in RWF',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiProperty({ example: 'Sale of property', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ example: '["contract.pdf", "id_copy.pdf"]', required: false })
  @IsOptional()
  @IsString()
  documents?: string;
}
