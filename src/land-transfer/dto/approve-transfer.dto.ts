import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveTransferDto {
  @ApiProperty({ example: 'Transfer approved after verification' })
  @IsString()
  @IsNotEmpty()
  approvalNotes: string;
}
