import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LandRegistrationService } from './land-registration.service';
import { CreateLandRecordDto } from './dto/create-land-record.dto';
import { UpdateLandRecordDto } from './dto/update-land-record.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@ApiTags('Land Registration')
@Controller('land-registration')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LandRegistrationController {
  constructor(
    private readonly landRegistrationService: LandRegistrationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Register a new land record' })
  @ApiResponse({ status: 201, description: 'Land record created successfully' })
  @ApiResponse({
    status: 403,
    description: 'Parcel or UPI number already exists',
  })
  async create(
    @Body() createLandRecordDto: CreateLandRecordDto,
    @Request() req,
  ) {
    return this.landRegistrationService.create(createLandRecordDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all land records (filtered by user role)' })
  @ApiResponse({
    status: 200,
    description: 'Land records retrieved successfully',
  })
  async findAll(@Request() req) {
    return this.landRegistrationService.findAll(req.user);
  }

  @Get('analytics')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.LAND_OFFICER,
    UserRole.DISTRICT_ADMIN,
    UserRole.REGISTRAR,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Get land records analytics (high-performance with ClickHouse)',
    description:
      'Retrieve land records from ClickHouse for large-scale analytics and reporting. Supports advanced filtering and pagination.',
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
    description: 'Records per page (default: 100)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order: ASC or DESC',
  })
  @ApiResponse({
    status: 200,
    description: 'Land records analytics retrieved successfully',
  })
  async findAllAnalytics(
    @Request() req,
    @Query('district') district?: string,
    @Query('landUse') landUse?: string,
    @Query('status') status?: string,
    @Query('minArea') minArea?: number,
    @Query('maxArea') maxArea?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const filters = {
      district,
      landUse,
      status,
      minArea: minArea ? Number(minArea) : undefined,
      maxArea: maxArea ? Number(maxArea) : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
    };

    return this.landRegistrationService.findAllAnalytics(req.user, filters);
  }

  @Get('by-district')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.LAND_OFFICER,
    UserRole.DISTRICT_ADMIN,
    UserRole.REGISTRAR,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Get land records by district' })
  @ApiQuery({ name: 'district', required: true })
  @ApiResponse({
    status: 200,
    description: 'Land records retrieved successfully',
  })
  async findByDistrict(@Query('district') district: string) {
    return this.landRegistrationService.findByDistrict(district);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific land record' })
  @ApiResponse({
    status: 200,
    description: 'Land record retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Land record not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.landRegistrationService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a land record' })
  @ApiResponse({ status: 200, description: 'Land record updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Cannot update approved land record',
  })
  async update(
    @Param('id') id: string,
    @Body() updateLandRecordDto: UpdateLandRecordDto,
    @Request() req,
  ) {
    return this.landRegistrationService.update(
      id,
      updateLandRecordDto,
      req.user,
    );
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LAND_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.REGISTRAR)
  @ApiOperation({ summary: 'Approve a land record' })
  @ApiResponse({
    status: 200,
    description: 'Land record approved successfully',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async approve(@Param('id') id: string, @Request() req) {
    return this.landRegistrationService.approve(id, req.user);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LAND_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.REGISTRAR)
  @ApiOperation({ summary: 'Reject a land record' })
  @ApiResponse({
    status: 200,
    description: 'Land record rejected successfully',
  })
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.landRegistrationService.reject(id, reason, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LAND_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.REGISTRAR)
  @ApiOperation({ summary: 'Delete a land record' })
  @ApiResponse({ status: 200, description: 'Land record deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Cannot delete approved land record',
  })
  async remove(@Param('id') id: string, @Request() req) {
    return this.landRegistrationService.remove(id, req.user);
  }

  @Post('sync-to-clickhouse')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Bulk sync all land records to ClickHouse',
    description:
      'Manually trigger synchronization of all land records from PostgreSQL to ClickHouse for analytics. This is an admin-only operation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk sync operation completed',
    schema: {
      type: 'object',
      properties: {
        synced: { type: 'number' },
        errors: { type: 'number' },
        message: { type: 'string' },
        triggered_by: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async bulkSyncToClickHouse(@Request() req) {
    const result = await this.landRegistrationService.bulkSyncToClickHouse();

    return {
      ...result,
      message: 'Bulk sync operation completed',
      triggered_by: req.user.id,
      timestamp: new Date().toISOString(),
    };
  }
}
