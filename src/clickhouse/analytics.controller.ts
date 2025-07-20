import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ClickHouseService, LandAnalyticsStats } from './clickhouse.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

export class LandAnalyticsFiltersDto {
  district?: string;
  landUse?: string;
  status?: string;
  minArea?: number;
  maxArea?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@ApiTags('Land Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly clickHouseService: ClickHouseService) {}

  @Get('land-records')
  @Roles(
    UserRole.LAND_OFFICER,
    UserRole.DISTRICT_ADMIN,
    UserRole.REGISTRAR,
    UserRole.SUPER_ADMIN,
    UserRole.SYSTEM_ADMIN,
  )
  @ApiOperation({
    summary:
      'Get land records analytics with advanced filtering and pagination',
    description:
      'Retrieve land records from ClickHouse for high-performance analytics. Supports complex filtering, sorting, and pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Land records analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              parcel_number: { type: 'string' },
              upi_number: { type: 'string' },
              land_use: { type: 'string' },
              area: { type: 'number' },
              district: { type: 'string' },
              status: { type: 'string' },
              owner_name: { type: 'string' },
              registration_date: { type: 'string', format: 'date-time' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiQuery({
    name: 'district',
    required: false,
    description: 'Filter by district',
  })
  @ApiQuery({
    name: 'landUse',
    required: false,
    description: 'Filter by land use type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'minArea',
    required: false,
    description: 'Minimum area filter',
  })
  @ApiQuery({
    name: 'maxArea',
    required: false,
    description: 'Maximum area filter',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'Date from filter (ISO format)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'Date to filter (ISO format)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Records per page (default: 100, max: 1000)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by (default: created_at)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order: ASC or DESC (default: DESC)',
  })
  async getLandRecordsAnalytics(@Query() filters: LandAnalyticsFiltersDto) {
    // Validate and sanitize inputs
    const sanitizedFilters = {
      ...filters,
      page: Math.max(1, parseInt(filters.page?.toString() || '1')),
      limit: Math.min(
        1000,
        Math.max(1, parseInt(filters.limit?.toString() || '100')),
      ),
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
      sortOrder:
        filters.sortOrder === 'ASC' ? ('ASC' as const) : ('DESC' as const),
    };

    return await this.clickHouseService.getLandRecordsAnalytics(
      sanitizedFilters,
    );
  }

  @Get('statistics')
  @Roles(
    UserRole.LAND_OFFICER,
    UserRole.DISTRICT_ADMIN,
    UserRole.REGISTRAR,
    UserRole.SUPER_ADMIN,
    UserRole.SYSTEM_ADMIN,
  )
  @ApiOperation({
    summary: 'Get comprehensive land analytics statistics',
    description:
      'Retrieve comprehensive statistics and insights about land records including distributions, trends, and aggregations.',
  })
  @ApiResponse({
    status: 200,
    description: 'Land analytics statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total_records: { type: 'number' },
        total_area: { type: 'number' },
        avg_area: { type: 'number' },
        records_by_district: { type: 'object' },
        records_by_land_use: { type: 'object' },
        records_by_status: { type: 'object' },
        monthly_registrations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              month: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        area_distribution: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              range: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getStatistics(): Promise<LandAnalyticsStats> {
    return await this.clickHouseService.getLandAnalyticsStats();
  }

  @Get('districts-summary')
  @Roles(
    UserRole.LAND_OFFICER,
    UserRole.DISTRICT_ADMIN,
    UserRole.REGISTRAR,
    UserRole.SUPER_ADMIN,
    UserRole.SYSTEM_ADMIN,
  )
  @ApiOperation({
    summary: 'Get district-wise land records summary',
    description:
      'Get aggregated land records data grouped by districts for dashboard views.',
  })
  @ApiResponse({
    status: 200,
    description: 'District summary retrieved successfully',
  })
  async getDistrictsSummary() {
    return await this.clickHouseService.getLandRecordsAnalytics({
      page: 1,
      limit: 1000,
      sortBy: 'district',
      sortOrder: 'ASC',
    });
  }

  @Post('sync-all')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Trigger full sync of land records to ClickHouse',
    description:
      'Manually trigger synchronization of all land records from PostgreSQL to ClickHouse. This is an admin-only operation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync operation triggered successfully',
  })
  async triggerFullSync(@Request() req) {
    // This will be implemented in the land registration service
    return {
      message: 'Full sync operation triggered',
      triggered_by: req.user.id,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  @Roles(
    UserRole.LAND_OFFICER,
    UserRole.DISTRICT_ADMIN,
    UserRole.REGISTRAR,
    UserRole.SUPER_ADMIN,
    UserRole.SYSTEM_ADMIN,
  )
  @ApiOperation({
    summary: 'Check ClickHouse health status',
    description: 'Verify ClickHouse connection and service health.',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy'] },
        timestamp: { type: 'string', format: 'date-time' },
        clickhouse_connected: { type: 'boolean' },
      },
    },
  })
  async healthCheck() {
    const isHealthy = await this.clickHouseService.healthCheck();

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      clickhouse_connected: isHealthy,
    };
  }
}
