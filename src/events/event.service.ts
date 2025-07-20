import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

// Event Types for Land Administration
export enum LandEventType {
  // Land Registration Events
  LAND_REGISTERED = 'land.registered',
  LAND_UPDATED = 'land.updated',
  LAND_STATUS_CHANGED = 'land.status.changed',
  LAND_OWNERSHIP_TRANSFERRED = 'land.ownership.transferred',

  // Land Transfer Events
  TRANSFER_INITIATED = 'transfer.initiated',
  TRANSFER_APPROVED = 'transfer.approved',
  TRANSFER_REJECTED = 'transfer.rejected',
  TRANSFER_COMPLETED = 'transfer.completed',
  TRANSFER_CANCELLED = 'transfer.cancelled',

  // Conflict Resolution Events
  CONFLICT_REPORTED = 'conflict.reported',
  CONFLICT_ASSIGNED = 'conflict.assigned',
  CONFLICT_RESOLVED = 'conflict.resolved',
  CONFLICT_ESCALATED = 'conflict.escalated',

  // Construction Permit Events
  PERMIT_APPLIED = 'permit.applied',
  PERMIT_APPROVED = 'permit.approved',
  PERMIT_REJECTED = 'permit.rejected',
  PERMIT_INSPECTION_SCHEDULED = 'permit.inspection.scheduled',
  PERMIT_INSPECTION_COMPLETED = 'permit.inspection.completed',

  // Tax Events
  TAX_ASSESSED = 'tax.assessed',
  TAX_PAYMENT_RECEIVED = 'tax.payment.received',
  TAX_OVERDUE = 'tax.overdue',

  // User Events
  USER_REGISTERED = 'user.registered',
  USER_ROLE_CHANGED = 'user.role.changed',

  // System Events
  BULK_SYNC_STARTED = 'system.bulk.sync.started',
  BULK_SYNC_COMPLETED = 'system.bulk.sync.completed',
  DATA_EXPORT_REQUESTED = 'system.data.export.requested',
}

