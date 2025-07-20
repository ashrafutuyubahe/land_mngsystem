import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateLandTransferDto } from './create-land-transfer.dto';
import { TransferStatus } from '../../common/enums/status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLandTransferDto extends PartialType(CreateLandTransferDto) {
  @ApiProperty({ enum: TransferStatus, required: false })
  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;
}
