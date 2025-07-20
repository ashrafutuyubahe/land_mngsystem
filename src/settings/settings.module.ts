import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSettings } from './entities/system-settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemSettings])],
  controllers: [],
  providers: [],
  exports: [],
})
export class SettingsModule {}
