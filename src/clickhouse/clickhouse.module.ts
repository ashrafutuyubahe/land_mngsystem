import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AnalyticsController } from './analytics.controller';
import { ClickHouseService } from './clickhouse.service';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [AnalyticsController],
  providers: [
    {
      provide: 'CLICKHOUSE_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const { createClient } = await import('@clickhouse/client');

        return createClient({
          host: `http://${configService.get('CLICKHOUSE_HOST', 'localhost')}:${configService.get('CLICKHOUSE_PORT', '8123')}`,
          username: configService.get('CLICKHOUSE_USERNAME', 'default'),
          password: configService.get('CLICKHOUSE_PASSWORD', ''),
          database: configService.get('CLICKHOUSE_DATABASE', 'land_analytics'),
          clickhouse_settings: {
            async_insert: 1,
            wait_for_async_insert: 0,
          },
          request_timeout: 30000,
          max_open_connections: 10,
        });
      },
      inject: [ConfigService],
    },
    ClickHouseService,
  ],
  exports: ['CLICKHOUSE_CLIENT', ClickHouseService],
})
export class ClickHouseModule {}
