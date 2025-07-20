export enum SettingCategory {
  SYSTEM = 'system',
  WORKFLOW = 'workflow',
  NOTIFICATION = 'notification',
  SECURITY = 'security',
  LAND_REGISTRATION = 'land_registration',
  LAND_TRANSFER = 'land_transfer',
  LAND_TAXES = 'land_taxes',
  CONFLICT_RESOLUTION = 'conflict_resolution',
  CONSTRUCTION_PERMITS = 'construction_permits',
  USER_MANAGEMENT = 'user_management',
  REPORTS = 'reports',
  INTEGRATION = 'integration',
}

export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  EMAIL = 'email',
  URL = 'url',
  PASSWORD = 'password',
  DATE = 'date',
  ENUM = 'enum',
}

export enum SettingScope {
  GLOBAL = 'global',
  DISTRICT = 'district',
  SECTOR = 'sector',
  CELL = 'cell',
  USER = 'user',
}

export enum WorkflowStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
}
