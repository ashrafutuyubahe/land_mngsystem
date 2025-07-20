# Urbanization Module - API Testing Guide

## 🏗️ Urbanization Module

This module manages construction permits, building approvals, and urban development planning within land parcels.

### Base URL

```
http://localhost:3000
```

### Authentication

All endpoints require JWT Bearer token with appropriate roles.

---

## 📋 **Postman Collection - Urbanization**

### **Construction Permit Management**

### 1. **Apply for Construction Permit**

**POST** `/urbanization/permits`

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
  "applicationNumber": "CP-2024-001",
  "landId": "550e8400-e29b-41d4-a716-446655440000",
  "constructionType": "RESIDENTIAL",
  "projectName": "Modern Family House",
  "projectDescription": "Two-story residential building with modern amenities",
  "estimatedCost": 75000000,
  "plannedStartDate": "2024-03-01",
  "estimatedDuration": 365,
  "contractorName": "Rwanda Construction Ltd",
  "contractorLicense": "RC-2023-456",
  "architectName": "John Uwimana",
  "architectLicense": "AR-2023-789",
  "buildingSpecs": {
    "floors": 2,
    "rooms": 6,
    "area": 250.5,
    "height": 8.5,
    "materials": ["concrete", "steel", "tiles"]
  },
  "environmentalClearance": true,
  "documents": [
    "architectural_plans.pdf",
    "site_survey.pdf",
    "environmental_clearance.pdf",
    "contractor_license.pdf"
  ]
}
```

### 2. **Get All Construction Permits**

**GET** `/urbanization/permits`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Query Parameters:**

- `status` (optional): Filter by status (PENDING, UNDER_REVIEW, APPROVED, REJECTED, EXPIRED)
- `constructionType` (optional): Filter by type (RESIDENTIAL, COMMERCIAL, INDUSTRIAL, INFRASTRUCTURE)
- `landId` (optional): Filter by specific land parcel

### 3. **Get Construction Permit by ID**

**GET** `/urbanization/permits/{permitId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 4. **Update Construction Permit**

**PATCH** `/urbanization/permits/{permitId}`

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
  "projectDescription": "Updated: Two-story residential building with solar panels",
  "estimatedCost": 80000000,
  "buildingSpecs": {
    "floors": 2,
    "rooms": 7,
    "area": 275.0,
    "height": 8.5,
    "materials": ["concrete", "steel", "tiles", "solar_panels"]
  }
}
```

### 5. **Review Construction Permit (Land Officer/Admin)**

**POST** `/urbanization/permits/{permitId}/review`

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
  "reviewStatus": "APPROVED",
  "reviewNotes": "All documents verified. Construction plans comply with zoning regulations.",
  "conditions": [
    "Must complete construction within 12 months",
    "Environmental protection measures must be implemented",
    "Regular inspections required at foundation, roofing, and completion stages"
  ],
  "approvedArea": 250.5,
  "permitValidUntil": "2025-03-01"
}
```

### 6. **Reject Construction Permit**

**POST** `/urbanization/permits/{permitId}/reject`

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
  "rejectionReason": "Architectural plans do not comply with local building codes",
  "requiredChanges": [
    "Reduce building height to maximum 7 meters",
    "Provide additional parking space",
    "Submit updated environmental impact assessment"
  ]
}
```

### 7. **Cancel Construction Permit**

**POST** `/urbanization/permits/{permitId}/cancel`

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
  "cancellationReason": "Project postponed due to funding issues"
}
```

### 8. **Get Permits by Land**

