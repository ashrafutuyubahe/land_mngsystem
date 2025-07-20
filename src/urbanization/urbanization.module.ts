import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UrbanizationController } from './urbanization.controller';
import { UrbanizationService } from './urbanization.service';
import { ConstructionPermit } from './entities/construction-permit.entity';
import { Inspection } from './entities/inspection.entity';
import { LandRecord } from '../land-registration/entities/land-record.entity';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConstructionPermit,
      Inspection,
      LandRecord,
      User,
    ]),
  ],
  controllers: [UrbanizationController],
  providers: [UrbanizationService],
  exports: [UrbanizationService],
})
export class UrbanizationModule {}
