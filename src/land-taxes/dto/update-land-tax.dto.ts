import { PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
  IsString,
} from 'class-validator';
import { CreateLandTaxDto } from './create-land-tax.dto';
import { TaxStatus } from '../../common/enums/status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLandTaxDto extends PartialType(CreateLandTaxDto) {
  @ApiProperty({ enum: TaxStatus, required: false })
  @IsOptional()
  @IsEnum(TaxStatus)
  status?: TaxStatus;

  @ApiProperty({
    example: 225000,
    description: 'Amount paid in RWF',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @ApiProperty({
    example: 25000,
    description: 'Penalty amount in RWF',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  penaltyAmount?: number;

  @ApiProperty({
    example: '2024-06-15',
    description: 'Payment date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  paidDate?: string;

  @ApiProperty({
    example: 'PAY-2024-001',
    description: 'Payment reference',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentReference?: string;
    taxAmount: number;
}
