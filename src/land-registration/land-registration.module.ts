import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandRegistrationService } from './land-registration.service';
import { LandRegistrationController } from './land-registration.controller';
import { LandRecord } from './entities/land-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LandRecord])],
  controllers: [LandRegistrationController],
  providers: [LandRegistrationService],
  exports: [LandRegistrationService],
})
export class LandRegistrationModule {}
