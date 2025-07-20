import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LandTaxesService } from './land-taxes.service';
import { CreateLandTaxDto } from './dto/create-land-tax.dto';
import { UpdateLandTaxDto } from './dto/update-land-tax.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { BulkTaxAssessmentDto } from './dto/bulk-tax-assessment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { TaxStatus } from '../common/enums/status.enum';

@ApiTags('Land Taxes')
@Controller('land-taxes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LandTaxesController {
  constructor(private readonly landTaxesService: LandTaxesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TAX_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.REGISTRAR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new tax assessment' })
  @ApiResponse({ status: 201, description: 'Tax assessment created successfully' })
  @ApiResponse({ status: 400, description: 'Tax already exists for this year' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Land record not found' })
  async create(@Body() createLandTaxDto: CreateLandTaxDto, @Request() req) {
    return this.landTaxesService.create(createLandTaxDto, req.user);
  }

  @Post('bulk-assessment')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TAX_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.REGISTRAR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Perform bulk tax assessment' })
  @ApiResponse({ status: 201, description: 'Bulk assessment completed' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async bulkAssessment(@Body() bulkDto: BulkTaxAssessmentDto, @Request() req) {
    return this.landTaxesService.bulkAssessment(bulkDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tax records (filtered by user role)' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Filter by tax year' })
  @ApiQuery({ name: 'status', required: false, enum: TaxStatus, description: 'Filter by tax status' })
  @ApiResponse({ status: 200, description: 'Tax records retrieved successfully' })
  async findAll(
    @Request() req,
    @Query('year') year?: number,
    @Query('status') status?: TaxStatus,
  ) {
    return this.landTaxesService.findAll(req.user, year, status);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get tax collection statistics' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Filter by tax year' })
  @ApiResponse({ status: 200, description: 'Tax statistics retrieved successfully' })
  async getStatistics(@Request() req, @Query('year') year?: number) {
    return this.landTaxesService.getTaxStatistics(req.user, year);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue tax records' })
  @ApiResponse({ status: 200, description: 'Overdue taxes retrieved successfully' })
  async getOverdueTaxes(@Request() req) {
    return this.landTaxesService.getOverdueTaxes(req.user);
  }

  @Get('by-land/:landId')
  @ApiOperation({ summary: 'Get tax history for a specific land' })
  @ApiResponse({ status: 200, description: 'Land tax history retrieved successfully' })
  async findByLand(@Param('landId') landId: string, @Request() req) {
    return this.landTaxesService.findByLand(landId, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific tax record' })
  @ApiResponse({ status: 200, description: 'Tax record retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tax record not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.landTaxesService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TAX_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.REGISTRAR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a tax assessment' })
  @ApiResponse({ status: 200, description: 'Tax assessment updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async update(@Param('id') id: string, @Body() updateLandTaxDto: UpdateLandTaxDto, @Request() req) {
    return this.landTaxesService.update(id, updateLandTaxDto, req.user);
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'Process tax payment' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  @ApiResponse({ status: 404, description: 'Tax record not found' })
  async processPayment(@Param('id') id: string, @Body() paymentDto: ProcessPaymentDto, @Request() req) {
    return this.landTaxesService.processPayment(id, paymentDto, req.user);
  }

  @Post(':id/exempt')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TAX_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.REGISTRAR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mark tax as exempt' })
  @ApiResponse({ status: 200, description: 'Tax marked as exempt successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async markAsExempt(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.landTaxesService.markAsExempt(id, reason, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Delete a tax record' })
  @ApiResponse({ status: 200, description: 'Tax record deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete tax with payments' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.landTaxesService.remove(id, req.user);
    return { message: 'Tax record deleted successfully' };
  }
}
