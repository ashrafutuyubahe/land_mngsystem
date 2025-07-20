import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import { RedisService } from './redis.service';


@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisConfig: any = {
          store: redisStore,
          host: configService.get('REDIS_HOST', 'localhost'),
          port: parseInt(configService.get('REDIS_PORT', '6379')),
          db: parseInt(configService.get('REDIS_DB', '0')),
          ttl: 300, // Default TTL: 5 minutes
          max: 100, // Maximum number of items in cache
          isGlobal: true,
        };

        // Only add password if it exists
        const password = configService.get('REDIS_PASSWORD');
        if (password) {
          redisConfig.password = password;
        }

        return redisConfig;
      },
      inject: [ConfigService],
    }),
  ],
  providers: [RedisService],
  exports: [CacheModule, RedisService],
})
export class RedisModule {}
