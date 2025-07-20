# Conflict Resolution Module - API Testing Guide

## ⚖️ Conflict Resolution Module

This module manages land disputes, mediation processes, legal case tracking, and resolution outcomes.

### Base URL

```
http://localhost:3000
```

### Authentication

All endpoints require JWT Bearer token with appropriate roles.

---

## 📋 **Postman Collection - Conflict Resolution**

### **Conflict Case Management**

### 1. **Report Land Conflict**

**POST** `/conflict-resolution/conflicts`

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
  "caseNumber": "CR-2024-001",
  "title": "Boundary Dispute Between Adjacent Properties",
  "description": "Dispute over the exact boundary line between two residential properties in Gasabo District",
  "conflictType": "BOUNDARY_DISPUTE",
  "priority": "MEDIUM",
  "landId": "550e8400-e29b-41d4-a716-446655440000",
  "involvedParties": [
    {
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "role": "COMPLAINANT",
      "description": "Property owner claiming encroachment"
    },
    {
      "userId": "550e8400-e29b-41d4-a716-446655440002",
      "role": "RESPONDENT",
      "description": "Neighboring property owner"
    }
  ],
  "evidenceDocuments": [
    "property_deed.pdf",
    "survey_map.pdf",
    "witness_statements.pdf"
  ],
  "location": {
    "district": "Gasabo",
    "sector": "Kimironko",
    "cell": "Biryogo"
  },
  "requestedResolution": "Professional land survey to establish correct boundary",
  "urgency": false
}
```

### 2. **Get All Conflicts**

**GET** `/conflict-resolution/conflicts`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Query Parameters:**

- `status` (optional): Filter by status (REPORTED, INVESTIGATING, MEDIATION, LEGAL_PROCEEDINGS, RESOLVED, CLOSED)
- `conflictType` (optional): Filter by type (BOUNDARY_DISPUTE, OWNERSHIP_DISPUTE, INHERITANCE_DISPUTE, ENCROACHMENT, FRAUD, OTHER)
- `priority` (optional): Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `district` (optional): Filter by district
- `dateFrom` (optional): Start date filter
- `dateTo` (optional): End date filter

### 3. **Get Conflict by ID**

**GET** `/conflict-resolution/conflicts/{conflictId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 4. **Update Conflict Case**

**PATCH** `/conflict-resolution/conflicts/{conflictId}`

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
  "title": "Updated: Boundary Dispute Between Adjacent Properties",
  "description": "Updated description with additional evidence from field investigation",
  "priority": "HIGH",
  "evidenceDocuments": [
    "property_deed.pdf",
    "survey_map.pdf",
    "witness_statements.pdf",
    "field_investigation_report.pdf"
  ],
  "requestedResolution": "Professional land survey and mediation session"
}
```

### 5. **Assign Investigator (Land Officer/Admin)**

**POST** `/conflict-resolution/conflicts/{conflictId}/assign`

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
  "investigatorId": "550e8400-e29b-41d4-a716-446655440003",
  "assignmentNotes": "Assigning experienced land officer for boundary dispute investigation",
  "expectedDuration": 14,
  "investigationPlan": [
    "Field visit and documentation",
    "Interview involved parties",
    "Review historical land records",
    "Coordinate professional survey if needed"
  ]
}
```

### 6. **Update Investigation Progress**

**POST** `/conflict-resolution/conflicts/{conflictId}/investigation`

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
  "investigationNotes": "Completed field visit and interviewed both parties. Found discrepancies in original survey markers.",
  "findings": [
    "Original boundary markers have been displaced",
    "Both parties have valid claims based on their documents",
    "Professional re-survey required for accurate determination"
  ],
  "recommendations": "Recommend mediation session after professional survey completion",
  "nextSteps": [
    "Commission professional land survey",
    "Schedule mediation session",
    "Prepare mediation documents"
  ],
  "progressPercentage": 60
}
```

### 7. **Schedule Mediation Session**

**POST** `/conflict-resolution/conflicts/{conflictId}/mediation`

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
  "mediatorId": "550e8400-e29b-41d4-a716-446655440004",
  "scheduledDate": "2024-04-15T10:00:00.000Z",
  "venue": "Gasabo District Office, Conference Room A",
  "mediationNotes": "Mediation session to resolve boundary dispute based on new survey results",
  "requiredAttendees": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ],
  "preparationRequired": [
    "Survey report",
    "Original property documents",
    "Witness availability confirmation"
  ]
}
```

### 8. **Record Mediation Outcome**

