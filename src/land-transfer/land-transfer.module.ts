import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandTransferController } from './land-transfer.controller';
import { LandTransferService } from './land-transfer.service';
import { LandTransfer } from './entities/land-transfer.entity';
import { LandRecord } from '../land-registration/entities/land-record.entity';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LandTransfer, LandRecord, User])],
  controllers: [LandTransferController],
  providers: [LandTransferService],
  exports: [LandTransferService],
})
export class LandTransferModule {}
