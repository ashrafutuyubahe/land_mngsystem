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

  @ApiProperty({
    example: {
      latitude: -1.944,
      longitude: 30.056,
      boundaries: [
        { lat: -1.944, lng: 30.056 },
        { lat: -1.945, lng: 30.057 },
        { lat: -1.946, lng: 30.057 },
        { lat: -1.946, lng: 30.056 },
      ],
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  coordinates?: {
    latitude: number;
    longitude: number;
    boundaries: Array<{ lat: number; lng: number }>;
  };

  @ApiProperty({ example: '["doc1.pdf", "doc2.pdf"]', required: false })
  @IsOptional()
  @IsString()
  documents?: string;
}
