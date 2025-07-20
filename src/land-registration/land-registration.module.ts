import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandRegistrationService } from './land-registration.service';
import { LandRegistrationController } from './land-registration.controller';
import { LandRecord } from './entities/land-record.entity';
import { ClickHouseModule } from '../clickhouse/clickhouse.module';
import { EventModule } from '../events/event.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LandRecord]),
    ClickHouseModule,
    EventModule,
  ],
  controllers: [LandRegistrationController],
  providers: [LandRegistrationService],
  exports: [LandRegistrationService],
})
export class LandRegistrationModule {}
