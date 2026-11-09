# BalanceVault — Money Movement with a Ledger You Can Prove
### Snovasys Fresher Hiring Challenge 2026

[![Node.js](https://img.shields.io/badge/Node.js-v24.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-v18.3-61dafb.svg)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2d3748.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-17%20Passed-brightgreen.svg)]()

---

## 1. Project Overview

**BalanceVault** is a secure, auditable account management and financial ledger platform built for the **Snovasys Fresher Hiring Challenge 2026**.

The application demonstrates that financial account operations can be strictly controlled, traceable, and protected against unauthorized access, privilege escalation, and historical tampering.

### Core Objectives
1. **Secure Onboarding**: Multi-stage identity verification workflow (`REGISTERED` &rarr; `PENDING_REVIEW` &rarr; `APPROVED`/`REJECTED`).
2. **Centralized RBAC**: Strict separation of duties across `SUPER_ADMIN`, `ADMIN`, and `ACCOUNT_HOLDER`.
3. **First-Administrator Bootstrap**: Controlled, single-execution bootstrap mechanism protected by a high-entropy secret.
4. **Append-Only Audit Trail**: Tamper-resistant historical audit logging enforced via PostgreSQL least-privilege roles and metadata secret sanitization.
5. **Double-Entry Financial Integrity**: Balanced ledger movements (`DEBIT` = `CREDIT`) with idempotency key deduplication and zero-floor overdraft prevention.
6. **Resilient Rate Limiting**: Redis-backed sliding-window rate limiting with automatic in-memory fail-secure fallback.
7. **System Observability**: Distinct shallow liveness (`/health`) and deep dependency readiness (`/ready`) probes.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS with custom fintech design tokens
- **Routing**: React Router v6 with `ProtectedRoute` role guards
- **Form State & Validation**: React Hook Form with Zod resolvers
- **Icons**: Lucide React
- **HTTP Client**: Axios with JWT Bearer interceptors

### Backend
- **Runtime**: Node.js v24 with TypeScript & Express
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Cache & Rate Limiting**: Redis with ioredis and resilient in-memory sliding window fallback
- **Authentication**: RFC 7519 JWT and bcrypt (12 rounds)
- **Validation**: Strict Zod schemas with `.strict()` parsing
- **Security Headers**: Helmet & strict Origin CORS
- **Testing**: Vitest & Supertest (17 automated tests)

---

## 3. Architecture & Subsystems

```mermaid
flowchart TD
    Client[React 18 SPA] --> Proxy[Reverse Proxy / TLS]
    Proxy --> Security[Helmet & CORS & RateLimiter]
    Security --> Auth[JWT Auth & RBAC Guard]
    Auth --> Service[Onboarding & Account Services]
    Service --> Postgres[(PostgreSQL Database)]
    Service --> Redis[(Redis In-Memory Store)]
    Service --> Audit[Append-Only Audit Logger]
```

Detailed architectural blueprints are documented in:
- [Architecture Specification](docs/ARCHITECTURE.md)
- [Database Design & Roles](docs/DATABASE_DESIGN.md)
- [Security Specification](docs/SECURITY.md)
- [Threat Model (THREATS.md)](THREATS.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Testing Report](docs/TESTING.md)

---

## 4. User Roles & Access Control

| Role | Permissions & Responsibilities |
| :--- | :--- |
| **SUPER_ADMIN** | Full administrative oversight, user status modification, staff role assignment, audit log inspection, system metrics. |
| **ADMIN** | Onboarding application review (approval/rejection with mandatory justification), account status management, audit inspection. Cannot alter user roles or approve their own KYC. |
| **ACCOUNT_HOLDER** | Public registration, KYC profile submission, review status tracking, account balance viewing, executing idempotent double-entry transfers. |

---

## 5. First-Administrator Bootstrap

To guarantee security:
- Public administrator registration is strictly prohibited.
- The system provides a controlled CLI bootstrap utility:
  ```bash
  npm run bootstrap:admin --prefix backend
  ```
- **Security Invariant**: The bootstrap verifies that **no administrator exists** anywhere in the database. If an administrator is already present or if the `BOOTSTRAP_SECRET` is invalid, the process immediately aborts and logs an audit failure.

---

## 6. Installation & Local Setup

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- PostgreSQL instance (or cloud connection via Neon/Supabase/Railway)
- Redis instance (optional: automatic in-memory fallback will activate if offline)

### Step 1: Clone and Configure Environment
```bash
git clone <repository_url>
cd Snovasys
cp .env.example backend/.env
```

Review `backend/.env` and update `DATABASE_URL` with your PostgreSQL credentials:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/balancevault?schema=public
BOOTSTRAP_SECRET=balancevault_super_secret_bootstrap_key_32_bytes!
```

### Step 2: Install Dependencies
```bash
# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd ../frontend && npm install
```

### Step 3: Run Database Migrations
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### Step 4: Bootstrap Initial Super Administrator
```bash
cd backend
ADMIN_BOOTSTRAP_EMAIL=superadmin@balancevault.com \
ADMIN_BOOTSTRAP_PASSWORD=VaultAdmin@2026! \
BOOTSTRAP_SECRET=balancevault_super_secret_bootstrap_key_32_bytes! \
npm run bootstrap:admin
```

### Step 5: Start Development Servers
```bash
# Terminal 1: Backend API (Port 5000)
cd backend && npm run dev

# Terminal 2: Frontend SPA (Port 5173)
cd frontend && npm run dev
```

Open your browser to: `http://localhost:5173`

---

## 7. Automated Test Suite

Run the full suite of 17 automated security and integration tests:
```bash
cd backend
npm test
```

### Test Coverage Highlights
- First-admin bootstrap security, invalid secrets, and duplicate execution guards.
- Public registration role hardcoding to `ACCOUNT_HOLDER`.
- Centralized RBAC denying customer access to administrative endpoints (HTTP 403).
- Prohibition of administrator KYC self-approval (HTTP 403).
- Financial transfer idempotency: replayed idempotency keys return existing transactions without duplicate deductions.
- Overdraft protection: transfers exceeding balances fail with HTTP 400.
- Rate limiting: sliding window throttling blocks excessive attempts with HTTP 429.
- Health and deep readiness checks checking PostgreSQL connectivity.

---

## 8. Requirements Traceability

Every requirement from both the updated BalanceVault specification and the original LedgerLine financial integrity rubric is indexed in [REQUIREMENTS_TRACEABILITY.md](REQUIREMENTS_TRACEABILITY.md).

---

## 9. AI Development Audit Log

As mandated by official instructions, all AI interactions, investigated risks, architectural corrections, and genuine commit hashes are documented in [PROMPTS.md](PROMPTS.md) with five dated entries covering least-privilege DB roles, bootstrap protection, audit log secret redaction, centralized RBAC, and rate-limiting resilience.

---

## 10. License & Submission Details

- **Author**: Koteswararao S (`srkotesh03@gmail.com`)
- **Event**: Snovasys Fresher Hiring Challenge 2026
- **Challenge Period**: 6 November 2026 – 12 November 2026
- **License**: UNLICENSED (Candidate Assessment Submission)
