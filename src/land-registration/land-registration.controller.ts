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
  @ApiOperation({ summary: 'Delete a land record' })
  @ApiResponse({ status: 200, description: 'Land record deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Cannot delete approved land record',
  })
  async remove(@Param('id') id: string, @Request() req) {
    return this.landRegistrationService.remove(id, req.user);
  }
}