**GET** `/urbanization/permits/by-land/{landId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 9. **Get Permits by User**

**GET** `/urbanization/permits/by-user/{userId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

---

### **Construction Inspection Management**

### 10. **Schedule Inspection**

**POST** `/urbanization/inspections`

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
  "permitId": "550e8400-e29b-41d4-a716-446655440001",
  "inspectionType": "FOUNDATION",
  "scheduledDate": "2024-04-15T09:00:00.000Z",
  "inspectorNotes": "Foundation inspection scheduled after concrete curing period",
  "requiredDocuments": ["foundation_photos.pdf", "concrete_test_results.pdf"]
}
```

### 11. **Get All Inspections**

**GET** `/urbanization/inspections`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Query Parameters:**

- `permitId` (optional): Filter by construction permit
- `status` (optional): Filter by status (SCHEDULED, IN_PROGRESS, COMPLETED, FAILED)
- `inspectionType` (optional): Filter by type (FOUNDATION, STRUCTURE, ROOFING, ELECTRICAL, PLUMBING, FINAL)

### 12. **Get Inspection by ID**

**GET** `/urbanization/inspections/{inspectionId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 13. **Update Inspection**

**PATCH** `/urbanization/inspections/{inspectionId}`

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
  "scheduledDate": "2024-04-16T10:00:00.000Z",
  "inspectorNotes": "Rescheduled due to weather conditions"
}
```

### 14. **Conduct Inspection (Inspector)**

**POST** `/urbanization/inspections/{inspectionId}/conduct`

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
  "inspectionResult": "PASSED",
  "findings": "Foundation construction meets building code requirements",
  "recommendations": [
    "Proceed with structural framework construction",
    "Ensure proper drainage around foundation"
  ],
  "deficiencies": [],
  "photosUploaded": ["foundation_1.jpg", "foundation_2.jpg", "drainage.jpg"],
  "nextInspectionType": "STRUCTURE",
  "completedAt": "2024-04-15T11:30:00.000Z"
}
```

### 15. **Fail Inspection**

