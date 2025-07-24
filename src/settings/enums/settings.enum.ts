export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  EMAIL = 'email',
  URL = 'url',
}

export enum SettingCategory {
  SYSTEM = 'system',
  EMAIL = 'email',
  SECURITY = 'security',
  NOTIFICATION = 'notification',
  INTEGRATION = 'integration',
  PAYMENT = 'payment',
  WORKFLOW = 'workflow',
  UI = 'ui',
  ANALYTICS = 'analytics',
}

export enum AccessLevel {
  PUBLIC = 'public',
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  SYSTEM = 'system',
}

export enum SettingScope {
  GLOBAL = 'global',
  USER = 'user',
  ROLE = 'role',
  DEPARTMENT = 'department',
  TENANT = 'tenant',
}
