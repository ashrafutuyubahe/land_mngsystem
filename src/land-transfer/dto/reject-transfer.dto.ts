import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectTransferDto {
  @ApiProperty({ example: 'Missing required documentation' })
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}
