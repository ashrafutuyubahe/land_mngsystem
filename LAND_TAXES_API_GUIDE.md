# Land Taxes Module - API Testing Guide

## 💰 Land Taxes Module

This module manages property taxation, assessment, payment processing, and tax compliance for land parcels.

### Base URL

```
http://localhost:3000
```

### Authentication

All endpoints require JWT Bearer token with appropriate roles.

---

## 📋 **Postman Collection - Land Taxes**

### **Tax Assessment Management**

### 1. **Create Tax Assessment**

**POST** `/land-taxes/assessments`

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
  "landId": "550e8400-e29b-41d4-a716-446655440000",
  "taxYear": 2024,
  "assessmentType": "ANNUAL",
  "landValue": 25000000,
  "improvementValue": 15000000,
  "taxRate": 0.05,
  "taxAmount": 2000000,
  "assessmentDate": "2024-01-15",
  "dueDate": "2024-12-31",
  "assessorNotes": "Standard annual assessment based on current market values",
  "exemptions": [],
  "discounts": [],
  "penalties": []
}
```

### 2. **Get All Tax Assessments**

**GET** `/land-taxes/assessments`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Query Parameters:**

- `taxYear` (optional): Filter by tax year (e.g., 2024)
- `status` (optional): Filter by status (PENDING, APPROVED, DISPUTED, PAID)
- `landId` (optional): Filter by specific land parcel
- `ownerId` (optional): Filter by property owner

### 3. **Get Tax Assessment by ID**

**GET** `/land-taxes/assessments/{assessmentId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 4. **Update Tax Assessment**

**PATCH** `/land-taxes/assessments/{assessmentId}`

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
  "landValue": 27000000,
  "improvementValue": 18000000,
  "taxAmount": 2250000,
  "assessorNotes": "Updated assessment after property improvements",
  "dueDate": "2024-12-31"
}
```

### 5. **Approve Tax Assessment (Tax Officer)**

**POST** `/land-taxes/assessments/{assessmentId}/approve`

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
  "approvalNotes": "Assessment verified and approved based on property valuation report",
  "finalTaxAmount": 2000000
}
```

### 6. **Dispute Tax Assessment (Property Owner)**

**POST** `/land-taxes/assessments/{assessmentId}/dispute`

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
  "disputeReason": "Property value overestimated",
  "supportingDocuments": ["independent_valuation.pdf", "property_photos.pdf"],
  "requestedTaxAmount": 1500000,
  "disputeDetails": "Independent valuation shows property value 20% lower than assessed"
}
```

### 7. **Resolve Tax Dispute**

**POST** `/land-taxes/assessments/{assessmentId}/resolve-dispute`

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
  "resolution": "ADJUSTED",
  "adjustedTaxAmount": 1750000,
  "resolutionNotes": "Tax amount reduced after reviewing independent valuation report",
  "resolvedBy": "Tax Review Committee"
}
```

### 8. **Get Assessments by Land**

**GET** `/land-taxes/assessments/by-land/{landId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 9. **Get Assessments by Owner**

**GET** `/land-taxes/assessments/by-owner/{ownerId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

---

### **Tax Payment Management**

### 10. **Create Tax Payment**

**POST** `/land-taxes/payments`

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
  "assessmentId": "550e8400-e29b-41d4-a716-446655440001",
  "paymentMethod": "BANK_TRANSFER",
  "amountPaid": 2000000,
  "paymentDate": "2024-06-15",
  "receiptNumber": "REC-2024-LT-001",
  "bankReference": "BK-REF-789456123",
  "paymentNotes": "Full tax payment for 2024",
  "partialPayment": false
}
```

### 11. **Get All Tax Payments**

**GET** `/land-taxes/payments`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Query Parameters:**

- `assessmentId` (optional): Filter by tax assessment
- `paymentMethod` (optional): Filter by payment method
- `dateFrom` (optional): Start date filter
- `dateTo` (optional): End date filter
- `status` (optional): Filter by status (PENDING, CONFIRMED, FAILED, REFUNDED)

### 12. **Get Tax Payment by ID**

**GET** `/land-taxes/payments/{paymentId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 13. **Update Tax Payment**

**PATCH** `/land-taxes/payments/{paymentId}`

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
  "bankReference": "BK-REF-789456123-UPDATED",
  "paymentNotes": "Updated bank reference number",
  "verificationStatus": "VERIFIED"
}
```

### 14. **Verify Tax Payment (Tax Officer)**

**POST** `/land-taxes/payments/{paymentId}/verify`

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
  "verificationStatus": "VERIFIED",
  "verifiedAmount": 2000000,
  "verificationNotes": "Payment confirmed with bank records",
  "verificationDate": "2024-06-16"
}
```

