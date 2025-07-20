import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessPaymentDto {
  @ApiProperty({ example: 225000, description: 'Payment amount in RWF' })
  @IsNumber()
  @Min(0)
  paidAmount: number;

  @ApiProperty({
    example: 'PAY-2024-001',
    description: 'Payment reference number',
  })
  @IsString()
  @IsNotEmpty()
  paymentReference: string;

  @ApiProperty({ example: 'Payment via mobile money', required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ example: 'Payment processed successfully', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
