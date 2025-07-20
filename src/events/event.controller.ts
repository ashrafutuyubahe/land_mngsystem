import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EventService, LandEvent, LandEventType } from './event.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

export class TestEventDto {
  type: LandEventType;
  payload: any;
  metadata?: any;
}

@ApiTags('Event Management')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get('health')
  @ApiOperation({
    summary: 'Check RabbitMQ event service health',
    description:
      'Verify the connection to RabbitMQ and event publishing capabilities.',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy'] },
        timestamp: { type: 'string', format: 'date-time' },
        rabbitmq_connected: { type: 'boolean' },
      },
    },
  })
  async healthCheck() {
    const isHealthy = await this.eventService.checkHealth();

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      rabbitmq_connected: isHealthy,
    };
  }

  @Get('stats')
  @Roles(
    UserRole.LAND_OFFICER,
    UserRole.DISTRICT_ADMIN,
    UserRole.SYSTEM_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Get event system statistics',
    description:
      'Retrieve statistics about the event system and message queue status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Event statistics retrieved successfully',
  })
  async getEventStats() {
    return await this.eventService.getEventStats();
  }

  @Post('test')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Publish a test event',
    description:
      'Manually publish a test event to verify the event system is working. Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Test event published successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async publishTestEvent(@Body() testEvent: TestEventDto, @Request() req) {
    const event: LandEvent = {
      type: testEvent.type,
      payload: testEvent.payload,
      userId: req.user.id,
      metadata: {
        ...testEvent.metadata,
        test: true,
        publishedBy: req.user.email,
      },
    };

    await this.eventService.publishEvent(event);

    return {
      message: 'Test event published successfully',
      eventType: testEvent.type,
      timestamp: new Date().toISOString(),
      publishedBy: req.user.email,
    };
  }

  @Get('types')
  @ApiOperation({
    summary: 'Get all available event types',
    description:
      'List all available event types in the land administration system.',
  })
  @ApiResponse({
    status: 200,
    description: 'Event types retrieved successfully',
  })
  getEventTypes() {
    const eventTypes = Object.values(LandEventType).map((type) => ({
      type,
      description: this.getEventDescription(type),
      category: this.getEventCategory(type),
    }));

    return {
      eventTypes,
      total: eventTypes.length,
    };
  }

  private getEventDescription(eventType: LandEventType): string {
    const descriptions = {
      [LandEventType.LAND_REGISTERED]:
        'A new land record has been registered in the system',
      [LandEventType.LAND_UPDATED]: 'An existing land record has been updated',
      [LandEventType.LAND_STATUS_CHANGED]:
        'The status of a land record has changed',
      [LandEventType.LAND_OWNERSHIP_TRANSFERRED]:
        'Land ownership has been transferred',
      [LandEventType.TRANSFER_INITIATED]:
        'A land transfer process has been initiated',
      [LandEventType.TRANSFER_APPROVED]: 'A land transfer has been approved',
      [LandEventType.TRANSFER_REJECTED]: 'A land transfer has been rejected',
      [LandEventType.TRANSFER_COMPLETED]: 'A land transfer has been completed',
      [LandEventType.TRANSFER_CANCELLED]: 'A land transfer has been cancelled',
      [LandEventType.CONFLICT_REPORTED]: 'A land conflict has been reported',
      [LandEventType.CONFLICT_ASSIGNED]:
        'A conflict has been assigned to an officer',
      [LandEventType.CONFLICT_RESOLVED]: 'A land conflict has been resolved',
      [LandEventType.CONFLICT_ESCALATED]:
        'A conflict has been escalated to higher authority',
      [LandEventType.PERMIT_APPLIED]:
        'A construction permit application has been submitted',
      [LandEventType.PERMIT_APPROVED]:
        'A construction permit has been approved',
      [LandEventType.PERMIT_REJECTED]:
        'A construction permit has been rejected',
      [LandEventType.PERMIT_INSPECTION_SCHEDULED]:
        'An inspection has been scheduled for a permit',
      [LandEventType.PERMIT_INSPECTION_COMPLETED]:
        'A permit inspection has been completed',
      [LandEventType.TAX_ASSESSED]: 'Land tax has been assessed',
      [LandEventType.TAX_PAYMENT_RECEIVED]: 'A tax payment has been received',
      [LandEventType.TAX_OVERDUE]: 'Land tax payment is overdue',
      [LandEventType.USER_REGISTERED]: 'A new user has been registered',
      [LandEventType.USER_ROLE_CHANGED]: 'A user role has been changed',
      [LandEventType.BULK_SYNC_STARTED]:
        'A bulk synchronization operation has started',
      [LandEventType.BULK_SYNC_COMPLETED]:
        'A bulk synchronization operation has completed',
      [LandEventType.DATA_EXPORT_REQUESTED]: 'A data export has been requested',
    };

    return descriptions[eventType] || 'No description available';
  }

  private getEventCategory(eventType: LandEventType): string {
    if (eventType.startsWith('land.')) return 'Land Management';
    if (eventType.startsWith('transfer.')) return 'Land Transfer';
    if (eventType.startsWith('conflict.')) return 'Conflict Resolution';
    if (eventType.startsWith('permit.')) return 'Construction Permits';
    if (eventType.startsWith('tax.')) return 'Tax Management';
    if (eventType.startsWith('user.')) return 'User Management';
    if (eventType.startsWith('system.')) return 'System Operations';
    return 'Other';
  }
}