### 15. **Cancel Tax Payment**

**POST** `/land-taxes/payments/{paymentId}/cancel`

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
  "cancellationReason": "Duplicate payment entry",
  "refundRequired": true
}
```

### 16. **Get Payments by Assessment**

**GET** `/land-taxes/payments/by-assessment/{assessmentId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

---

### **Tax Exemptions & Discounts**

### 17. **Apply for Tax Exemption**

**POST** `/land-taxes/exemptions`

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
  "assessmentId": "550e8400-e29b-41d4-a716-446655440001",
  "exemptionType": "DISABILITY",
  "exemptionRate": 50,
  "applicationReason": "Property owner has certified disability",
  "supportingDocuments": ["disability_certificate.pdf", "medical_report.pdf"],
  "validFrom": "2024-01-01",
  "validUntil": "2024-12-31"
}
```

### 18. **Get All Tax Exemptions**

**GET** `/land-taxes/exemptions`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 19. **Approve Tax Exemption**

**POST** `/land-taxes/exemptions/{exemptionId}/approve`

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
  "approvalNotes": "Exemption approved based on valid disability certificate",
  "approvedRate": 50,
  "approvedValidUntil": "2024-12-31"
}
```

### 20. **Apply Early Payment Discount**

**POST** `/land-taxes/discounts/early-payment`

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
  "assessmentId": "550e8400-e29b-41d4-a716-446655440001",
  "discountRate": 10,
  "discountReason": "Early payment before March 31st",
  "paymentDate": "2024-03-15"
}
```

---

### **Penalties & Enforcement**

### 21. **Apply Late Payment Penalty**

**POST** `/land-taxes/penalties`

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
  "assessmentId": "550e8400-e29b-41d4-a716-446655440001",
  "penaltyType": "LATE_PAYMENT",
  "penaltyRate": 2,
  "penaltyAmount": 40000,
  "penaltyReason": "Payment made 30 days after due date",
  "appliedDate": "2025-01-30"
}
```

### 22. **Get Tax Penalties**

**GET** `/land-taxes/penalties`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 23. **Waive Tax Penalty**

**POST** `/land-taxes/penalties/{penaltyId}/waive`

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
  "waiverReason": "First-time late payment, taxpayer in good standing",
  "waivedAmount": 40000,
  "approvedBy": "Tax Manager"
}
```

---

### **Tax Reports & Analytics**

### 24. **Get Tax Collection Report**

**GET** `/land-taxes/reports/collection`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Query Parameters:**

- `year` (optional): Filter by year
- `district` (optional): Filter by district
- `sector` (optional): Filter by sector

### 25. **Get Tax Compliance Report**

**GET** `/land-taxes/reports/compliance`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 26. **Get Outstanding Taxes Report**

**GET** `/land-taxes/reports/outstanding`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 27. **Get Tax Statistics**

**GET** `/land-taxes/statistics`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 28. **Generate Tax Certificate**

**POST** `/land-taxes/certificates`

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
  "landId": "550e8400-e29b-41d4-a716-446655440000",
  "certificateType": "TAX_CLEARANCE",
  "purpose": "Property transfer transaction",
  "requestedBy": "Property owner"
}
```

