import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConflictResolutionController } from './conflict-resolution.controller';
import { ConflictResolutionService } from './conflict-resolution.service';
import { Conflict } from './entities/conflict.entity';
import { LandRecord } from '../land-registration/entities/land-record.entity';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conflict, LandRecord, User])],
  controllers: [ConflictResolutionController],
  providers: [ConflictResolutionService],
  exports: [ConflictResolutionService],
})
export class ConflictResolutionModule {}
