import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conflict } from './entities/conflict.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conflict])],
  controllers: [],
  providers: [],
  exports: [],
})
export class ConflictResolutionModule {}