---

## 🧪 **Test Scenarios**

### **Scenario 1: Complete Tax Assessment & Payment Flow**

1. **Create annual tax assessment:**

   ```json
   POST /land-taxes/assessments
   {
     "landId": "your-land-id",
     "taxYear": 2024,
     "landValue": 25000000,
     "taxRate": 0.05,
     "taxAmount": 1250000
   }
   ```

2. **Tax officer approves assessment:**

   ```json
   POST /land-taxes/assessments/{assessmentId}/approve
   {
     "approvalNotes": "Assessment approved",
     "finalTaxAmount": 1250000
   }
   ```

3. **Property owner makes payment:**

   ```json
   POST /land-taxes/payments
   {
     "assessmentId": "assessment-id",
     "paymentMethod": "BANK_TRANSFER",
     "amountPaid": 1250000,
     "receiptNumber": "REC-2024-001"
   }
   ```

4. **Tax officer verifies payment:**
   ```json
   POST /land-taxes/payments/{paymentId}/verify
   {
     "verificationStatus": "VERIFIED",
     "verifiedAmount": 1250000
   }
   ```

### **Scenario 2: Tax Dispute Resolution**

1. **Create assessment**
2. **Property owner disputes assessment:**
   ```json
   POST /land-taxes/assessments/{assessmentId}/dispute
   {
     "disputeReason": "Property overvalued",
     "requestedTaxAmount": 1000000
   }
   ```
3. **Tax committee resolves dispute:**
   ```json
   POST /land-taxes/assessments/{assessmentId}/resolve-dispute
   {
     "resolution": "ADJUSTED",
     "adjustedTaxAmount": 1100000
   }
   ```

### **Scenario 3: Exemption & Penalty Management**

1. **Apply for tax exemption:**

   ```json
   POST /land-taxes/exemptions
   {
     "assessmentId": "assessment-id",
     "exemptionType": "SENIOR_CITIZEN",
     "exemptionRate": 25
   }
   ```

2. **Apply late payment penalty:**
   ```json
   POST /land-taxes/penalties
   {
     "assessmentId": "assessment-id",
     "penaltyType": "LATE_PAYMENT",
     "penaltyRate": 2
   }
   ```

---

## 📊 **Response Examples**

### **Tax Assessment Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "taxYear": 2024,
  "assessmentType": "ANNUAL",
  "status": "APPROVED",
  "landValue": 25000000,
  "improvementValue": 15000000,
  "totalValue": 40000000,
  "taxRate": 0.05,
  "baseTaxAmount": 2000000,
  "exemptionAmount": 0,
  "discountAmount": 0,
  "penaltyAmount": 0,
  "finalTaxAmount": 2000000,
  "assessmentDate": "2024-01-15T00:00:00.000Z",
  "dueDate": "2024-12-31T00:00:00.000Z",
  "land": {
    "id": "land-id",
    "parcelNumber": "KG-001-2024-001",
    "area": 500.75,
    "location": "Kigali, Gasabo",
    "landUse": "RESIDENTIAL"
  },
  "owner": {
    "id": "owner-id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "assessor": {
    "id": "assessor-id",
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "assessorNotes": "Standard annual assessment based on current market values",
  "payments": [
    {
      "id": "payment-id",
      "amountPaid": 2000000,
      "paymentDate": "2024-06-15T00:00:00.000Z",
      "status": "VERIFIED"
    }
  ],
  "exemptions": [],
  "penalties": [],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-06-16T14:30:00.000Z"
}
```

### **Tax Payment Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "assessment": {
    "id": "assessment-id",
    "taxYear": 2024,
    "finalTaxAmount": 2000000
  },
  "paymentMethod": "BANK_TRANSFER",
  "amountPaid": 2000000,
  "paymentDate": "2024-06-15T00:00:00.000Z",
  "receiptNumber": "REC-2024-LT-001",
  "bankReference": "BK-REF-789456123",
  "status": "VERIFIED",
  "verificationStatus": "VERIFIED",
  "verificationDate": "2024-06-16T00:00:00.000Z",
  "verifiedBy": {
    "id": "officer-id",
    "firstName": "Michael",
    "lastName": "Johnson"
  },
  "paymentNotes": "Full tax payment for 2024",
  "partialPayment": false,
  "remainingBalance": 0,
  "createdAt": "2024-06-15T08:00:00.000Z",
  "updatedAt": "2024-06-16T10:00:00.000Z"
}
```