**POST** `/urbanization/inspections/{inspectionId}/fail`

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
  "failureReason": "Foundation does not meet structural requirements",
  "deficiencies": [
    "Concrete strength below required standards",
    "Reinforcement bars incorrectly positioned",
    "Poor drainage system installation"
  ],
  "requiredActions": [
    "Repair foundation concrete",
    "Reposition reinforcement bars",
    "Install proper drainage"
  ],
  "reinspectionRequired": true,
  "estimatedFixDuration": 14
}
```

### 16. **Get Inspections by Permit**

**GET** `/urbanization/inspections/by-permit/{permitId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 17. **Get Inspection Statistics**

**GET** `/urbanization/inspections/statistics`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

---

### **Urban Planning & Analytics**

### 18. **Get Construction Statistics**

**GET** `/urbanization/statistics`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 19. **Get Land Development Report**

**GET** `/urbanization/development-report/{landId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 20. **Get Construction Activities by Area**

**GET** `/urbanization/activities/by-area`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Query Parameters:**

- `district` (optional): Filter by district
- `sector` (optional): Filter by sector
- `dateFrom` (optional): Start date filter
- `dateTo` (optional): End date filter

---

## 🧪 **Test Scenarios**

### **Scenario 1: Complete Construction Permit Flow**

1. **Apply for construction permit:**

   ```json
   POST /urbanization/permits
   {
     "applicationNumber": "CP-2024-001",
     "landId": "your-land-id",
     "constructionType": "RESIDENTIAL",
     "projectName": "Family House",
     "estimatedCost": 50000000
   }
   ```

2. **Land officer reviews and approves:**

   ```json
   POST /urbanization/permits/{permitId}/review
   {
     "reviewStatus": "APPROVED",
     "reviewNotes": "Approved with conditions",
     "conditions": ["Complete within 12 months"]
   }
   ```

3. **Schedule foundation inspection:**

   ```json
   POST /urbanization/inspections
   {
     "permitId": "permit-id",
     "inspectionType": "FOUNDATION",
     "scheduledDate": "2024-04-15T09:00:00.000Z"
   }
   ```

4. **Conduct inspection:**
   ```json
   POST /urbanization/inspections/{inspectionId}/conduct
   {
     "inspectionResult": "PASSED",
     "findings": "Foundation meets requirements"
   }
   ```

### **Scenario 2: Permit Rejection and Resubmission**

1. **Submit permit application**
2. **Officer rejects permit:**
   ```json
   POST /urbanization/permits/{permitId}/reject
   {
     "rejectionReason": "Plans do not comply with zoning",
     "requiredChanges": ["Reduce building height"]
   }
   ```
3. **Update application with changes**
4. **Resubmit for review**

### **Scenario 3: Failed Inspection and Remediation**

1. **Schedule inspection**
2. **Inspector fails inspection:**
   ```json
   POST /urbanization/inspections/{inspectionId}/fail
   {
     "failureReason": "Structural deficiencies found",
     "deficiencies": ["Poor concrete quality"],
     "reinspectionRequired": true
   }
   ```
3. **Contractor fixes issues**
4. **Schedule reinspection**

---

## 📊 **Response Examples**

### **Construction Permit Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "applicationNumber": "CP-2024-001",
  "status": "APPROVED",
  "constructionType": "RESIDENTIAL",
  "projectName": "Modern Family House",
  "projectDescription": "Two-story residential building with modern amenities",
  "estimatedCost": 75000000,
  "approvedCost": 75000000,
  "plannedStartDate": "2024-03-01T00:00:00.000Z",
  "estimatedDuration": 365,
  "permitValidUntil": "2025-03-01T00:00:00.000Z",
  "applicant": {
    "id": "user-id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "land": {
    "id": "land-id",
    "parcelNumber": "KG-001-2024-001",
    "area": 500.75,
    "location": "Kigali, Gasabo"
  },
  "buildingSpecs": {
    "floors": 2,
    "rooms": 6,
    "area": 250.5,
    "height": 8.5,
    "materials": ["concrete", "steel", "tiles"]
  },
  "reviewedBy": {
    "id": "officer-id",
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "reviewNotes": "All documents verified. Construction plans comply with zoning regulations.",
  "conditions": [
    "Must complete construction within 12 months",
    "Regular inspections required"
  ],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-16T14:30:00.000Z"
}
```

### **Inspection Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "permit": {
    "id": "permit-id",
    "applicationNumber": "CP-2024-001",
    "projectName": "Modern Family House"
  },
  "inspectionType": "FOUNDATION",
  "status": "COMPLETED",
  "scheduledDate": "2024-04-15T09:00:00.000Z",
  "completedAt": "2024-04-15T11:30:00.000Z",
  "inspector": {
    "id": "inspector-id",
    "firstName": "Michael",
    "lastName": "Johnson"
  },
  "inspectionResult": "PASSED",
  "findings": "Foundation construction meets building code requirements",
  "recommendations": [
    "Proceed with structural framework construction",
    "Ensure proper drainage around foundation"
  ],
  "deficiencies": [],
  "photosUploaded": ["foundation_1.jpg", "foundation_2.jpg"],
  "nextInspectionType": "STRUCTURE",
  "createdAt": "2024-04-10T08:00:00.000Z",
  "updatedAt": "2024-04-15T11:30:00.000Z"
}
```

### **Construction Statistics:**

```json
{
  "totalPermits": 245,
  "pendingApplications": 18,
  "approvedPermits": 187,
  "rejectedApplications": 23,
  "activeConstructions": 156,
  "completedProjects": 89,
  "constructionTypes": {
    "RESIDENTIAL": 198,
    "COMMERCIAL": 32,
    "INDUSTRIAL": 12,
    "INFRASTRUCTURE": 3
  },
  "inspectionsSummary": {
    "totalInspections": 456,
    "passedInspections": 398,
    "failedInspections": 58,
    "pendingInspections": 12
  },
  "averageApprovalTime": 7.5,
  "averageConstructionDuration": 287
}
```

---

## 🔐 **Role-Based Access**

| Action                 | Citizen              | Land Officer  | District Admin | Inspector |
| ---------------------- | -------------------- | ------------- | -------------- | --------- |
| Apply for Permit       | ✅ (Own land)        | ✅            | ✅             | ❌        |
| View Permits           | ✅ (Own only)        | ✅ (District) | ✅ (All)       | ✅        |
| Update Application     | ✅ (Own, if pending) | ✅            | ✅             | ❌        |
| Review/Approve Permits | ❌                   | ✅            | ✅             | ❌        |
| Cancel Application     | ✅ (Own only)        | ❌            | ❌             | ❌        |
| Schedule Inspections   | ❌                   | ✅            | ✅             | ✅        |
| Conduct Inspections    | ❌                   | ❌            | ❌             | ✅        |
| View Statistics        | ❌                   | ✅            | ✅             | ✅        |

---

## ⚠️ **Common Error Responses**

### **400 - Bad Request:**

```json
{
  "statusCode": 400,
  "message": "Application number already exists",
  "error": "Bad Request"
}
```

### **403 - Forbidden:**

```json
{
  "statusCode": 403,
  "message": "Only the land owner can apply for construction permits on this land",
  "error": "Forbidden"
}
```

### **404 - Not Found:**

```json
{
  "statusCode": 404,
  "message": "Construction permit not found",
  "error": "Not Found"
}
```

---

## 📝 **Testing Notes**

1. **Prerequisites:** Land must be registered and approved
2. **Document Requirements:** All required documents must be uploaded
3. **Zoning Compliance:** Construction must comply with local zoning laws
4. **Inspection Sequence:** Inspections must follow logical construction sequence
5. **Permit Validity:** Permits have expiration dates and must be renewed if needed

This comprehensive guide covers all aspects of the Urbanization Module!
