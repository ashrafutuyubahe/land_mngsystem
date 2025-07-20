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
import { LandTransferService } from './land-transfer.service';
import { CreateLandTransferDto } from './dto/create-land-transfer.dto';
import { UpdateLandTransferDto } from './dto/update-land-transfer.dto';
import { ApproveTransferDto } from './dto/approve-transfer.dto';
import { RejectTransferDto } from './dto/reject-transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@ApiTags('Land Transfer')
@Controller('land-transfer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LandTransferController {
  constructor(private readonly landTransferService: LandTransferService) {}

  @Post()
  @ApiOperation({ summary: 'Initiate a new land transfer' })
  @ApiResponse({
    status: 201,
    description: 'Land transfer initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid transfer data or land not transferable',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to transfer this land',
  })
  @ApiResponse({
    status: 404,
    description: 'Land record or new owner not found',
  })
  async create(
    @Body() createLandTransferDto: CreateLandTransferDto,
    @Request() req,
  ) {
    return this.landTransferService.create(createLandTransferDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all land transfers (filtered by user role)' })
  @ApiResponse({
    status: 200,
    description: 'Land transfers retrieved successfully',
  })
  async findAll(@Request() req) {
    return this.landTransferService.findAll(req.user);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get transfer statistics' })
  @ApiResponse({
    status: 200,
    description: 'Transfer statistics retrieved successfully',
  })
  async getStatistics(@Request() req) {
    return this.landTransferService.getTransferStatistics(req.user);
  }

  @Get('by-land/:landId')
  @ApiOperation({ summary: 'Get transfers for a specific land' })
  @ApiResponse({
    status: 200,
    description: 'Land transfers retrieved successfully',
  })
  async findByLand(@Param('landId') landId: string) {
    return this.landTransferService.findByLand(landId);
  }

  @Get('by-user/:userId')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.LAND_OFFICER,
    UserRole.DISTRICT_ADMIN,
    UserRole.REGISTRAR,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Get transfers for a specific user' })
  @ApiResponse({
    status: 200,
    description: 'User transfers retrieved successfully',
  })
  async findByUser(@Param('userId') userId: string) {
    return this.landTransferService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific land transfer' })
  @ApiResponse({
    status: 200,
    description: 'Land transfer retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.landTransferService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a land transfer' })
  @ApiResponse({
    status: 200,
    description: 'Land transfer updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update transfer in current status',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async update(
    @Param('id') id: string,
    @Body() updateLandTransferDto: UpdateLandTransferDto,
    @Request() req,
  ) {
    return this.landTransferService.update(id, updateLandTransferDto, req.user);
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LAND_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.REGISTRAR)
  @ApiOperation({ summary: 'Approve a land transfer' })
  @ApiResponse({
    status: 200,
    description: 'Land transfer approved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Transfer cannot be approved in current status',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveTransferDto,
    @Request() req,
  ) {
    return this.landTransferService.approve(id, approveDto, req.user);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LAND_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.REGISTRAR)
  @ApiOperation({ summary: 'Reject a land transfer' })
  @ApiResponse({
    status: 200,
    description: 'Land transfer rejected successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Transfer cannot be rejected in current status',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectTransferDto,
    @Request() req,
  ) {
    return this.landTransferService.reject(id, rejectDto, req.user);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a land transfer (by current owner)' })
  @ApiResponse({
    status: 200,
    description: 'Land transfer cancelled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Transfer cannot be cancelled in current status',
  })
  @ApiResponse({ status: 403, description: 'Only current owner can cancel' })
  async cancel(@Param('id') id: string, @Request() req) {
    return this.landTransferService.cancel(id, req.user);
  }

  // Cache-enabled endpoints
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get transfers for a specific user (cached)' })
  @ApiResponse({
    status: 200,
    description: 'User transfers retrieved successfully from cache',
  })
  @Roles(UserRole.LAND_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.SYSTEM_ADMIN)
  async getTransfersByUser(@Param('userId') userId: string, @Request() req) {
    return this.landTransferService.findByUser(userId);
  }

  @Get('history/:landId')
  @ApiOperation({ summary: 'Get transfer history for a land parcel (cached)' })
  @ApiResponse({
    status: 200,
    description: 'Transfer history retrieved successfully from cache',
  })
  async getTransferHistory(@Param('landId') landId: string, @Request() req) {
    return this.landTransferService.getTransferHistory(landId, req.user);
  }

  @Get('district/:district')
  @ApiOperation({ summary: 'Get transfers by district (cached)' })
  @ApiResponse({
    status: 200,
    description: 'District transfers retrieved successfully from cache',
  })
  @Roles(UserRole.LAND_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.SYSTEM_ADMIN)
  async getTransfersByDistrict(
    @Param('district') district: string,
    @Request() req,
  ) {
    return this.landTransferService.getTransfersByDistrict(district, req.user);
  }

  @Get('cache/health')
  @ApiOperation({ summary: 'Check Redis cache health' })
  @ApiResponse({
    status: 200,
    description: 'Cache health status',
  })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.DISTRICT_ADMIN)
  async getCacheHealth() {
    return this.landTransferService.getCacheHealth();
  }

  @Post('cache/preload')
  @ApiOperation({ summary: 'Preload frequently accessed transfers into cache' })
  @ApiResponse({
    status: 200,
    description: 'Cache preloading initiated',
  })
  @Roles(UserRole.SYSTEM_ADMIN)
  async preloadCache() {
    await this.landTransferService.preloadTransferCaches();
    return { message: 'Cache preloading completed' };
  }
}