**POST** `/conflict-resolution/conflicts/{conflictId}/mediation-outcome`

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
  "mediationResult": "AGREEMENT_REACHED",
  "agreementDetails": "Both parties agreed to adjust boundary based on new survey. Complainant to receive 2.5 sq meters compensation.",
  "compensationAmount": 1500000,
  "compensationMethod": "MONETARY",
  "agreementTerms": [
    "Boundary adjustment as per survey report",
    "Monetary compensation of 1,500,000 RWF",
    "Both parties to sign boundary agreement",
    "Local authority to witness boundary marking"
  ],
  "mediationDuration": 180,
  "followUpRequired": true,
  "followUpDate": "2024-05-15",
  "witnessSignatures": [
    "mediator",
    "complainant",
    "respondent",
    "local_authority"
  ]
}
```

### 9. **Escalate to Legal Proceedings**

**POST** `/conflict-resolution/conflicts/{conflictId}/escalate`

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
  "escalationReason": "Mediation failed - parties could not reach agreement",
  "legalJustification": "Complex ownership claims requiring court intervention",
  "courtRecommendation": "DISTRICT_COURT",
  "evidencePackage": [
    "complete_case_file.pdf",
    "investigation_report.pdf",
    "mediation_transcript.pdf",
    "survey_reports.pdf"
  ],
  "estimatedCourtDuration": 90,
  "escalatedBy": "Senior Land Officer"
}
```

### 10. **Record Final Resolution**

**POST** `/conflict-resolution/conflicts/{conflictId}/resolve`

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
  "resolutionType": "MEDIATION_AGREEMENT",
  "resolutionDetails": "Boundary dispute resolved through mediation with monetary compensation",
  "finalOutcome": "Boundary adjusted, compensation paid, both parties satisfied",
  "compensationPaid": true,
  "compensationAmount": 1500000,
  "landChangesRequired": true,
  "newBoundaryCoordinates": [
    { "lat": -1.9536, "lng": 30.0606 },
    { "lat": -1.9537, "lng": 30.0607 },
    { "lat": -1.9538, "lng": 30.0608 }
  ],
  "resolutionDate": "2024-04-20",
  "resolutionDocuments": [
    "mediation_agreement.pdf",
    "boundary_survey.pdf",
    "compensation_receipt.pdf"
  ],
  "followUpActions": [
    "Update land registry",
    "File resolution documents",
    "Monitor compliance"
  ],
  "satisfactionLevel": "HIGH"
}
```

### 11. **Close Conflict Case**

**POST** `/conflict-resolution/conflicts/{conflictId}/close`

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
  "closureReason": "Successfully resolved through mediation",
  "finalNotes": "Case closed successfully. All parties satisfied with outcome. Land registry updated.",
  "lessonsLearned": [
    "Early professional survey prevents prolonged disputes",
    "Mediation effective for boundary disputes",
    "Clear documentation essential for resolution"
  ],
  "caseCompleted": true
}
```

### 12. **Get Conflicts by Land**

