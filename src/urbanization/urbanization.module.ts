import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConstructionPermit } from './entities/construction-permit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConstructionPermit])],
  controllers: [],
  providers: [],
  exports: [],
})
export class UrbanizationModule {}
