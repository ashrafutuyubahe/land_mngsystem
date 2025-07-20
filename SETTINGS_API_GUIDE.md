# Settings Module - API Testing Guide

## 🛠️ Settings Module

This module manages system configuration, workflows, and administrative settings for the land administration system.

### Base URL

```
http://localhost:3000
```

### Authentication

All endpoints require JWT Bearer token with appropriate admin roles.

---

## 📋 **Postman Collection - Settings**

### **System Settings Management**

### 1. **Create System Setting**

**POST** `/settings/system`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body (JSON):**

```json
{
  "key": "land_tax_default_rate",
  "value": "0.05",
  "defaultValue": "0.05",
  "displayName": "Default Land Tax Rate",
  "description": "Default percentage rate for land taxation",
  "category": "TAXATION",
  "dataType": "NUMBER",
  "scope": "GLOBAL",
  "isActive": true,
  "isReadOnly": false,
  "validationRules": {
    "min": 0,
    "max": 1,
    "required": true
  },
  "unit": "percentage",
  "sortOrder": 1
}
```

### 2. **Get All System Settings**

**GET** `/settings/system`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Query Parameters:**

- `category` (optional): Filter by category (SYSTEM, WORKFLOW, NOTIFICATION, SECURITY, TAXATION)
- `search` (optional): Search in key or display name
- `isActive` (optional): Filter by active status (true/false)

### 3. **Get System Setting by ID**

**GET** `/settings/system/{settingId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 4. **Get System Setting by Key**

**GET** `/settings/system/key/{settingKey}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Example:** `/settings/system/key/land_tax_default_rate`

### 5. **Update System Setting**

