# Parent Payment API Documentation

## Base URL
```
/api/parent/payments
```

All endpoints require parent authentication via JWT token in the `Authorization` header.

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all payments for logged-in parent |
| GET | `/:id` | Get payment by ID |
| POST | `/` | Create parent plan payment |
| POST | `/org-service` | Create organization service payment (one-time/installments) |
| POST | `/pay-installment` | Pay a service installment |

---

## 1. Get All Parent Payments

**GET** `/api/parent/payments`

Retrieves all payments (plan payments and organization service payments) for the authenticated parent.

### Request Headers
```json
{
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Payments retrieved successfully",
  "payments": [
    {
      "id": "uuid",
      "parentId": "uuid",
      "planId": "uuid",
      "paymentMethodId": "uuid",
      "amount": 500.00,
      "receiptImage": "/uploads/payments/receipts/image.png",
      "status": "pending",
      "rejectedReason": null,
      "createdAt": "2026-02-08T10:00:00.000Z",
      "updatedAt": "2026-02-08T10:00:00.000Z"
    }
  ],
  "orgServicePayments": [
    {
      "id": "uuid",
      "parentId": "uuid",
      "serviceId": "uuid",
      "studentId": "uuid",
      "paymentMethodId": "uuid",
      "organizationId": "uuid",
      "amount": 1000.00,
      "receiptImage": "/uploads/payments/receipts/image.png",
      "type": "installment",
      "requestedInstallments": 4,
      "status": "completed",
      "rejectedReason": null,
      "createdAt": "2026-02-08T10:00:00.000Z",
      "updatedAt": "2026-02-08T10:00:00.000Z"
    }
  ]
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | User not Logged In |

---

## 2. Get Payment by ID

**GET** `/api/parent/payments/:id`

Retrieves a specific payment by its ID. Only the parent who owns the payment can access it.

### Request Headers
```json
{
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Payment ID |

### Response (200 OK)
```json
{
  "success": true,
  "message": "Payment retrieved successfully",
  "payment": {
    "id": "uuid",
    "parentId": "uuid",
    "planId": "uuid",
    "paymentMethodId": "uuid",
    "amount": 500.00,
    "receiptImage": "/uploads/payments/receipts/image.png",
    "status": "pending",
    "rejectedReason": null,
    "createdAt": "2026-02-08T10:00:00.000Z",
    "updatedAt": "2026-02-08T10:00:00.000Z"
  }
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | User not Logged In |
| 400 | Unauthorized Access to Payment |

---

## 3. Create Parent Plan Payment

**POST** `/api/parent/payments`

Creates a new payment for a parent plan subscription.

### Request Headers
```json
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}
```

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| planId | string (UUID) | Yes | ID of the plan to subscribe to |
| paymentMethodId | string (UUID) | Yes | ID of the payment method |
| amount | number | Yes | Payment amount |
| receiptImage | string (base64) | Yes | Base64 encoded receipt image |

### Example Request
```json
{
  "planId": "550e8400-e29b-41d4-a716-446655440000",
  "paymentMethodId": "660e8400-e29b-41d4-a716-446655440001",
  "amount": 500.00,
  "receiptImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
}
```

### Response (201 Created)
```json
{
  "success": true,
  "message": "Payment created successfully"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | User not Logged In |
| 400 | All fields are required |
| 400 | Plan Not Found |
| 400 | Payment Method Not Found |
| 400 | Failed to process receipt image |

---

## 4. Create Organization Service Payment (One-time or Installment)

**POST** `/api/parent/payments/org-service`

Creates a payment for an organization service. Supports both one-time payments and installment plans.

### Request Headers
```json
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}
```

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ServiceId | string (UUID) | Yes | ID of the organization service |
| paymentMethodId | string (UUID) | Yes | ID of the payment method |
| studentId | string (UUID) | Yes | ID of the student |
| amount | number | Yes | Payment amount (must cover service cost + fees) |
| receiptImage | string (base64) | Yes | Base64 encoded receipt image |
| paymentType | string | Yes | `"onetime"` or `"installment"` |
| numberOfInstallments | number | Conditional | Required if `paymentType` is `"installment"`. Max depends on service settings |

### Payment Calculation Logic

#### One-time Payment
- **Required Amount** = Service Price (or Zone Price if zone pricing enabled)
- **Total Required** = Required Amount + Payment Method Fee (if applicable)

#### Installment Payment
- **Installment Amount** = Service Price ÷ Number of Installments
- **Required Amount (first payment)** = Installment Amount
- **Total Required** = Required Amount + Payment Method Fee (if applicable)

### Example Request - One-time Payment
```json
{
  "ServiceId": "550e8400-e29b-41d4-a716-446655440000",
  "paymentMethodId": "660e8400-e29b-41d4-a716-446655440001",
  "studentId": "770e8400-e29b-41d4-a716-446655440002",
  "amount": 1000.00,
  "receiptImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "paymentType": "onetime"
}
```

### Example Request - Installment Payment
```json
{
  "ServiceId": "550e8400-e29b-41d4-a716-446655440000",
  "paymentMethodId": "660e8400-e29b-41d4-a716-446655440001",
  "studentId": "770e8400-e29b-41d4-a716-446655440002",
  "amount": 250.00,
  "receiptImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "paymentType": "installment",
  "numberOfInstallments": 4
}
```

### Response (201 Created)
```json
{
  "success": true,
  "message": "Payment and Subscription created successfully",
  "transactionId": "880e8400-e29b-41d4-a716-446655440003"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | User not Logged In |
| 400 | ServiceId, paymentMethodId, amount, receiptImage and studentId are required |
| 400 | Payment Method Not Found |
| 400 | Student Not Found |
| 400 | Organization Service Not Found |
| 400 | Zone ID is required for this service |
| 400 | Zone Not Found |
| 400 | Invalid payment type |
| 400 | This service does not support installments |
| 400 | Invalid number of installments. Max allowed: {max} |
| 400 | Amount must be at least {total} (Service: {amount} + Fees: {fees}) |
| 400 | Failed to process receipt image |

---

## 5. Pay Service Installment

**POST** `/api/parent/payments/pay-installment`

Submits a payment for an existing installment. The payment requires admin approval before the installment is marked as paid.

### Request Headers
```json
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}
```

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| installmentId | string (UUID) | Yes | ID of the service installment |
| paymentMethodId | string (UUID) | Yes | ID of the payment method |
| paidAmount | number | Yes | Amount being paid |
| receiptImage | string (base64) | Yes | Base64 encoded receipt image |

### Example Request
```json
{
  "installmentId": "990e8400-e29b-41d4-a716-446655440004",
  "paymentMethodId": "660e8400-e29b-41d4-a716-446655440001",
  "paidAmount": 250.00,
  "receiptImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
}
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Payment submitted for approval"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | User not Logged In |
| 400 | All fields required |
| 400 | Installment already paid |
| 404 | Installment not found |
| 404 | Subscription not found |
| 404 | Service not found |
| 404 | Payment Method not found |