### **Tax Statistics:**

```json
{
  "currentYear": 2024,
  "totalAssessments": 1250,
  "approvedAssessments": 1180,
  "disputedAssessments": 35,
  "pendingAssessments": 35,
  "totalTaxLevied": 125000000000,
  "totalTaxCollected": 98500000000,
  "collectionRate": 78.8,
  "outstandingTax": 26500000000,
  "totalPayments": 1089,
  "verifiedPayments": 1067,
  "pendingVerification": 22,
  "exemptions": {
    "total": 67,
    "totalExemptionAmount": 3400000000
  },
  "penalties": {
    "total": 143,
    "totalPenaltyAmount": 1250000000
  },
  "paymentMethods": {
    "BANK_TRANSFER": 856,
    "MOBILE_MONEY": 189,
    "CASH": 44
  },
  "complianceRate": 87.2,
  "averageAssessmentValue": 100000000,
  "averagePaymentTime": 156
}
```

---

## 🔐 **Role-Based Access**

| Action               | Citizen       | Tax Officer   | District Admin | Finance Manager |
| -------------------- | ------------- | ------------- | -------------- | --------------- |
| View Own Assessments | ✅            | ✅            | ✅             | ✅              |
| View All Assessments | ❌            | ✅ (District) | ✅ (All)       | ✅ (All)        |
| Create Assessment    | ❌            | ✅            | ✅             | ✅              |
| Approve Assessment   | ❌            | ✅            | ✅             | ✅              |
| Dispute Assessment   | ✅ (Own only) | ❌            | ❌             | ❌              |
| Make Payment         | ✅ (Own only) | ✅            | ✅             | ✅              |
| Verify Payment       | ❌            | ✅            | ✅             | ✅              |
| Apply Exemption      | ✅ (Own only) | ✅            | ✅             | ✅              |
| Approve Exemption    | ❌            | ✅            | ✅             | ✅              |
| Apply Penalty        | ❌            | ✅            | ✅             | ✅              |
| Waive Penalty        | ❌            | ❌            | ✅             | ✅              |
| Generate Reports     | ❌            | ✅            | ✅             | ✅              |

---

## ⚠️ **Common Error Responses**

### **400 - Bad Request:**

```json
{
  "statusCode": 400,
  "message": "Tax assessment for this land and year already exists",
  "error": "Bad Request"
}
```

### **403 - Forbidden:**

```json
{
  "statusCode": 403,
  "message": "Only property owners can dispute their tax assessments",
  "error": "Forbidden"
}
```

### **404 - Not Found:**

```json
{
  "statusCode": 404,
  "message": "Tax assessment not found",
  "error": "Not Found"
}
```

---

## 📝 **Testing Notes**

1. **Prerequisites:** Land must be registered and have a valid owner
2. **Tax Year:** Each land can only have one assessment per tax year
3. **Payment Verification:** All payments must be verified before being marked as complete
4. **Due Dates:** Late payments automatically trigger penalty calculations
5. **Exemptions:** Must provide valid supporting documentation
6. **Disputes:** Can only be raised by property owners within 30 days of assessment

This comprehensive guide covers all aspects of the Land Taxes Module!
