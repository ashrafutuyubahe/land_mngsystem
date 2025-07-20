import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UrbanizationService } from './urbanization.service';
import { CreateConstructionPermitDto } from './dto/create-construction-permit.dto';
import { UpdateConstructionPermitDto } from './dto/update-construction-permit.dto';
import {
  ScheduleInspectionDto,
  ConductInspectionDto,
  ReviewPermitDto,
} from './dto/inspection.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { PermitStatus } from './entities/construction-permit.entity';
import { InspectionType, InspectionStatus } from './enums/construction.enum';

@ApiTags('Urbanization & Construction')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('construction-permits')
export class UrbanizationController {
  constructor(private readonly urbanizationService: UrbanizationService) {}

  @Post()
  @ApiOperation({ summary: 'Apply for a new construction permit' })
  @ApiResponse({
    status: 201,
    description: 'Construction permit created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Access forbidden' })
  @ApiResponse({ status: 404, description: 'Land record not found' })
  async createPermit(
    @Body() createPermitDto: CreateConstructionPermitDto,
    @Request() req,
  ) {
    return await this.urbanizationService.createPermit(
      createPermitDto,
      req.user,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all construction permits' })
  @ApiResponse({
    status: 200,
    description: 'Construction permits retrieved successfully',
  })
  async findAllPermits(@Request() req) {
    return await this.urbanizationService.findAllPermits(req.user);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get construction permit statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(@Request() req) {
    return await this.urbanizationService.getPermitStatistics(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific construction permit by ID' })
  @ApiResponse({ status: 200, description: 'Construction permit found' })
  @ApiResponse({ status: 403, description: 'Access forbidden' })
  @ApiResponse({ status: 404, description: 'Construction permit not found' })
  @ApiParam({ name: 'id', description: 'Construction permit ID' })
  async findOnePermit(@Param('id') id: string, @Request() req) {
    return await this.urbanizationService.findOnePermit(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a construction permit' })
  @ApiResponse({
    status: 200,
    description: 'Construction permit updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Access forbidden' })
  @ApiResponse({ status: 404, description: 'Construction permit not found' })
  @ApiParam({ name: 'id', description: 'Construction permit ID' })
  async updatePermit(
    @Param('id') id: string,
    @Body() updatePermitDto: UpdateConstructionPermitDto,
    @Request() req,
  ) {
    return await this.urbanizationService.updatePermit(
      id,
      updatePermitDto,
      req.user,
    );
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a draft permit for review' })
  @ApiResponse({ status: 200, description: 'Permit submitted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid permit status for submission',
  })
  @ApiResponse({ status: 403, description: 'Access forbidden' })
  @ApiResponse({ status: 404, description: 'Construction permit not found' })
  @ApiParam({ name: 'id', description: 'Construction permit ID' })
  async submitPermit(@Param('id') id: string, @Request() req) {
    return await this.urbanizationService.submitPermit(id, req.user);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Review a submitted construction permit' })
  @ApiResponse({ status: 200, description: 'Permit reviewed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid review data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Construction permit not found' })
  @ApiParam({ name: 'id', description: 'Construction permit ID' })
  @Roles(UserRole.LAND_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.SYSTEM_ADMIN)
  async reviewPermit(
    @Param('id') id: string,
    @Body() reviewData: ReviewPermitDto,
    @Request() req,
  ) {
    return await this.urbanizationService.reviewPermit(
      id,
      reviewData.decision as PermitStatus,
      reviewData.comments,
      req.user,
    );
  }

  @Post(':id/inspections')
  @ApiOperation({ summary: 'Schedule an inspection for a construction permit' })
  @ApiResponse({
    status: 201,
    description: 'Inspection scheduled successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid inspection data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Construction permit not found' })
  @ApiParam({ name: 'id', description: 'Construction permit ID' })
  @Roles(UserRole.LAND_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.SYSTEM_ADMIN)
  async scheduleInspection(
    @Param('id') id: string,
    @Body() inspectionData: ScheduleInspectionDto,
    @Request() req,
  ) {
    return await this.urbanizationService.scheduleInspection(
      id,
      inspectionData.inspectionType,
      req.user,
    );
  }

  @Get(':id/inspections')
  @ApiOperation({ summary: 'Get all inspections for a construction permit' })
  @ApiResponse({
    status: 200,
    description: 'Inspections retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Access forbidden' })
  @ApiResponse({ status: 404, description: 'Construction permit not found' })
  @ApiParam({ name: 'id', description: 'Construction permit ID' })
  async findPermitInspections(@Param('id') id: string, @Request() req) {
    return await this.urbanizationService.findPermitInspections(id, req.user);
  }

  @Patch('inspections/:inspectionId')
  @ApiOperation({ summary: 'Conduct/update an inspection' })
  @ApiResponse({ status: 200, description: 'Inspection updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid inspection data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  @ApiParam({ name: 'inspectionId', description: 'Inspection ID' })
  @Roles(UserRole.LAND_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.SYSTEM_ADMIN)
  async conductInspection(
    @Param('inspectionId') inspectionId: string,
    @Body() inspectionData: ConductInspectionDto,
    @Request() req,
  ) {
    return await this.urbanizationService.conductInspection(
      inspectionId,
      inspectionData.result,
      inspectionData.notes,
      req.user,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a construction permit' })
  @ApiResponse({
    status: 204,
    description: 'Construction permit deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Access forbidden' })
  @ApiResponse({ status: 404, description: 'Construction permit not found' })
  @ApiParam({ name: 'id', description: 'Construction permit ID' })
  async removePermit(@Param('id') id: string, @Request() req) {
    await this.urbanizationService.removePermit(id, req.user);
  }
}
