import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisService } from './redis.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const password = configService.get('REDIS_PASSWORD');

        const redisConfig: any = {
          store: redisStore,
          host: configService.get('REDIS_HOST', 'localhost'),
          port: parseInt(configService.get('REDIS_PORT', '6379')),
          db: parseInt(configService.get('REDIS_DB', '0')),
          ttl: 300000, // 5 min
          max: 100,
        };

        // Only added password if it's set and not empty
        if (
          password &&
          password.trim() !== '' &&
          password.trim() !== 'undefined'
        ) {
          redisConfig.password = password.trim();
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
