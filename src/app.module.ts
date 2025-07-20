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
import { ClickHouseModule } from './clickhouse/clickhouse.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    LandRegistrationModule,
    LandTransferModule,
    LandTaxesModule,
    ConflictResolutionModule,
    UrbanizationModule,
    AuthModule,
    SettingsModule,
    ClickHouseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
