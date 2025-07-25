import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandTransfer } from './entities/land-transfer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LandTransfer])],
  exports: [TypeOrmModule],
})
export class LandTransferModule {}
