import { IsString, IsNotEmpty, IsNumber, IsUUID, IsOptional, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLandTaxDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Land record ID' })
  @IsUUID()
  @IsNotEmpty()
  landId: string;

  @ApiProperty({ example: 2024, description: 'Tax year' })
  @IsNumber()
  @Min(2020)
  @Max(2030)
  taxYear: number;

  @ApiProperty({ example: 45000000, description: 'Assessed property value in RWF' })
  @IsNumber()
  @Min(0)
  assessedValue: number;

  @ApiProperty({ example: 0.005, description: 'Tax rate as decimal (0.5% = 0.005)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  taxRate?: number;

  @ApiProperty({ example: '2024-12-31', description: 'Due date for tax payment', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ example: 'Annual property tax assessment', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
