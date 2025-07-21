import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Workflow } from './entities/workflow.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { SystemSettings } from './entities/system-settings.entity';
import { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import {
  CreateWorkflowDto,
  CreateWorkflowStepDto,
  UpdateWorkflowDto,
  SettingsFilterDto,
} from './dto/workflow.dto';
import {
  SettingCategory,
  SettingType,
  SettingScope,
  WorkflowStatus,
} from './enums/settings.enum';
import { UserRole } from '../auth/enums/user-role.enum';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SystemSettings)
    private systemSettingRepository: Repository<SystemSettings>,
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowStep)
    private workflowStepRepository: Repository<WorkflowStep>,
  ) {}

  // System Settings Management
  async createSystemSetting(
    createDto: CreateSystemSettingDto,
    userRole: UserRole,
  ): Promise<SystemSettings> {
    if (
      userRole !== UserRole.SYSTEM_ADMIN &&
      userRole !== UserRole.DISTRICT_ADMIN
    ) {
      throw new ForbiddenException(
        'Only system administrators can create system settings',
      );
    }

    // Check if setting with same key exists
    const existingSetting = await this.systemSettingRepository.findOne({
      where: { key: createDto.key },
    });

    if (existingSetting) {
      throw new BadRequestException(
        `Setting with key '${createDto.key}' already exists`,
      );
    }

    const setting = this.systemSettingRepository.create(createDto);
    return await this.systemSettingRepository.save(setting);
  }

  async getAllSystemSettings(
    filter: SettingsFilterDto,
  ): Promise<SystemSettings[]> {
    const queryBuilder =
      this.systemSettingRepository.createQueryBuilder('setting');

    if (filter.category) {
      queryBuilder.andWhere('setting.category = :category', {
        category: filter.category,
      });
    }

    if (filter.search) {
      queryBuilder.andWhere(
        '(setting.key ILIKE :search OR setting.displayName ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    if (filter.isActive !== undefined) {
      queryBuilder.andWhere('setting.isActive = :isActive', {
        isActive: filter.isActive,
      });
    }

    queryBuilder
      .orderBy('setting.category', 'ASC')
      .addOrderBy('setting.displayName', 'ASC');

    return await queryBuilder.getMany();
  }

  async getSystemSettingById(id: string): Promise<SystemSettings> {
    const setting = await this.systemSettingRepository.findOne({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException(`System setting with ID ${id} not found`);
    }

    return setting;
  }

  async getSystemSettingByKey(key: string): Promise<SystemSettings> {
    const setting = await this.systemSettingRepository.findOne({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`System setting with key '${key}' not found`);
    }

    return setting;
  }

  async updateSystemSetting(
    id: string,
    updateDto: UpdateSystemSettingDto,
    userRole: UserRole,
  ): Promise<SystemSettings> {
    if (
      userRole !== UserRole.SYSTEM_ADMIN &&
      userRole !== UserRole.DISTRICT_ADMIN
    ) {
      throw new ForbiddenException(
        'Only system administrators can update system settings',
      );
    }

    const setting = await this.getSystemSettingById(id);

    // If key is being updated, check for conflicts
    if (
      typeof updateDto.key === 'string' &&
      updateDto.key &&
      updateDto.key !== setting.key
    ) {
      const existingSetting = await this.systemSettingRepository.findOne({
        where: { key: updateDto.key },
      });

      if (existingSetting) {
        throw new BadRequestException(
          `Setting with key '${updateDto.key}' already exists`,
        );
      }
    }

    Object.assign(setting, updateDto);
    setting.updatedAt = new Date();

    return await this.systemSettingRepository.save(setting);
  }

  async deleteSystemSetting(id: string, userRole: UserRole): Promise<void> {
    if (userRole !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException(
        'Only system administrators can delete system settings',
      );
    }

    const setting = await this.getSystemSettingById(id);

    if (
      setting.category === SettingCategory.SYSTEM &&
      setting.key.startsWith('system.')
    ) {
      throw new BadRequestException('Core system settings cannot be deleted');
    }

    await this.systemSettingRepository.remove(setting);
  }

  async getSettingsByCategory(
    category: SettingCategory,
  ): Promise<SystemSettings[]> {
    return await this.systemSettingRepository.find({
      where: { category, isActive: true },
      order: { displayName: 'ASC' },
    });
  }

  async getSettingsByScope(scope: SettingScope): Promise<SystemSettings[]> {
    return await this.systemSettingRepository.find({
      where: { scope, isActive: true },
      order: { category: 'ASC', displayName: 'ASC' },
    });
  }

  // Workflow Management
  async createWorkflow(
    createDto: CreateWorkflowDto,
    userRole: UserRole,
  ): Promise<Workflow> {
    if (
      userRole !== UserRole.SYSTEM_ADMIN &&
      userRole !== UserRole.DISTRICT_ADMIN
    ) {
      throw new ForbiddenException('Only administrators can create workflows');
    }

    // If this is set as default, updating existing default workflow
    if (createDto.isDefault) {
      await this.workflowRepository.update(
        { module: createDto.module, isDefault: true },
        { isDefault: false },
      );
    }

    const workflow = this.workflowRepository.create({
      ...createDto,
      status: WorkflowStatus.DRAFT,
    });

    return await this.workflowRepository.save(workflow);
  }

  async getAllWorkflows(): Promise<Workflow[]> {
    return await this.workflowRepository.find({
      relations: ['steps'],
      order: { module: 'ASC', name: 'ASC' },
    });
  }

  async getWorkflowById(id: string): Promise<Workflow> {
    const workflow = await this.workflowRepository.findOne({
      where: { id },
      relations: ['steps'],
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return workflow;
  }

  async getWorkflowsByModule(module: string): Promise<Workflow[]> {
    return await this.workflowRepository.find({
      where: { module },
      relations: ['steps'],
      order: { name: 'ASC' },
    });
  }

  async getDefaultWorkflow(module: string): Promise<Workflow> {
    const workflow = await this.workflowRepository.findOne({
      where: { module, isDefault: true, status: WorkflowStatus.ACTIVE },
      relations: ['steps'],
    });

    if (!workflow) {
      throw new NotFoundException(
        `No default workflow found for module '${module}'`,
      );
    }

    return workflow;
  }

  async updateWorkflow(
    id: string,
    updateDto: UpdateWorkflowDto,
    userRole: UserRole,
  ): Promise<Workflow> {
    if (
      userRole !== UserRole.SYSTEM_ADMIN &&
      userRole !== UserRole.DISTRICT_ADMIN
    ) {
      throw new ForbiddenException('Only administrators can update workflows');
    }

    const workflow = await this.getWorkflowById(id);

    // If setting as default, update existing default
    if (updateDto.isDefault) {
      await this.workflowRepository.update(
        { module: workflow.module, isDefault: true },
        { isDefault: false },
      );
    }

    Object.assign(workflow, updateDto);
    workflow.updatedAt = new Date();

    return await this.workflowRepository.save(workflow);
  }

  async deleteWorkflow(id: string, userRole: UserRole): Promise<void> {
    if (userRole !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException(
        'Only system administrators can delete workflows',
      );
    }

    const workflow = await this.getWorkflowById(id);

    if (workflow.isDefault) {
      throw new BadRequestException(
        'Cannot delete default workflow. Set another workflow as default first.',
      );
    }

    if (workflow.status === WorkflowStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot delete active workflow. Deactivate it first.',
      );
    }

    await this.workflowRepository.remove(workflow);
  }

  // Workflow Steps Management
  async addWorkflowStep(
    workflowId: string,
    createDto: CreateWorkflowStepDto,
    userRole: UserRole,
  ): Promise<WorkflowStep> {
    if (
      userRole !== UserRole.SYSTEM_ADMIN &&
      userRole !== UserRole.DISTRICT_ADMIN
    ) {
      throw new ForbiddenException(
        'Only administrators can add workflow steps',
      );
    }

    const workflow = await this.getWorkflowById(workflowId);

    if (workflow.status === WorkflowStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot modify active workflow. Create a new version instead.',
      );
    }

    const step = this.workflowStepRepository.create({
      ...createDto,
      workflow,
    });

    return await this.workflowStepRepository.save(step);
  }

  async updateWorkflowStep(
    stepId: string,
    updateDto: Partial<CreateWorkflowStepDto>,
    userRole: UserRole,
  ): Promise<WorkflowStep> {
    if (
      userRole !== UserRole.SYSTEM_ADMIN &&
      userRole !== UserRole.DISTRICT_ADMIN
    ) {
      throw new ForbiddenException(
        'Only administrators can update workflow steps',
      );
    }

    const step = await this.workflowStepRepository.findOne({
      where: { id: stepId },
      relations: ['workflow'],
    });

    if (!step) {
      throw new NotFoundException(`Workflow step with ID ${stepId} not found`);
    }

    if (step.workflow.status === WorkflowStatus.ACTIVE) {
      throw new BadRequestException('Cannot modify steps of active workflow');
    }

    Object.assign(step, updateDto);
    return await this.workflowStepRepository.save(step);
  }

  async deleteWorkflowStep(stepId: string, userRole: UserRole): Promise<void> {
    if (
      userRole !== UserRole.SYSTEM_ADMIN &&
      userRole !== UserRole.DISTRICT_ADMIN
    ) {
      throw new ForbiddenException(
        'Only administrators can delete workflow steps',
      );
    }

    const step = await this.workflowStepRepository.findOne({
      where: { id: stepId },
      relations: ['workflow'],
    });

    if (!step) {
      throw new NotFoundException(`Workflow step with ID ${stepId} not found`);
    }

    if (step.workflow.status === WorkflowStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete steps from active workflow');
    }

    await this.workflowStepRepository.remove(step);
  }

  // Configuration Management
  async exportConfiguration(): Promise<any> {
    const settings = await this.systemSettingRepository.find({
      where: { isActive: true },
    });

    const workflows = await this.workflowRepository.find({
      where: { status: WorkflowStatus.ACTIVE },
      relations: ['steps'],
    });

    return {
      settings: settings.map((setting) => ({
        key: setting.key,
        value: setting.value,
        category: setting.category,
        type: setting.type,
        scope: setting.scope,
        displayName: setting.displayName,
        description: setting.description,
        validationRules: setting.validationRules,
        options: setting.options,
        sortOrder: setting.sortOrder,
      })),
      workflows: workflows.map((workflow) => ({
        name: workflow.name,
        description: workflow.description,
        module: workflow.module,
        isDefault: workflow.isDefault,
        steps: workflow.steps.map((step) => ({
          name: step.name,
          description: step.description,
          stepType: step.stepType,
          orderIndex: step.orderIndex,
          condition: step.condition,
          assignedRoles: step.assignedRoles,
          requiredFields: step.requiredFields,
          timeoutHours: step.timeoutHours,
        })),
      })),
    };
  }

  async importConfiguration(
    configData: any,
    userRole: UserRole,
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    if (userRole !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException(
        'Only system administrators can import configuration',
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Import settings
    if (configData.settings) {
      for (const settingData of configData.settings) {
        try {
          const existing = await this.systemSettingRepository.findOne({
            where: { key: settingData.key },
          });

          if (existing) {
            skipped++;
            continue;
          }

          const setting = this.systemSettingRepository.create(settingData);
          await this.systemSettingRepository.save(setting);
          imported++;
        } catch (error) {
          errors.push(`Setting ${settingData.key}: ${error.message}`);
        }
      }
    }

    // Import workflows
    if (configData.workflows) {
      for (const workflowData of configData.workflows) {
        try {
          const existing = await this.workflowRepository.findOne({
            where: { name: workflowData.name, module: workflowData.module },
          });

          if (existing) {
            skipped++;
            continue;
          }

          const workflow = this.workflowRepository.create({
            name: workflowData.name,
            description: workflowData.description,
            module: workflowData.module,
            isDefault: workflowData.isDefault,
            status: WorkflowStatus.DRAFT,
          });

          const savedWorkflow = await this.workflowRepository.save(workflow);

          // Import workflow steps
          for (const stepData of workflowData.steps || []) {
            const step = this.workflowStepRepository.create({
              ...stepData,
              workflow: savedWorkflow,
            });
            await this.workflowStepRepository.save(step);
          }

          imported++;
        } catch (error) {
          errors.push(`Workflow ${workflowData.name}: ${error.message}`);
        }
      }
    }

    return { imported, skipped, errors };
  }

  // Utility Methods
  async resetToDefaults(userRole: UserRole): Promise<void> {
    if (userRole !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException(
        'Only system administrators can reset to defaults',
      );
    }

    
    throw new BadRequestException('Reset to defaults not yet implemented');
  }

  async validateConfiguration(): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check for required system settings
    const requiredSettings = [
      'system.app_name',
      'system.default_language',
      'notification.email_enabled',
      'workflow.default_timeout',
    ];

    for (const key of requiredSettings) {
      const setting = await this.systemSettingRepository.findOne({
        where: { key, isActive: true },
      });

      if (!setting) {
        errors.push(`Required setting '${key}' is missing or inactive`);
      }
    }

    // Checking for default workflows for each module
    const modules = [
      'land_registration',
      'conflict_resolution',
      'urbanization',
      'land_transfer',
      'land_taxes',
    ];

    for (const module of modules) {
      const defaultWorkflow = await this.workflowRepository.findOne({
        where: { module, isDefault: true, status: WorkflowStatus.ACTIVE },
      });

      if (!defaultWorkflow) {
        errors.push(`No default active workflow found for module '${module}'`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