**PATCH** `/settings/system/{settingId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body (JSON):**

```json
{
  "value": "0.06",
  "description": "Updated default percentage rate for land taxation",
  "isActive": true
}
```

### 6. **Delete System Setting**

**DELETE** `/settings/system/{settingId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 7. **Get Settings by Category**

**GET** `/settings/system/category/{category}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Categories:** SYSTEM, WORKFLOW, NOTIFICATION, SECURITY, TAXATION, USER_MANAGEMENT

### 8. **Get Settings by Scope**

**GET** `/settings/system/scope/{scope}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Scopes:** GLOBAL, DISTRICT, SECTOR, CELL

---

### **Workflow Management**

### 9. **Create Workflow**

**POST** `/settings/workflows`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body (JSON):**

```json
{
  "name": "Land Registration Approval Process",
  "description": "Standard workflow for processing land registration applications",
  "module": "land_registration",
  "isDefault": true
}
```

### 10. **Get All Workflows**

**GET** `/settings/workflows`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 11. **Get Workflow by ID**

**GET** `/settings/workflows/{workflowId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 12. **Get Workflows by Module**

**GET** `/settings/workflows/module/{module}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Modules:** land_registration, conflict_resolution, urbanization, land_transfer, land_taxes

### 13. **Get Default Workflow for Module**

**GET** `/settings/workflows/module/{module}/default`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 14. **Update Workflow**

**PATCH** `/settings/workflows/{workflowId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body (JSON):**

```json
{
  "name": "Updated Land Registration Process",
  "status": "ACTIVE",
  "isDefault": true
}
```

### 15. **Delete Workflow**

**DELETE** `/settings/workflows/{workflowId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

---

### **Workflow Steps Management**

### 16. **Add Workflow Step**

**POST** `/settings/workflows/{workflowId}/steps`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body (JSON):**

```json
{
  "name": "Initial Review",
  "description": "Initial review of application documents",
  "stepType": "REVIEW",
  "orderIndex": 1,
  "condition": "SEQUENTIAL",
  "assignedRoles": ["LAND_OFFICER", "DISTRICT_ADMIN"],
  "requiredFields": ["applicantName", "landLocation", "documents"],
  "timeoutHours": 72
}
```

### 17. **Update Workflow Step**

**PATCH** `/settings/workflow-steps/{stepId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body (JSON):**

```json
{
  "name": "Enhanced Initial Review",
  "timeoutHours": 48,
  "requiredFields": [
    "applicantName",
    "landLocation",
    "documents",
    "surveyReport"
  ]
}
```

### 18. **Delete Workflow Step**

**DELETE** `/settings/workflow-steps/{stepId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

---

### **Configuration Management**

### 19. **Export Configuration**

**GET** `/settings/export`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 20. **Import Configuration**

**POST** `/settings/import`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body (JSON):**

```json
{
  "settings": [
    {
      "key": "notification_email_enabled",
      "value": "true",
      "category": "NOTIFICATION",
      "dataType": "BOOLEAN",
      "scope": "GLOBAL",
      "displayName": "Email Notifications Enabled",
      "description": "Enable or disable email notifications"
    }
  ],
  "workflows": [
    {
      "name": "Quick Approval Process",
      "description": "Expedited workflow for urgent cases",
      "module": "land_registration",
      "isDefault": false,
      "steps": [
        {
          "name": "Fast Track Review",
          "stepType": "REVIEW",
          "orderIndex": 1,
          "condition": "SEQUENTIAL",
          "assignedRoles": ["DISTRICT_ADMIN"],
          "timeoutHours": 24
        }
      ]
    }
  ]
}
```

### 21. **Reset to Defaults**

**POST** `/settings/reset-defaults`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 22. **Validate Configuration**

**GET** `/settings/validate`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

---

## 🧪 **Test Scenarios**

### **Scenario 1: Complete Settings Setup**

1. **Create system-wide settings:**

   ```json
   POST /settings/system
   {
     "key": "system_maintenance_mode",
     "value": "false",
     "category": "SYSTEM",
     "dataType": "BOOLEAN",
     "scope": "GLOBAL"
   }
   ```

2. **Create workflow for land registration:**

   ```json
   POST /settings/workflows
   {
     "name": "Standard Registration Process",
     "module": "land_registration",
     "isDefault": true
   }
   ```

3. **Add workflow steps:**
   ```json
   POST /settings/workflows/{workflowId}/steps
   {
     "name": "Document Verification",
     "stepType": "VERIFICATION",
     "orderIndex": 1,
     "assignedRoles": ["LAND_OFFICER"]
   }
   ```

### **Scenario 2: Configuration Export/Import**

1. **Export current configuration:**

   ```json
   GET /settings/export
   ```

2. **Import configuration on new system:**
   ```json
   POST /settings/import
   {exported_configuration_data}
   ```

### **Scenario 3: Settings Validation**

1. **Validate system configuration:**
   ```json
   GET /settings/validate
   ```

---

## 📊 **Response Examples**

### **System Setting Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "key": "land_tax_default_rate",
  "value": "0.05",
  "defaultValue": "0.05",
  "displayName": "Default Land Tax Rate",
  "description": "Default percentage rate for land taxation",
  "category": "TAXATION",
  "dataType": "NUMBER",
  "scope": "GLOBAL",
  "isActive": true,
  "isReadOnly": false,
  "validationRules": {
    "min": 0,
    "max": 1,
    "required": true
  },
  "unit": "percentage",
  "sortOrder": 1,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

### **Workflow Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Land Registration Approval Process",
  "description": "Standard workflow for processing land registration applications",
  "module": "land_registration",
  "status": "ACTIVE",
  "isDefault": true,
  "steps": [
    {
      "id": "step-1",
      "name": "Initial Review",
      "stepType": "REVIEW",
      "orderIndex": 1,
      "condition": "SEQUENTIAL",
      "assignedRoles": ["LAND_OFFICER"],
      "timeoutHours": 72
    }
  ],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

## 🔐 **Role-Based Access**

| Action               | System Admin | District Admin | Land Officer | Citizen |
| -------------------- | ------------ | -------------- | ------------ | ------- |
| Create Settings      | ✅           | ✅ (Limited)   | ❌           | ❌      |
| View Settings        | ✅           | ✅             | ✅ (Limited) | ❌      |
| Update Settings      | ✅           | ✅ (Limited)   | ❌           | ❌      |
| Delete Settings      | ✅           | ❌             | ❌           | ❌      |
| Manage Workflows     | ✅           | ✅             | ❌           | ❌      |
| Export/Import Config | ✅           | ✅             | ❌           | ❌      |
| Reset to Defaults    | ✅           | ❌             | ❌           | ❌      |

---

## ⚠️ **Common Error Responses**

### **400 - Bad Request:**

```json
{
  "statusCode": 400,
  "message": "Setting with key 'land_tax_default_rate' already exists",
  "error": "Bad Request"
}
```

### **403 - Forbidden:**

```json
{
  "statusCode": 403,
  "message": "Only system administrators can create system settings",
  "error": "Forbidden"
}
```

### **404 - Not Found:**

```json
{
  "statusCode": 404,
  "message": "System setting with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

---

## 📝 **Testing Notes**

1. **Prerequisites:** System Admin or District Admin role required
2. **Setting Keys:** Must be unique across the system
3. **Workflow Dependencies:** Cannot delete workflows that are in use
4. **Configuration Validation:** Run validation after major changes
5. **Backup:** Always export configuration before making major changes

This comprehensive guide covers all aspects of the Settings Module!
