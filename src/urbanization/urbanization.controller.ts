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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UrbanizationService } from './urbanization.service';
import { CreateConstructionPermitDto } from './dto/create-construction-permit.dto';
import { UpdateConstructionPermitDto } from './dto/update-construction-permit.dto';
import { CreateInspectionDto, UpdateInspectionDto } from './dto/inspection.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { PermitStatus } from './enums/construction.enum';

@ApiTags('Urbanization & Construction Permits')
@Controller('urbanization')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UrbanizationController {
  constructor(private readonly urbanizationService: UrbanizationService) {}

  // Construction Permit Endpoints
  @Post('permits')
  @ApiOperation({
    summary: 'Create a new construction permit application',
    description: 'Submit a new construction permit application for review.',
  })
  @ApiResponse({
    status: 201,
    description: 'Construction permit created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async createPermit(
    @Body() createPermitDto: CreateConstructionPermitDto,
    @Request() req,
  ) {
    return this.urbanizationService.createPermit(createPermitDto, req.user);
  }

  @Get('permits')
  @ApiOperation({
    summary: 'Get all construction permits',
    description:
      'Retrieve construction permits based on user role and permissions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Construction permits retrieved successfully',
  })
  async findAllPermits(@Request() req) {
    return this.urbanizationService.findAllPermits(req.user);
  }

  @Get('permits/:id')
  @ApiOperation({
    summary: 'Get a specific construction permit',
    description: 'Retrieve detailed information about a construction permit.',
  })
  @ApiParam({
    name: 'id',
    description: 'Construction permit ID',
    example: 'uuid-permit-id',
  })
  @ApiResponse({
    status: 200,
    description: 'Construction permit retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Construction permit not found',
  })
  async findOnePermit(@Param('id') id: string, @Request() req) {
    return this.urbanizationService.findOnePermit(id, req.user);
  }

  @Patch('permits/:id')
  @ApiOperation({
    summary: 'Update a construction permit',
    description:
      'Update construction permit details (only in draft or pending documents status).',
  })
  @ApiParam({
    name: 'id',
    description: 'Construction permit ID',
    example: 'uuid-permit-id',
  })
  @ApiResponse({
    status: 200,
    description: 'Construction permit updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot update permit in current status',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async updatePermit(
    @Param('id') id: string,
    @Body() updatePermitDto: UpdateConstructionPermitDto,
    @Request() req,
  ) {
    return this.urbanizationService.updatePermit(id, updatePermitDto, req.user);
  }

  @Post('permits/:id/submit')
  @ApiOperation({
    summary: 'Submit construction permit for review',
    description: 'Submit a draft construction permit for official review.',
  })
  @ApiParam({
    name: 'id',
    description: 'Construction permit ID',
    example: 'uuid-permit-id',
  })
  @ApiResponse({
    status: 200,
    description: 'Construction permit submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Only draft permits can be submitted',
  })
  async submitPermit(@Param('id') id: string, @Request() req) {
    return this.urbanizationService.submitPermit(id, req.user);
  }

  @Post('permits/:id/review')
  @Roles(UserRole.URBAN_PLANNER, UserRole.DISTRICT_ADMIN)
  @ApiOperation({
    summary: 'Review and approve/reject construction permit',
    description:
      'Review a submitted construction permit and change its status.',
  })
  @ApiParam({
    name: 'id',
    description: 'Construction permit ID',
    example: 'uuid-permit-id',
  })
  @ApiQuery({
    name: 'status',
    description: 'New permit status',
    enum: PermitStatus,
    example: PermitStatus.APPROVED,
  })
  @ApiQuery({
    name: 'comments',
    description: 'Review comments',
    example: 'Permit approved with standard conditions',
  })
  @ApiResponse({
    status: 200,
    description: 'Construction permit reviewed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async reviewPermit(
    @Param('id') id: string,
    @Query('status') status: PermitStatus,
    @Query('comments') comments: string,
    @Request() req,
  ) {
    return this.urbanizationService.reviewPermit(
      id,
      status,
      comments,
      req.user,
    );
  }

  @Delete('permits/:id')
  @ApiOperation({
    summary: 'Delete a construction permit',
    description: 'Delete a construction permit (only draft permits).',
  })
  @ApiParam({
    name: 'id',
    description: 'Construction permit ID',
    example: 'uuid-permit-id',
  })
  @ApiResponse({
    status: 200,
    description: 'Construction permit deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Only draft permits can be deleted',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async removePermit(@Param('id') id: string, @Request() req) {
    await this.urbanizationService.removePermit(id, req.user);
    return { message: 'Construction permit deleted successfully' };
  }

  // Inspection Endpoints
  @Post('inspections')
  @Roles(UserRole.URBAN_PLANNER, UserRole.DISTRICT_ADMIN)
  @ApiOperation({
    summary: 'Schedule a new inspection',
    description: 'Schedule an inspection for an approved construction permit.',
  })
  @ApiResponse({
    status: 201,
    description: 'Inspection scheduled successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Can only create inspections for approved permits',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async createInspection(
    @Body() createInspectionDto: CreateInspectionDto,
    @Request() req,
  ) {
    return this.urbanizationService.createInspection(
      createInspectionDto,
      req.user,
    );
  }

  @Get('inspections')
  @ApiOperation({
    summary: 'Get all inspections',
    description: 'Retrieve inspections based on user role and permissions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Inspections retrieved successfully',
  })
  async findAllInspections(@Request() req) {
    return this.urbanizationService.findAllInspections(req.user);
  }

  @Patch('inspections/:id')
  @ApiOperation({
    summary: 'Update inspection details',
    description: 'Update inspection findings, status, and other details.',
  })
  @ApiParam({
    name: 'id',
    description: 'Inspection ID',
    example: 'uuid-inspection-id',
  })
  @ApiResponse({
    status: 200,
    description: 'Inspection updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Inspection not found',
  })
  async updateInspection(
    @Param('id') id: string,
    @Body() updateInspectionDto: UpdateInspectionDto,
    @Request() req,
  ) {
    return this.urbanizationService.updateInspection(
      id,
      updateInspectionDto,
      req.user,
    );
  }

  // Statistics and Reports
  @Get('permits/statistics/overview')
  @Roles(
    UserRole.URBAN_PLANNER,
    UserRole.DISTRICT_ADMIN,
    UserRole.SYSTEM_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Get construction permit statistics',
    description: 'Retrieve overview statistics for construction permits.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getPermitStatistics(@Request() req) {
    // This would be implemented to return permit statistics
    return {
      message: 'Statistics endpoint - to be implemented',
      userRole: req.user.role,
    };
  }

  @Get('inspections/statistics/overview')
  @Roles(
    UserRole.URBAN_PLANNER,
    UserRole.DISTRICT_ADMIN,
    UserRole.SYSTEM_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Get inspection statistics',
    description: 'Retrieve overview statistics for inspections.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getInspectionStatistics(@Request() req) {
    // This would be implemented to return inspection statistics
    return {
      message: 'Statistics endpoint - to be implemented',
      userRole: req.user.role,
    };
  }
}
