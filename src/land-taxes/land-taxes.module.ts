import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandTaxesController } from './land-taxes.controller';
import { LandTaxesService } from './land-taxes.service';
import { LandTax } from './entities/land-tax.entity';
import { LandRecord } from '../land-registration/entities/land-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LandTax, LandRecord])],
  controllers: [LandTaxesController],
  providers: [LandTaxesService],
  exports: [LandTaxesService],
})
export class LandTaxesModule {}