---

## Payment Flow Diagrams

### One-time Payment Flow
```
Parent → POST /org-service (paymentType: "onetime")
       → Payment created (status: pending)
       → Admin reviews payment
       → If approved: Subscription activated, status: completed
       → If rejected: Status: rejected, rejectedReason provided
```

### Installment Payment Flow
```
1. Initial Payment:
   Parent → POST /org-service (paymentType: "installment", numberOfInstallments: 4)
          → Payment created (status: pending)
          → Admin approves → Subscription created + First installment tracked

2. Subsequent Payments:
   Parent → POST /pay-installment
          → Payment submitted for approval (status: pending)
          → Admin approves → Installment updated (paidAmount increased)
          → If fully paid → status: paid
          → If partial → status: pending, dueDate extended
```

---

## Payment Statuses

### Parent Payment Status
| Status | Description |
|--------|-------------|
| `pending` | Payment submitted, awaiting admin review |
| `completed` | Payment approved by admin |
| `rejected` | Payment rejected by admin (see `rejectedReason`) |

### Installment Status
| Status | Description |
|--------|-------------|
| `pending` | Installment not yet fully paid |
| `paid` | Installment fully paid |
| `overdue` | Payment past due date |
| `cancelled` | Installment cancelled |

---

## Data Models

### Parent Payment Org Services
```typescript
{
  id: string;              // UUID
  parentId: string;        // UUID - Reference to parent
  serviceId: string;       // UUID - Reference to organization service
  studentId: string;       // UUID - Reference to student
  paymentMethodId: string; // UUID - Reference to payment method
  organizationId: string;  // UUID - Reference to organization
  amount: number;          // Payment amount
  receiptImage: string;    // URL to uploaded receipt
  type: "onetime" | "installment";
  requestedInstallments: number; // Number of installments (0 for one-time)
  status: "pending" | "completed" | "rejected";
  rejectedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Service Payment Installments
```typescript
{
  id: string;              // UUID
  subscriptionId: string;  // UUID - Reference to subscription
  serviceId: string;       // UUID - Reference to service
  dueDate: Date;           // Payment due date
  amount: number;          // Base amount for installment
  status: "pending" | "paid" | "overdue" | "cancelled";
  paidAmount: number;      // Amount already paid
  fineAmount: number;      // Late payment fine
  discountAmount: number;  // Early payment discount
  transactionId: string;   // UUID - Reference to original payment
  createdAt: Date;
  updatedAt: Date;
}
```

### Parent Payment Installments
```typescript
{
  id: string;              // UUID
  installmentId: string;   // UUID - Reference to service installment
  paymentMethodId: string; // UUID - Reference to payment method
  parentId: string;        // UUID - Reference to parent
  receiptImage: string;    // URL to uploaded receipt
  paidAmount: number;      // Amount being paid
  status: "pending" | "completed" | "rejected";
  rejectedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```
