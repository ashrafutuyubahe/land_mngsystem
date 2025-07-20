import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LandRegistrationModule } from './land-registration/land-registration.module';
import { LandTransferModule } from './land-transfer/land-transfer.module';
import { LandTaxesModule } from './land-taxes/land-taxes.module';
import { ConflictResolutionModule } from './conflict-resolution/conflict-resolution.module';
import { UrbanizationModule } from './urbanization/urbanization.module';
import { AuthModule } from './auth/auth.module';
import { SettingsModule } from './settings/settings.module';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true, 
    }),
    LandRegistrationModule, LandTransferModule, LandTaxesModule, ConflictResolutionModule, UrbanizationModule, AuthModule, SettingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
