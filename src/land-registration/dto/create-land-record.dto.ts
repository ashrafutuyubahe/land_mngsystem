import { Polygon } from 'geojson';

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsObject,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LandUseType } from '../../common/enums/status.enum';

export class CreateLandRecordDto {
  @ApiProperty({ example: 'KG-001-2024-001' })
  @IsString()
  @IsNotEmpty()
  parcelNumber: string;

  @ApiProperty({ example: 'UPI-001-2024-001' })
  @IsString()
  @IsNotEmpty()
  upiNumber: string;

  @ApiProperty({ example: 500.75, description: 'Area in square meters' })
  @IsNumber()
  @Min(0)
  area: number;

  @ApiProperty({ example: 'Kigali' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ example: 'Nyarugenge' })
  @IsString()
  @IsNotEmpty()
  sector: string;

  @ApiProperty({ example: 'Kiyovu' })
  @IsString()
  @IsNotEmpty()
  cell: string;

  @ApiProperty({ example: 'Kiyovu I' })
  @IsString()
  @IsNotEmpty()
  village: string;

  @ApiProperty({ example: 'Residential plot with garden', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: LandUseType, default: LandUseType.RESIDENTIAL })
  @IsEnum(LandUseType)
  landUseType: LandUseType;

  @ApiProperty({
    example: 50000000,
    description: 'Market value in RWF',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  marketValue?: number;

  @ApiProperty({
    example: 45000000,
    description: 'Government assessed value in RWF',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  governmentValue?: number;

  @ApiProperty({ example: '["doc1.pdf", "doc2.pdf"]', required: false })
  @IsOptional()
  @IsString()
  documents?: string;

  @ApiProperty({
    example: {
      type: 'Polygon',
      coordinates: [
        [
          [30.0, -1.9],
          [30.1, -1.9],
          [30.1, -1.95],
          [30.0, -1.95],
          [30.0, -1.9],
        ],
      ],
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  geometry?: Polygon;
}