export interface LandEvent {
  id?: string;
  type: LandEventType;
  payload: any;
  userId?: string;
  timestamp?: Date;
  metadata?: {
    source: string;
    version: string;
    correlationId?: string;
    [key: string]: any;
  };
}

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    @Inject('LAND_EVENT_SERVICE') private readonly eventClient: ClientProxy,
  ) {}

  async onModuleInit() {
    try {
      await this.eventClient.connect();
      this.logger.log('Successfully connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
    }
  }

  async onModuleDestroy() {
    await this.eventClient.close();
  }

  // Generic event publishing method
  async publishEvent(event: LandEvent): Promise<void> {
    try {
      const enrichedEvent: LandEvent = {
        ...event,
        id: event.id || this.generateEventId(),
        timestamp: event.timestamp || new Date(),
        metadata: {
          source: 'land-admin-api',
          version: '1.0.0',
          ...event.metadata,
        },
      };

      this.eventClient.emit(event.type, enrichedEvent);
      this.logger.log(`Published event: ${event.type}`, {
        eventId: enrichedEvent.id,
      });
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event.type}`, error);
      throw error;
    }
  }

  // Land Registration Events
  async publishLandRegistered(landRecord: any, userId: string): Promise<void> {
    await this.publishEvent({
      type: LandEventType.LAND_REGISTERED,
      payload: {
        landId: landRecord.id,
        parcelNumber: landRecord.parcelNumber,
        upiNumber: landRecord.upiNumber,
        area: landRecord.area,
        district: landRecord.district,
        sector: landRecord.sector,
        cell: landRecord.cell,
        ownerId: landRecord.owner?.id,
        ownerName: `${landRecord.owner?.firstName} ${landRecord.owner?.lastName}`,
        landUse: landRecord.landUse,
        status: landRecord.status,
      },
      userId,
      metadata: {
        source: 'land-registration-module',
        version: '1.0.0',
        action: 'create',
      },
    });
  }

  async publishLandUpdated(
    landRecord: any,
    userId: string,
    changes: any,
  ): Promise<void> {
    await this.publishEvent({
      type: LandEventType.LAND_UPDATED,
      payload: {
        landId: landRecord.id,
        parcelNumber: landRecord.parcelNumber,
        changes,
        updatedBy: userId,
      },
      userId,
      metadata: {
        source: 'land-registration-module',
        version: '1.0.0',
        action: 'update',
      },
    });
  }

  async publishLandStatusChanged(
    landRecord: any,
    oldStatus: string,
    newStatus: string,
    userId: string,
  ): Promise<void> {
    await this.publishEvent({
      type: LandEventType.LAND_STATUS_CHANGED,
      payload: {
        landId: landRecord.id,
        parcelNumber: landRecord.parcelNumber,
        oldStatus,
        newStatus,
        changedBy: userId,
      },
      userId,
      metadata: {
        source: 'land-registration-module',
         version: '1.0.0',
        action: 'status-change',
      },
    });
  }

  // Land Transfer Events
  async publishTransferInitiated(transfer: any, userId: string): Promise<void> {
    await this.publishEvent({
      type: LandEventType.TRANSFER_INITIATED,
      payload: {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        landId: transfer.land?.id,
        parcelNumber: transfer.land?.parcelNumber,
        currentOwnerId: transfer.currentOwner?.id,
        currentOwnerName: `${transfer.currentOwner?.firstName} ${transfer.currentOwner?.lastName}`,
        newOwnerId: transfer.newOwner?.id,
        newOwnerName: `${transfer.newOwner?.firstName} ${transfer.newOwner?.lastName}`,
        transferValue: transfer.transferValue,
        transferType: transfer.transferType,
      },
      userId,
      metadata: {
        source: 'land-transfer-module',
         version: '1.0.0',
        action: 'initiate',
      },
    });
  }

  async publishTransferApproved(
    transfer: any,
    approvedBy: string,
  ): Promise<void> {
    await this.publishEvent({
      type: LandEventType.TRANSFER_APPROVED,
      payload: {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        landId: transfer.land?.id,
        approvedBy,
        approvedAt: new Date(),
      },
      userId: approvedBy,
      metadata: {
        source: 'land-transfer-module',
         version: '1.0.0',
        action: 'approve',
      },
    });
  }

  async publishTransferCompleted(
    transfer: any,
    completedBy: string,
  ): Promise<void> {
    await this.publishEvent({
      type: LandEventType.TRANSFER_COMPLETED,
      payload: {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        landId: transfer.land?.id,
        newOwnerId: transfer.newOwner?.id,
        completedBy,
        completedAt: new Date(),
      },
      userId: completedBy,
      metadata: {
        source: 'land-transfer-module',
         version: '1.0.0',
        action: 'complete',
      },
    });
  }

  // Conflict Resolution Events
  async publishConflictReported(conflict: any, userId: string): Promise<void> {
    await this.publishEvent({
      type: LandEventType.CONFLICT_REPORTED,
      payload: {
        conflictId: conflict.id,
        caseNumber: conflict.caseNumber,
        landId: conflict.land?.id,
        conflictType: conflict.conflictType,
        priority: conflict.priority,
        reportedBy: userId,
        description: conflict.description,
      },
      userId,
      metadata: {
        source: 'conflict-resolution-module',
         version: '1.0.0',
        action: 'report',
      },
    });
  }

  async publishConflictResolved(
    conflict: any,
    resolvedBy: string,
  ): Promise<void> {
    await this.publishEvent({
      type: LandEventType.CONFLICT_RESOLVED,
      payload: {
        conflictId: conflict.id,
        caseNumber: conflict.caseNumber,
        resolutionType: conflict.resolutionType,
        resolvedBy,
        resolvedAt: new Date(),
      },
      userId: resolvedBy,
      metadata: {
        source: 'conflict-resolution-module',
         version: '1.0.0',
        action: 'resolve',
      },
    });
  }

  // Construction Permit Events
  async publishPermitApplied(permit: any, userId: string): Promise<void> {
    await this.publishEvent({
      type: LandEventType.PERMIT_APPLIED,
      payload: {
        permitId: permit.id,
        permitNumber: permit.permitNumber,
        landId: permit.land?.id,
        projectTitle: permit.projectTitle,
        constructionType: permit.constructionType,
        estimatedCost: permit.estimatedCost,
        applicantId: userId,
      },
      userId,
      metadata: {
        source: 'urbanization-module',
         version: '1.0.0',
        action: 'apply',
      },
    });
  }

  // System Events
  async publishBulkSyncStarted(
    operation: string,
    userId: string,
    totalRecords: number,
  ): Promise<void> {
    await this.publishEvent({
      type: LandEventType.BULK_SYNC_STARTED,
      payload: {
        operation,
        totalRecords,
        startedBy: userId,
        startedAt: new Date(),
      },
      userId,
      metadata: {
        source: 'system',
         version: '1.0.0',
        action: 'bulk-sync-start',

      },
    });
  }

  async publishBulkSyncCompleted(
    operation: string,
    userId: string,
    processedRecords: number,
    errors: any[],
  ): Promise<void> {
    await this.publishEvent({
      type: LandEventType.BULK_SYNC_COMPLETED,
      payload: {
        operation,
        processedRecords,
        errorCount: errors.length,
        errors: errors.slice(0, 10), // Only include first 10 errors
        completedBy: userId,
        completedAt: new Date(),
      },
      userId,
      metadata: {
        source: 'system',
         version: '1.0.0',
        action: 'bulk-sync-complete',
      },
    });
  }

  // Utility methods
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health check method
  async checkHealth(): Promise<boolean> {
    try {
      // Simple health check - try to emit a test event
      this.eventClient.emit('health.check', {
        timestamp: new Date(),
        service: 'land-admin-api',
      });
      return true;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }

  // Get event statistics
  async getEventStats(): Promise<any> {
    // This would typically query your event store or metrics system
    return {
      connected: true,
      timestamp: new Date(),
      // In a real implementation, you'd get these from RabbitMQ management API
      totalEvents: 0,
      queueStatus: 'active',
    };
  }
}
