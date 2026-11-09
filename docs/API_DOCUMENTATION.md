# REST API Specification — BalanceVault

**Project**: BalanceVault — Money Movement with a Ledger You Can Prove  
**Challenge**: Snovasys Fresher Hiring Challenge 2026  
**Version**: 1.0.0  

All responses follow the standard JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional descriptive status message",
  "correlationId": "uuid-v4"
}
```
Error responses return:
```json
{
  "success": false,
  "error": "Error description",
  "details": [ ... ],
  "correlationId": "uuid-v4"
}
```

---

## 1. System Endpoints

### 1.1 Liveness Probe
- **Endpoint**: `GET /health`
- **Auth**: None (Public)
- **Response**: `200 OK`
```json
{
  "status": "UP",
  "uptime": 128.45,
  "timestamp": "2026-11-09T20:00:00.000Z",
  "service": "BalanceVault-API"
}
```

### 1.2 Deep Readiness Probe
- **Endpoint**: `GET /ready`
- **Auth**: None (Public)
- **Response**: `200 OK` (when dependencies healthy) or `503 Service Unavailable` (when DB down)
```json
{
  "status": "UP",
  "timestamp": "2026-11-09T20:00:00.000Z",
  "dependencies": {
    "process": { "status": "UP" },
    "database": { "status": "UP", "latencyMs": 4 },
    "redis": { "status": "UP" }
  }
}
```

---

## 2. Authentication Endpoints (`/api/auth`)

### 2.1 User Registration
- **Endpoint**: `POST /api/auth/register`
- **Auth**: None (Public, Rate Limited: 5/min)
- **Request Body**:
```json
{
  "fullName": "Alice Walker",
  "email": "alice@example.com",
  "phoneNumber": "+15551112233",
  "password": "SecurePassword123!",
  "passwordConfirmation": "SecurePassword123!"
}
```
- **Response**: `201 Created`
  - Creates user with role `ACCOUNT_HOLDER` and onboarding state `REGISTERED`.

### 2.2 User Login
- **Endpoint**: `POST /api/auth/login`
- **Auth**: None (Public, Rate Limited: 5/min)
- **Request Body**:
```json
{
  "email": "alice@example.com",
  "password": "SecurePassword123!"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "uuid",
      "email": "alice@example.com",
      "role": "ACCOUNT_HOLDER",
      "status": "PENDING",
      "onboardingStatus": "REGISTERED"
    }
  }
}
```

### 2.3 Current Session User
- **Endpoint**: `GET /api/auth/me`
- **Auth**: `Bearer <token>` (Any authenticated user)

### 2.4 Logout
- **Endpoint**: `POST /api/auth/logout`
- **Auth**: `Bearer <token>`
- **Audit**: Emits `LOGOUT`

---

## 3. Onboarding Endpoints (`/api/onboarding`)

### 3.1 Submit KYC Documentation
- **Endpoint**: `POST /api/onboarding/submit`
- **Auth**: `Bearer <token>` (`ACCOUNT_HOLDER`)
- **Request Body**:
```json
{
  "fullName": "Alice Walker",
  "dateOfBirth": "1994-06-15",
  "address": "456 Market St, San Francisco, CA",
  "nationalIdNumber": "123-45-6789",
  "employmentStatus": "EMPLOYED",
  "annualIncome": "$75,000 - $150,000",
  "sourceOfFunds": "Salary"
}
```
- **State Transition**: Sets onboarding status to `PENDING_REVIEW`.

### 3.2 Get My Onboarding Status
- **Endpoint**: `GET /api/onboarding/me`
- **Auth**: `Bearer <token>` (`ACCOUNT_HOLDER`)

### 3.3 List Applications (Admin Queue)
- **Endpoint**: `GET /api/onboarding/admin/applications?status=PENDING_REVIEW`
- **Auth**: `ADMIN` or `SUPER_ADMIN`

### 3.4 Review Application (Approve / Reject)
- **Endpoint**: `PATCH /api/onboarding/admin/applications/:id/review`
- **Auth**: `ADMIN` or `SUPER_ADMIN` (Self-approval blocked)
- **Request Body**:
```json
{
  "decision": "APPROVE",
  "notes": "Verified national identity documents and residential address."
}
```
- **Side Effect on Approval**:
  - Sets application status to `APPROVED`.
  - Sets user status to `ACTIVE`.
  - Provisions primary checking account with unique account number (`BV-XXXX-XXXX`).

---

## 4. Accounts & Ledger Endpoints (`/api/accounts`)

### 4.1 My Accounts
- **Endpoint**: `GET /api/accounts/my`
- **Auth**: `Bearer <token>` (`ACCOUNT_HOLDER`)

### 4.2 Account Details (IDOR Protected)
- **Endpoint**: `GET /api/accounts/:id`
- **Auth**: `Bearer <token>` (Owner or Admin)

### 4.3 Move Money / Transfer Funds
- **Endpoint**: `POST /api/accounts/transfer`
- **Auth**: `Bearer <token>` (Must own source account)
- **Request Body**:
```json
{
  "sourceAccountId": "uuid",
  "destinationAccountId": "uuid",
  "amount": 150.00,
  "description": "Invoice Settlement",
  "idempotencyKey": "idem_1731174000_abc123"
}
```
- **Guarantees**:
  - Idempotent: Replaying the same key returns the existing transaction without double deduction.
  - Double-entry: Creates matching `DEBIT` and `CREDIT` ledger records.
  - Overdraft prevention: Fails with `400 Bad Request` if `source.balance < amount`.

### 4.4 Admin List Accounts
- **Endpoint**: `GET /api/accounts/admin/all?status=ACTIVE&search=BV-`
- **Auth**: `ADMIN` or `SUPER_ADMIN`

### 4.5 Admin Update Account Status
- **Endpoint**: `PATCH /api/accounts/admin/:id/status`
- **Auth**: `ADMIN` or `SUPER_ADMIN`
- **Request Body**:
```json
{
  "status": "SUSPENDED",
  "reason": "Suspicious transfer pattern under AML review"
}
```

---

## 5. Administration Endpoints (`/api/admin`)

### 5.1 System Metrics
- **Endpoint**: `GET /api/admin/metrics`
- **Auth**: `ADMIN` or `SUPER_ADMIN`

### 5.2 User Directory
- **Endpoint**: `GET /api/admin/users?role=ACCOUNT_HOLDER&status=ACTIVE`
- **Auth**: `ADMIN` or `SUPER_ADMIN`

### 5.3 User Status Toggle
- **Endpoint**: `PATCH /api/admin/users/:id/status`
- **Auth**: `ADMIN` or `SUPER_ADMIN`

### 5.4 User Role Modification
- **Endpoint**: `PATCH /api/admin/users/:id/role`
- **Auth**: `SUPER_ADMIN` ONLY (Privilege Escalation Protection)

### 5.5 Audit Log Inspector
- **Endpoint**: `GET /api/admin/audit-logs?action=LOGIN&targetEntity=User`
- **Auth**: `ADMIN` or `SUPER_ADMIN`
- **Properties**: Returns append-only events with actor, action, timestamp, sanitized metadata.
