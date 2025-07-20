import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventController } from './event.controller';
import { EventService } from './event.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'LAND_EVENT_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              `amqp://${configService.get('RABBITMQ_USERNAME')}:${configService.get('RABBITMQ_PASSWORD')}@${configService.get('RABBITMQ_HOST')}:${configService.get('RABBITMQ_PORT')}${configService.get('RABBITMQ_VHOST')}`,
            ],
            queue: 'land_events_queue',
            queueOptions: {
              durable: true,
            },
            prefetchCount: 10,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService, ClientsModule],
})
export class EventModule {}
