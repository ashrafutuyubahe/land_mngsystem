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
    ApiQuery,
    } from '@nestjs/swagger';
    import { ConflictResolutionService } from './conflict-resolution.service';
    import { CreateConflictDto } from './dto/create-conflict.dto';
    import { UpdateConflictDto } from './dto/update-conflict.dto';
    import {
    ConflictFilterDto,
    AssignConflictDto,
    } from './dto/conflict-filter.dto';
    import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
    import { RolesGuard } from '../auth/guards/roles.guard';
    import { Roles } from '../auth/decorators/roles.decorator';
    import { UserRole } from '../auth/entities/user.entity';

    @ApiTags('Conflict Resolution')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Controller('conflicts')
    export class ConflictResolutionController {
    constructor(
        private readonly conflictResolutionService: ConflictResolutionService,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Report a new land conflict' })
    @ApiResponse({ status: 201, description: 'Conflict reported successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 403, description: 'Access forbidden' })
    @ApiResponse({ status: 404, description: 'Land record not found' })
    async create(@Body() createConflictDto: CreateConflictDto, @Request() req) {
        return await this.conflictResolutionService.create(
        createConflictDto,
        req.user,
        );
    }

    @Get()
    @ApiOperation({ summary: 'Get all conflicts with optional filtering' })
    @ApiResponse({ status: 200, description: 'Conflicts retrieved successfully' })
    @ApiQuery({
        name: 'conflictType',
        required: false,
        description: 'Filter by conflict type',
    })
    @ApiQuery({
        name: 'status',
        required: false,
        description: 'Filter by status',
    })
    @ApiQuery({
        name: 'priority',
        required: false,
        description: 'Filter by priority',
    })
    @ApiQuery({
        name: 'reportedAfter',
        required: false,
        description: 'Filter conflicts reported after date',
    })
    @ApiQuery({
        name: 'reportedBefore',
        required: false,
        description: 'Filter conflicts reported before date',
    })
    @ApiQuery({
        name: 'search',
        required: false,
        description: 'Search in title and description',
    })
    async findAll(@Query() filters: ConflictFilterDto, @Request() req) {
        return await this.conflictResolutionService.findAll(filters, req.user);
    }

    @Get('statistics')
    @ApiOperation({ summary: 'Get conflict resolution statistics' })
    @ApiResponse({
        status: 200,
        description: 'Statistics retrieved successfully',
    })
    async getStatistics(@Request() req) {
        return await this.conflictResolutionService.getStatistics(req.user);
    }

    @Get('overdue')
    @ApiOperation({ summary: 'Get overdue conflicts (older than 30 days)' })
    @ApiResponse({
        status: 200,
        description: 'Overdue conflicts retrieved successfully',
    })
    @Roles(UserRole.LAND_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.SYSTEM_ADMIN)
    async getOverdueConflicts(@Request() req) {
        return await this.conflictResolutionService.getOverdueConflicts(req.user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific conflict by ID' })
    @ApiResponse({ status: 200, description: 'Conflict found' })
    @ApiResponse({ status: 403, description: 'Access forbidden' })
    @ApiResponse({ status: 404, description: 'Conflict not found' })
    async findOne(@Param('id') id: string, @Request() req) {
        return await this.conflictResolutionService.findOne(id, req.user);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a conflict' })
    @ApiResponse({ status: 200, description: 'Conflict updated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 403, description: 'Access forbidden' })
    @ApiResponse({ status: 404, description: 'Conflict not found' })
    async update(
        @Param('id') id: string,
        @Body() updateConflictDto: UpdateConflictDto,
        @Request() req,
    ) {
        return await this.conflictResolutionService.update(
        id,
        updateConflictDto,
        req.user,
        );
    }

    @Post(':id/assign')
    @ApiOperation({ summary: 'Assign a conflict to an officer' })
    @ApiResponse({ status: 200, description: 'Conflict assigned successfully' })
    @ApiResponse({
        status: 400,
        description: 'Invalid officer or assignment data',
    })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Conflict or officer not found' })
    @Roles(UserRole.LAND_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.SYSTEM_ADMIN)
    async assignToOfficer(
        @Param('id') id: string,
        @Body() assignDto: AssignConflictDto,
        @Request() req,
    ) {
        return await this.conflictResolutionService.assignToOfficer(
        id,
        assignDto,
        req.user,
        );
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a conflict' })
    @ApiResponse({ status: 204, description: 'Conflict deleted successfully' })
    @ApiResponse({ status: 403, description: 'Access forbidden' })
    @ApiResponse({ status: 404, description: 'Conflict not found' })
    async remove(@Param('id') id: string, @Request() req) {
        await this.conflictResolutionService.remove(id, req.user);
    }
    }
