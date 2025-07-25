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
import { Polygon, Point } from 'geojson';

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

  @ApiProperty({
    example: {
      type: 'Polygon',
      coordinates: [
        [
          [30.056, -1.944],
          [30.057, -1.944],
          [30.057, -1.945],
          [30.056, -1.945],
          [30.056, -1.944], // Close the polygon
        ],
      ],
    },
    description: 'GeoJSON Polygon representing land boundaries',
    required: false,
  })
  @IsOptional()
  @IsObject()
  geometry?: Polygon | Point;

  @ApiProperty({ example: '["doc1.pdf", "doc2.pdf"]', required: false })
  @IsOptional()
  @IsString()
  documents?: string;
}
