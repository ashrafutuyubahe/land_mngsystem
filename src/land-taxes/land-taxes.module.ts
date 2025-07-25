import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandTax } from './entities/land-tax.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LandTax])],
  exports: [TypeOrmModule],
})
export class LandTaxesModule {}
