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
    summary: 'Get land records with advanced filtering',
    description:
      'Retrieve land records with support for advanced filtering and pagination.',
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

    // For now, use the regular findAll method since ClickHouse is disabled
    return this.landRegistrationService.findAll(req.user);
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

  // Spatial data endpoints
  @Get(':id/geometry')
  @ApiOperation({ summary: 'Get land record with GeoJSON geometry' })
  @ApiResponse({
    status: 200,
    description: 'Land record with geometry retrieved successfully',
  })
  async getLandRecordWithGeometry(@Param('id') id: string, @Request() req) {
    return this.landRegistrationService.getLandRecordWithGeometry(id, req.user);
  }

  @Get('spatial/nearby')
  @ApiOperation({ summary: 'Find land records within radius' })
  @ApiQuery({
    name: 'lat',
    required: true,
    description: 'Latitude of center point',
  })
  @ApiQuery({
    name: 'lng',
    required: true,
    description: 'Longitude of center point',
  })
  @ApiQuery({
    name: 'radius',
    required: true,
    description: 'Search radius in meters',
  })
  @ApiResponse({ status: 200, description: 'Nearby land records found' })
  async findNearbyLandRecords(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number,
    @Request() req,
  ) {
    return this.landRegistrationService.findLandRecordsWithinRadius(
      +lat,
      +lng,
      +radius,
      req.user,
    );
  }

  @Get(':id/area')
  @ApiOperation({ summary: 'Calculate accurate land area using PostGIS' })
  @ApiResponse({
    status: 200,
    description: 'Land area calculated successfully',
  })
  async calculateLandArea(@Param('id') id: string, @Request() req) {
    // Check if user has access to this land record
    await this.landRegistrationService.findOne(id, req.user);

    const area = await this.landRegistrationService.calculateActualArea(id);
    return {
      landRecordId: id,
      areaSquareMeters: area,
      areaHectares: area / 10000,
    };
  }

  @Get(':id1/overlap/:id2')
  @ApiOperation({ summary: 'Check if two land parcels overlap' })
  @ApiResponse({ status: 200, description: 'Overlap check completed' })
  async checkOverlap(
    @Param('id1') id1: string,
    @Param('id2') id2: string,
    @Request() req,
  ) {
    // Check if user has access to both land records
    await this.landRegistrationService.findOne(id1, req.user);
    await this.landRegistrationService.findOne(id2, req.user);

    return this.landRegistrationService.checkGeometryOverlap(id1, id2);
  }
}
