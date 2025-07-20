# Land Transfer & Modification Module - API Testing Guide

## 🔄 Land Transfer & Modification Module

This module handles secure, traceable property ownership changes and boundary updates.

### Base URL

```
http://localhost:3000
```

### Authentication

All endpoints require JWT Bearer token. Get token from login endpoint first.

---

## 📋 **Postman Collection - Land Transfer**

### 1. **Create Land Transfer**

**POST** `/land-transfer`

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
  "transferNumber": "TRF-2024-001",
  "landId": "550e8400-e29b-41d4-a716-446655440000",
  "newOwnerId": "550e8400-e29b-41d4-a716-446655440001",
  "transferValue": 50000000,
  "taxAmount": 2500000,
  "reason": "Sale of property",
  "documents": "[\"contract.pdf\", \"id_copy.pdf\"]"
}
```

### 2. **Get All Transfers (User-based)**

**GET** `/land-transfer`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 3. **Get Transfer by ID**

**GET** `/land-transfer/{transferId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 4. **Update Transfer**

**PATCH** `/land-transfer/{transferId}`

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
  "transferValue": 55000000,
  "reason": "Updated property sale price"
}
```

### 5. **Approve Transfer (Land Officer/Admin only)**

**POST** `/land-transfer/{transferId}/approve`

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
  "approvalNotes": "Transfer approved after verification of all documents"
}
```

### 6. **Reject Transfer (Land Officer/Admin only)**

**POST** `/land-transfer/{transferId}/reject`

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
  "rejectionReason": "Missing required documentation - property evaluation report"
}
```

### 7. **Cancel Transfer (Owner only)**

**POST** `/land-transfer/{transferId}/cancel`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 8. **Get Transfers by Land**

**GET** `/land-transfer/by-land/{landId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 9. **Get Transfers by User (Admin only)**

**GET** `/land-transfer/by-user/{userId}`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 10. **Get Transfer Statistics**

**GET** `/land-transfer/statistics`

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

---

## 🧪 **Test Scenarios**

### **Scenario 1: Complete Transfer Flow (Happy Path)**

1. **Citizen initiates transfer:**

   ```json
   POST /land-transfer
   {
     "transferNumber": "TRF-2024-001",
     "landId": "your-land-id",
     "newOwnerId": "buyer-user-id",
     "transferValue": 50000000,
     "reason": "Property sale"
   }
   ```

2. **Land Officer reviews and approves:**

   ```json
   POST /land-transfer/{id}/approve
   {
     "approvalNotes": "All documents verified and approved"
   }
   ```

3. **Check updated land ownership:**
   ```json
   GET /land-registration/{landId}
   ```

### **Scenario 2: Transfer Rejection**

1. **Initiate transfer (same as above)**

2. **Land Officer rejects:**
   ```json
   POST /land-transfer/{id}/reject
   {
     "rejectionReason": "Property value assessment required"
   }
   ```

### **Scenario 3: Transfer Cancellation**

1. **Initiate transfer**

2. **Owner cancels:**
   ```json
   POST /land-transfer/{id}/cancel
   ```

---

## 🎯 **Expected Transfer Flow**

```
INITIATED → PENDING_APPROVAL → APPROVED → COMPLETED
     ↓              ↓              ↓
CANCELLED      REJECTED       (Land ownership transferred)
```

---

## 🔐 **Role-Based Access**

| Action          | Citizen              | Land Officer  | District Admin | Registrar |
| --------------- | -------------------- | ------------- | -------------- | --------- |
| Create Transfer | ✅ (Own land)        | ✅            | ✅             | ✅        |
| View Transfers  | ✅ (Own only)        | ✅ (District) | ✅ (All)       | ✅ (All)  |
| Update Transfer | ✅ (Own, if pending) | ✅            | ✅             | ✅        |
| Approve/Reject  | ❌                   | ✅            | ✅             | ✅        |
| Cancel          | ✅ (Own only)        | ❌            | ❌             | ❌        |

---

## 📊 **Response Examples**

### **Successful Transfer Creation:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "transferNumber": "TRF-2024-001",
  "transferValue": 50000000,
  "taxAmount": 2500000,
  "status": "initiated",
  "reason": "Property sale",
  "currentOwner": {
    "id": "owner-id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "newOwner": {
    "id": "buyer-id",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com"
  },
  "land": {
    "id": "land-id",
    "parcelNumber": "KG-001-2024-001",
    "area": 500.75
  },
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

### **Transfer Statistics:**

```json
{
  "total": 150,
  "pending": 25,
  "approved": 8,
  "completed": 100,
  "rejected": 12,
  "cancelled": 5
}
```

---

## ⚠️ **Common Error Responses**

### **400 - Bad Request:**

```json
{
  "statusCode": 400,
  "message": "Transfer number already exists",
  "error": "Bad Request"
}
```

### **403 - Forbidden:**

```json
{
  "statusCode": 403,
  "message": "Only the land owner or authorized personnel can initiate transfers",
  "error": "Forbidden"
}
```

### **404 - Not Found:**

```json
{
  "statusCode": 404,
  "message": "Land record not found",
  "error": "Not Found"
}
```

---

## 🔄 **Transfer Status Flow**

1. **INITIATED** - Transfer request created
2. **PENDING_APPROVAL** - Awaiting official approval
3. **APPROVED** - Approved by land officer
4. **COMPLETED** - Land ownership transferred
5. **REJECTED** - Transfer denied
6. **CANCELLED** - Cancelled by owner

---

## 📝 **Testing Notes**

1. **Prerequisites:** You need existing land records and user accounts
2. **Tax Calculation:** Automatically calculated as 5% if not provided
3. **Land Status:** Land must be APPROVED/ACTIVE to be transferable
4. **Self-Transfer:** Cannot transfer land to the same owner
5. **Concurrent Transfers:** Each land can only have one active transfer

This comprehensive testing guide covers all aspects of the Land Transfer & Modification Module!