**GET** `/conflict-resolution/conflicts/by-land/{landId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 13. **Get Conflicts by User**

**GET** `/conflict-resolution/conflicts/by-user/{userId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 14. **Get My Conflicts (Current User)**

**GET** `/conflict-resolution/conflicts/my-conflicts`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

---

### **Conflict Analytics & Reports**

### 15. **Get Conflict Statistics**

**GET** `/conflict-resolution/statistics`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 16. **Get Resolution Performance Report**

**GET** `/conflict-resolution/reports/performance`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Query Parameters:**

- `year` (optional): Filter by year
- `district` (optional): Filter by district
- `quarter` (optional): Filter by quarter (1, 2, 3, 4)

### 17. **Get Conflict Trends Analysis**

**GET** `/conflict-resolution/reports/trends`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 18. **Get District Conflict Report**

**GET** `/conflict-resolution/reports/district/{district}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

---

### **Search & Filtering**

### 19. **Search Conflicts**

**GET** `/conflict-resolution/conflicts/search`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Query Parameters:**

- `q` (required): Search query
- `searchIn` (optional): Fields to search in (title, description, caseNumber)
- `conflictType` (optional): Filter by conflict type
- `status` (optional): Filter by status

### 20. **Get Conflicts Requiring Action**

**GET** `/conflict-resolution/conflicts/requiring-action`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

---

## 🧪 **Test Scenarios**

### **Scenario 1: Complete Conflict Resolution Flow (Success)**

1. **Report boundary dispute:**

   ```json
   POST /conflict-resolution/conflicts
   {
     "caseNumber": "CR-2024-001",
     "title": "Boundary Dispute",
     "conflictType": "BOUNDARY_DISPUTE",
     "landId": "your-land-id",
     "involvedParties": [...]
   }
   ```

2. **Assign investigator:**

   ```json
   POST /conflict-resolution/conflicts/{conflictId}/assign
   {
     "investigatorId": "investigator-id",
     "assignmentNotes": "Boundary dispute investigation"
   }
   ```

3. **Update investigation progress:**

   ```json
   POST /conflict-resolution/conflicts/{conflictId}/investigation
   {
     "investigationNotes": "Field visit completed",
     "findings": ["Boundary markers displaced"],
     "progressPercentage": 60
   }
   ```

4. **Schedule mediation:**

   ```json
   POST /conflict-resolution/conflicts/{conflictId}/mediation
   {
     "mediatorId": "mediator-id",
     "scheduledDate": "2024-04-15T10:00:00.000Z",
     "venue": "District Office"
   }
   ```

5. **Record successful mediation:**

   ```json
   POST /conflict-resolution/conflicts/{conflictId}/mediation-outcome
   {
     "mediationResult": "AGREEMENT_REACHED",
     "agreementDetails": "Boundary adjustment agreed",
     "compensationAmount": 1500000
   }
   ```

6. **Record final resolution:**

   ```json
   POST /conflict-resolution/conflicts/{conflictId}/resolve
   {
     "resolutionType": "MEDIATION_AGREEMENT",
     "finalOutcome": "Dispute resolved successfully",
     "compensationPaid": true
   }
   ```

7. **Close case:**
   ```json
   POST /conflict-resolution/conflicts/{conflictId}/close
   {
     "closureReason": "Successfully resolved",
     "caseCompleted": true
   }
   ```

### **Scenario 2: Mediation Failure - Legal Escalation**

1. **Follow steps 1-4 from Scenario 1**

2. **Record failed mediation:**

   ```json
   POST /conflict-resolution/conflicts/{conflictId}/mediation-outcome
   {
     "mediationResult": "NO_AGREEMENT",
     "agreementDetails": "Parties could not reach agreement",
     "followUpRequired": true
   }
   ```

3. **Escalate to legal proceedings:**
   ```json
   POST /conflict-resolution/conflicts/{conflictId}/escalate
   {
     "escalationReason": "Mediation failed",
     "courtRecommendation": "DISTRICT_COURT",
     "estimatedCourtDuration": 90
   }
   ```

### **Scenario 3: Multiple Party Inheritance Dispute**

1. **Report inheritance dispute:**

   ```json
   POST /conflict-resolution/conflicts
   {
     "title": "Land Inheritance Dispute",
     "conflictType": "INHERITANCE_DISPUTE",
     "involvedParties": [
       {"role": "COMPLAINANT", "description": "Eldest son claiming inheritance"},
       {"role": "RESPONDENT", "description": "Second son disputing claim"},
       {"role": "INTERESTED_PARTY", "description": "Widow claiming rights"}
     ]
   }
   ```

2. **Follow investigation and mediation process**
3. **Complex mediation with multiple agreements**

---

## 📊 **Response Examples**

### **Conflict Case Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "caseNumber": "CR-2024-001",
  "title": "Boundary Dispute Between Adjacent Properties",
  "description": "Dispute over the exact boundary line between two residential properties",
  "conflictType": "BOUNDARY_DISPUTE",
  "status": "RESOLVED",
  "priority": "MEDIUM",
  "urgency": false,
  "reportedBy": {
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
  "involvedParties": [
    {
      "user": {
        "id": "party1-id",
        "firstName": "John",
        "lastName": "Doe"
      },
      "role": "COMPLAINANT",
      "description": "Property owner claiming encroachment"
    },
    {
      "user": {
        "id": "party2-id",
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "role": "RESPONDENT",
      "description": "Neighboring property owner"
    }
  ],
  "investigator": {
    "id": "investigator-id",
    "firstName": "Michael",
    "lastName": "Johnson"
  },
  "mediator": {
    "id": "mediator-id",
    "firstName": "Sarah",
    "lastName": "Wilson"
  },
  "investigationNotes": "Field visit completed. Boundary markers displaced.",
  "findings": [
    "Original boundary markers have been displaced",
    "Both parties have valid claims",
    "Professional re-survey required"
  ],
  "mediationResult": "AGREEMENT_REACHED",
  "agreementDetails": "Boundary adjustment with monetary compensation",
  "compensationAmount": 1500000,
  "compensationPaid": true,
  "resolutionType": "MEDIATION_AGREEMENT",
  "resolutionDate": "2024-04-20T00:00:00.000Z",
  "finalOutcome": "Boundary adjusted, compensation paid, both parties satisfied",
  "location": {
    "district": "Gasabo",
    "sector": "Kimironko",
    "cell": "Biryogo"
  },
  "evidenceDocuments": [
    "property_deed.pdf",
    "survey_map.pdf",
    "mediation_agreement.pdf"
  ],
  "createdAt": "2024-03-01T10:00:00.000Z",
  "updatedAt": "2024-04-20T16:00:00.000Z",
  "closedAt": "2024-04-22T09:00:00.000Z"
}
```

### **Conflict Statistics:**

```json
{
  "totalConflicts": 389,
  "activeConflicts": 67,
  "resolvedConflicts": 298,
  "closedConflicts": 322,
  "conflictsByType": {
    "BOUNDARY_DISPUTE": 156,
    "OWNERSHIP_DISPUTE": 89,
    "INHERITANCE_DISPUTE": 67,
    "ENCROACHMENT": 45,
    "FRAUD": 23,
    "OTHER": 9
  },
  "conflictsByStatus": {
    "REPORTED": 12,
    "INVESTIGATING": 28,
    "MEDIATION": 15,
    "LEGAL_PROCEEDINGS": 12,
    "RESOLVED": 298,
    "CLOSED": 24
  },
  "resolutionMethods": {
    "MEDIATION_AGREEMENT": 234,
    "COURT_DECISION": 45,
    "ADMINISTRATIVE_DECISION": 19
  },
  "averageResolutionTime": 45.7,
  "mediationSuccessRate": 83.2,
  "totalCompensationPaid": 456000000,
  "conflictsByDistrict": {
    "Gasabo": 134,
    "Nyarugenge": 98,
    "Kicukiro": 89,
    "Musanze": 68
  },
  "monthlyTrends": [
    { "month": "January", "reported": 28, "resolved": 31 },
    { "month": "February", "reported": 23, "resolved": 29 },
    { "month": "March", "reported": 31, "resolved": 26 }
  ]
}
```

---

## 🔐 **Role-Based Access**

| Action                   | Citizen | Land Officer  | District Admin | Mediator | Legal Officer |
| ------------------------ | ------- | ------------- | -------------- | -------- | ------------- |
| Report Conflict          | ✅      | ✅            | ✅             | ❌       | ❌            |
| View Own Conflicts       | ✅      | ✅            | ✅             | ✅       | ✅            |
| View All Conflicts       | ❌      | ✅ (District) | ✅ (All)       | ✅       | ✅            |
| Assign Investigator      | ❌      | ✅            | ✅             | ❌       | ❌            |
| Update Investigation     | ❌      | ✅ (Assigned) | ✅             | ❌       | ❌            |
| Schedule Mediation       | ❌      | ✅            | ✅             | ✅       | ❌            |
| Record Mediation Outcome | ❌      | ❌            | ✅             | ✅       | ❌            |
| Escalate to Legal        | ❌      | ✅            | ✅             | ❌       | ✅            |
| Record Resolution        | ❌      | ✅            | ✅             | ✅       | ✅            |
| Close Case               | ❌      | ✅            | ✅             | ❌       | ✅            |
| Generate Reports         | ❌      | ✅            | ✅             | ✅       | ✅            |

---

## ⚠️ **Common Error Responses**

### **400 - Bad Request:**

```json
{
  "statusCode": 400,
  "message": "Case number already exists",
  "error": "Bad Request"
}
```

### **403 - Forbidden:**

```json
{
  "statusCode": 403,
  "message": "Only the assigned investigator can update investigation progress",
  "error": "Forbidden"
}
```

### **404 - Not Found:**

```json
{
  "statusCode": 404,
  "message": "Conflict case not found",
  "error": "Not Found"
}
```

### **409 - Conflict:**

```json
{
  "statusCode": 409,
  "message": "Cannot escalate case that is already resolved",
  "error": "Conflict"
}
```

---

## 📝 **Testing Notes**

1. **Prerequisites:** Land records and user accounts must exist
2. **Case Numbers:** Must be unique across the system
3. **Status Flow:** Cases must follow logical status progression
4. **Role Requirements:** Different actions require specific roles
5. **Evidence Management:** All evidence documents should be properly uploaded
6. **Mediation Scheduling:** Ensure all parties are available for scheduled sessions
7. **Follow-up Actions:** Some resolutions require follow-up and monitoring

This comprehensive guide covers all aspects of the Conflict Resolution Module!
