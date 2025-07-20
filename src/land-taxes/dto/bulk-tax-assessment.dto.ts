import { IsNumber, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkTaxAssessmentDto {
  @ApiProperty({ example: 2024, description: 'Tax year for bulk assessment' })
  @IsNumber()
  @Min(2020)
  @Max(2030)
  taxYear: number;

  @ApiProperty({
    example: 0.005,
    description: 'Default tax rate (0.5% = 0.005)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  defaultTaxRate?: number;

  @ApiProperty({
    example: 'Kigali',
    description: 'District to assess (leave empty for all)',
    required: false,
  })
  @IsOptional()
  district?: string;

  @ApiProperty({
    example: 'Nyarugenge',
    description: 'Sector to assess',
    required: false,
  })
  @IsOptional()
  sector?: string;
}
