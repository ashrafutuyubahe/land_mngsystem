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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import {
  CreateSystemSettingDto,
  UpdateSystemSettingDto,
} from './dto/create-system-setting.dto';
import {
  CreateWorkflowDto,
  CreateWorkflowStepDto,
  UpdateWorkflowDto,
  SettingsFilterDto,
} from './dto/workflow.dto';

import { Workflow } from './entities/workflow.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { SystemSettings } from './entities/system-settings.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { SettingCategory, SettingScope } from './enums/settings.enum';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // System Settings Endpoints
  @Post('system')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Create a new system setting' })
  @ApiResponse({
    status: 201,
    description: 'System setting created successfully',
    type: SystemSettings,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data or setting already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async createSystemSetting(
    @Body() createDto: CreateSystemSettingDto,
    @Request() req: any,
  ): Promise<SystemSettings> {
    return await this.settingsService.createSystemSetting(
      createDto,
      req.user.role,
    );
  }

  @Get('system')
  @ApiOperation({ summary: 'Get all system settings with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'System settings retrieved successfully',
    type: [SystemSettings],
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in key or display name',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
  })
  async getAllSystemSettings(
    @Query() filter: SettingsFilterDto,
  ): Promise<SystemSettings[]> {
    return await this.settingsService.getAllSystemSettings(filter);
  }

  @Get('system/:id')
  @ApiOperation({ summary: 'Get system setting by ID' })
  @ApiResponse({
    status: 200,
    description: 'System setting retrieved successfully',
    type: SystemSettings,
  })
  @ApiResponse({ status: 404, description: 'System setting not found' })
  async getSystemSettingById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SystemSettings> {
    return await this.settingsService.getSystemSettingById(id);
  }

  @Get('system/key/:key')
  @ApiOperation({ summary: 'Get system setting by key' })
  @ApiResponse({
    status: 200,
    description: 'System setting retrieved successfully',
    type: SystemSettings,
  })
  @ApiResponse({ status: 404, description: 'System setting not found' })
  async getSystemSettingByKey(
    @Param('key') key: string,
  ): Promise<SystemSettings> {
    return await this.settingsService.getSystemSettingByKey(key);
  }

  @Patch('system/:id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Update system setting' })
  @ApiResponse({
    status: 200,
    description: 'System setting updated successfully',
    type: SystemSettings,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'System setting not found' })
  async updateSystemSetting(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSystemSettingDto,
    @Request() req: any,
  ): Promise<SystemSettings> {
    return await this.settingsService.updateSystemSetting(
      id,
      updateDto,
      req.user.role,
    );
  }

  @Delete('system/:id')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete system setting' })
  @ApiResponse({
    status: 204,
    description: 'System setting deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cannot delete core system settings',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'System setting not found' })
  async deleteSystemSetting(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    return await this.settingsService.deleteSystemSetting(id, req.user.role);
  }

  @Get('system/category/:category')
  @ApiOperation({ summary: 'Get settings by category' })
  @ApiResponse({
    status: 200,
    description: 'Settings retrieved successfully',
    type: [SystemSettings],
  })
  async getSettingsByCategory(
    @Param('category') category: SettingCategory,
  ): Promise<SystemSettings[]> {
    return await this.settingsService.getSettingsByCategory(category);
  }

  @Get('system/scope/:scope')
  @ApiOperation({ summary: 'Get settings by scope' })
  @ApiResponse({
    status: 200,
    description: 'Settings retrieved successfully',
    type: [SystemSettings],
  })
  async getSettingsByScope(
    @Param('scope') scope: SettingScope,
  ): Promise<SystemSettings[]> {
    return await this.settingsService.getSettingsByScope(scope);
  }

  // Workflow Management Endpoints
  @Post('workflows')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Create a new workflow' })
  @ApiResponse({
    status: 201,
    description: 'Workflow created successfully',
    type: Workflow,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async createWorkflow(
    @Body() createDto: CreateWorkflowDto,
    @Request() req: any,
  ): Promise<Workflow> {
    return await this.settingsService.createWorkflow(createDto, req.user.role);
  }

  @Get('workflows')
  @ApiOperation({ summary: 'Get all workflows' })
  @ApiResponse({
    status: 200,
    description: 'Workflows retrieved successfully',
    type: [Workflow],
  })
  async getAllWorkflows(): Promise<Workflow[]> {
    return await this.settingsService.getAllWorkflows();
  }

  @Get('workflows/:id')
  @ApiOperation({ summary: 'Get workflow by ID' })
  @ApiResponse({
    status: 200,
    description: 'Workflow retrieved successfully',
    type: Workflow,
  })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async getWorkflowById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Workflow> {
    return await this.settingsService.getWorkflowById(id);
  }

  @Get('workflows/module/:module')
  @ApiOperation({ summary: 'Get workflows by module' })
  @ApiResponse({
    status: 200,
    description: 'Workflows retrieved successfully',
    type: [Workflow],
  })
  async getWorkflowsByModule(
    @Param('module') module: string,
  ): Promise<Workflow[]> {
    return await this.settingsService.getWorkflowsByModule(module);
  }

  @Get('workflows/module/:module/default')
  @ApiOperation({ summary: 'Get default workflow for module' })
  @ApiResponse({
    status: 200,
    description: 'Default workflow retrieved successfully',
    type: Workflow,
  })
  @ApiResponse({
    status: 404,
    description: 'No default workflow found for module',
  })
  async getDefaultWorkflow(@Param('module') module: string): Promise<Workflow> {
    return await this.settingsService.getDefaultWorkflow(module);
  }

  @Patch('workflows/:id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Update workflow' })
  @ApiResponse({
    status: 200,
    description: 'Workflow updated successfully',
    type: Workflow,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async updateWorkflow(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateWorkflowDto,
    @Request() req: any,
  ): Promise<Workflow> {
    return await this.settingsService.updateWorkflow(
      id,
      updateDto,
      req.user.role,
    );
  }

  @Delete('workflows/:id')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete workflow' })
  @ApiResponse({ status: 204, description: 'Workflow deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cannot delete default or active workflow',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async deleteWorkflow(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    return await this.settingsService.deleteWorkflow(id, req.user.role);
  }

  // Workflow Steps Management
  @Post('workflows/:workflowId/steps')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Add step to workflow' })
  @ApiResponse({
    status: 201,
    description: 'Workflow step added successfully',
    type: WorkflowStep,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cannot modify active workflow',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async addWorkflowStep(
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @Body() createDto: CreateWorkflowStepDto,
    @Request() req: any,
  ): Promise<WorkflowStep> {
    return await this.settingsService.addWorkflowStep(
      workflowId,
      createDto,
      req.user.role,
    );
  }

  @Patch('workflow-steps/:stepId')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Update workflow step' })
  @ApiResponse({
    status: 200,
    description: 'Workflow step updated successfully',
    type: WorkflowStep,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cannot modify active workflow',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Workflow step not found' })
  async updateWorkflowStep(
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() updateDto: Partial<CreateWorkflowStepDto>,
    @Request() req: any,
  ): Promise<WorkflowStep> {
    return await this.settingsService.updateWorkflowStep(
      stepId,
      updateDto,
      req.user.role,
    );
  }

  @Delete('workflow-steps/:stepId')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.DISTRICT_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete workflow step' })
  @ApiResponse({
    status: 204,
    description: 'Workflow step deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cannot modify active workflow',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Workflow step not found' })
  async deleteWorkflowStep(
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Request() req: any,
  ): Promise<void> {
    return await this.settingsService.deleteWorkflowStep(stepId, req.user.role);
  }

  // Configuration Management
  @Get('export')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Export system configuration' })
  @ApiResponse({
    status: 200,
    description: 'Configuration exported successfully',
  })
  async exportConfiguration(): Promise<any> {
    return await this.settingsService.exportConfiguration();
  }

  @Post('import')
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Import system configuration' })
  @ApiResponse({
    status: 200,
    description: 'Configuration imported successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async importConfiguration(
    @Body() configData: any,
    @Request() req: any,
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    return await this.settingsService.importConfiguration(
      configData,
      req.user.role,
    );
  }

  @Post('reset-defaults')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset system to default configuration' })
  @ApiResponse({
    status: 204,
    description: 'System reset to defaults successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async resetToDefaults(@Request() req: any): Promise<void> {
    return await this.settingsService.resetToDefaults(req.user.role);
  }

  @Get('validate')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Validate system configuration' })
  @ApiResponse({
    status: 200,
    description: 'Configuration validation completed',
  })
  async validateConfiguration(): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    return await this.settingsService.validateConfiguration();
  }
}
