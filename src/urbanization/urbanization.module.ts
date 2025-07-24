import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UrbanizationService } from './urbanization.service';
import { UrbanizationController } from './urbanization.controller';
import { ConstructionPermit } from './entities/construction-permit.entity';
import { Inspection } from './entities/inspection.entity';
import { LandRecord } from '../land-registration/entities/land-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConstructionPermit, Inspection, LandRecord]),
  ],
  controllers: [UrbanizationController],
  providers: [UrbanizationService],
  exports: [UrbanizationService],
})
export class UrbanizationModule {}
