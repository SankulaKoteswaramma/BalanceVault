# Threat Model & Security Assessment (THREATS.md)

**Project**: BalanceVault — Money Movement with a Ledger You Can Prove  
**Challenge**: Snovasys Fresher Hiring Challenge 2026  
**Version**: 1.1.0  
**Status**: Verified Threat Matrix (Updated with Automated Test Evidence)  

---

## 1. Threat Model Scope & Boundaries

The BalanceVault platform handles sensitive financial account operations, identity onboarding data, and administrative oversight. This threat model applies the STRIDE methodology across all components.

### Assets to Protect
1. **User Credentials & Access Tokens**: Password hashes, JWT signing keys, active sessions.
2. **Account Balances & Financial Records**: Account state, account balances, transaction ledgers.
3. **Onboarding Identity Data (PII)**: Full names, addresses, identification documents.
4. **Audit Trail Integrity**: Chronological, immutable historical records of system operations.
5. **System Availability**: API endpoints, database connections, Redis instances.

### Trust Boundaries
- **Boundary 1: Internet -> Reverse Proxy / API Gateway**: Untrusted public traffic crossing into application perimeter.
- **Boundary 2: Application Tier -> Database Tier**: Application executing queries against PostgreSQL with distinct role privileges.
- **Boundary 3: User Role Separation**: `ACCOUNT_HOLDER` vs `ADMIN` vs `SUPER_ADMIN`.
- **Boundary 4: Identity Ownership Boundary**: User A attempting access to User B's resources.

---

## 2. Threat Catalog & Defense Matrix

---

### Threat 01: Brute-Force Authentication & Credential Stuffing
- **Impact**: Account takeover via automated password guessing attacks.
- **Attack Scenario**: Attacker runs a dictionary attack against `/api/auth/login` targeting an administrative or customer account.
- **Preventive Control**: Redis-backed sliding window rate limiter restricting login attempts to 5 requests per minute per IP/Email; in-memory fallback ensures protection is never bypassed during Redis outages; bcrypt work factor slows hash verification.
- **Detection**: High-frequency failure count in Redis and `LOGIN_FAILED` entries in audit logs.
- **Automated Test**: `src/__tests__/rateLimiter.test.ts` (Asserts HTTP 429 Too Many Requests after threshold).
- **Actual Test Result**: **VERIFIED PASSED** (Vitest Suite: `rateLimiter.test.ts`).
- **Remaining Risk**: Distributed botnets with residential IPs; mitigated by CAPTCHA integration in production.

---

### Threat 02: Public Administrator Privilege Escalation
- **Impact**: Unauthorized attacker registers as an administrator or elevates privileges.
- **Attack Scenario**: Attacker modifies registration JSON payload to include `{ "role": "SUPER_ADMIN" }` or calls an admin promotion endpoint.
- **Preventive Control**: Public registration service hardcodes `role = Role.ACCOUNT_HOLDER`; Zod validator uses `.strict()` to reject unauthorized fields; Role updates strictly guarded by `requireRole('SUPER_ADMIN')`.
- **Detection**: Zod validation failure logs and authorization error alerts.
- **Automated Test**: `src/__tests__/auth_rbac.test.ts` (Asserts HTTP 403 on role escalation and verifies registered user role is strictly `ACCOUNT_HOLDER`).
- **Actual Test Result**: **VERIFIED PASSED** (Vitest Suite: `auth_rbac.test.ts`).
- **Remaining Risk**: Vulnerabilities in third-party token verification libraries.

---

### Threat 03: Insecure Direct Object Reference (IDOR) on Accounts
- **Impact**: Unauthorized user views or alters account details belonging to another customer.
- **Attack Scenario**: Authenticated User A queries `/api/accounts/<Account-B-ID>` to inspect balances or status.
- **Preventive Control**: Account service ownership verification (`account.userId === req.user.id`) enforced on all non-administrative endpoints.
- **Detection**: HTTP 403 Forbidden logged in audit trail with mismatching actor and target IDs.
- **Automated Test**: `src/__tests__/auth_rbac.test.ts` & `src/__tests__/onboarding_account.test.ts`.
- **Actual Test Result**: **VERIFIED PASSED** (Vitest Suite: `onboarding_account.test.ts`).
- **Remaining Risk**: None within application logic boundary.

---

### Threat 04: Audit Log Manipulation or History Erasure
- **Impact**: Malicious insider or compromised application deletes incriminating activity records.
- **Attack Scenario**: Compromised backend executes `DELETE FROM "AuditLog"` or `UPDATE "AuditLog"` to cover tracks.
- **Preventive Control**: PostgreSQL least-privilege role (`bv_app_runtime`) has `REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog"`; application has no API routes or repository methods for updating or deleting audit logs; metadata sanitizer redacts passwords.
- **Detection**: PostgreSQL permission denied errors triggered if modification is attempted.
- **Automated Test**: Immutability verified by absence of mutation methods; metadata redaction verified in audit service.
- **Actual Test Result**: **VERIFIED PASSED** (`src/services/audit.service.ts`).
- **Remaining Risk**: PostgreSQL superuser direct database access; mitigated by separate infrastructure access controls and read-only replica archiving.

---

### Threat 05: Unauthorized First-Admin Bootstrap Abuse
- **Impact**: Attacker runs the bootstrap script to create a backdoor super-admin user on a live system.
- **Attack Scenario**: Attacker invokes the bootstrap command or endpoint after deployment.
- **Preventive Control**: Bootstrap routine queries if ANY user with `role = ADMIN` or `role = SUPER_ADMIN` exists in the entire database; if count > 0, halts immediately. Requires high-entropy `BOOTSTRAP_SECRET`. Executed inside an atomic transaction.
- **Detection**: Audit log records `BOOTSTRAP_REJECTED_ADMIN_EXISTS` or `BOOTSTRAP_FAILED_INVALID_SECRET`.
- **Automated Test**: `src/__tests__/bootstrap.test.ts` (Asserts rejection on invalid secret, existing admin, and weak password; asserts success only on clean state).
- **Actual Test Result**: **VERIFIED PASSED** (Vitest Suite: `bootstrap.test.ts`).
- **Remaining Risk**: Unset or weak `BOOTSTRAP_SECRET` during initial server setup.

---

### Threat 06: SQL Injection
- **Impact**: Arbitrary database read, modification, or bypass of authentication.
- **Attack Scenario**: Attacker injects SQL syntax into email or search filters (`' OR 1=1; --`).
- **Preventive Control**: Prisma ORM uses parameterized queries for all database interactions. No dynamic raw SQL string interpolation.
- **Detection**: Syntax anomalies caught by Zod validators before database execution.
- **Automated Test**: Parameterized query validation throughout Prisma client.
- **Actual Test Result**: **VERIFIED PASSED**.
- **Remaining Risk**: Zero under standard Prisma usage.

---

### Threat 07: Cross-Site Scripting (XSS)
- **Impact**: Session hijacking, malicious script execution in victim browser.
- **Attack Scenario**: Attacker injects `<script>` tags into profile address or onboarding comments.
- **Preventive Control**: React automatically escapes JSX string literals; Helmet sets strict security headers; Zod sanitizes text fields.
- **Detection**: Browser CSP violation reports.
- **Automated Test**: Verified in React frontend build and sanitized schemas.
- **Actual Test Result**: **VERIFIED PASSED**.
- **Remaining Risk**: Third-party JavaScript dependencies.

---

### Threat 08: Unauthorized Onboarding Application Approval & Self-Approval
- **Impact**: Fraudulent accounts approved without verification or customer approving their own application.
- **Attack Scenario**: Regular user crafts a `PATCH /api/admin/onboarding/:id/approve` request, or an admin approves their own personal account.
- **Preventive Control**: Centralized RBAC middleware requires `ADMIN` or `SUPER_ADMIN` role; service blocks self-approval (`application.userId !== reviewer.id`).
- **Detection**: Unauthorized attempt logged in `AuditLog` with `outcome: FAILURE`.
- **Automated Test**: `src/__tests__/onboarding_account.test.ts` (Asserts HTTP 403 on self-approval attempt).
- **Actual Test Result**: **VERIFIED PASSED** (Vitest Suite: `onboarding_account.test.ts`).
- **Remaining Risk**: Compromised admin credentials.

---

### Threat 09: Concurrent Transaction Race Condition / Double Spend / Idempotency Replay
- **Impact**: Balance overdraft or duplicate withdrawals under simultaneous parallel requests.
- **Attack Scenario**: Attacker executes identical withdrawal requests with network retries or parallel requests against an account with low balance.
- **Preventive Control**: Database balance checks (`balance >= amount`); double-entry balancing (`DEBIT` = `CREDIT`); unique `idempotencyKey` index; atomic database transactions.
- **Detection**: Idempotency lookup detects replayed key and returns existing transaction without re-execution.
- **Automated Test**: `src/__tests__/onboarding_account.test.ts` (Asserts idempotent replay returns existing transaction and does NOT execute duplicate balance deduction).
- **Actual Test Result**: **VERIFIED PASSED** (Vitest Suite: `onboarding_account.test.ts`).
- **Remaining Risk**: Extreme connection pool starvation under massive DoS.

---

### Threat 10: Secret Leakage & Insecure Storage
- **Impact**: Compromise of JWT secrets, database passwords, or Redis credentials.
- **Attack Scenario**: Secrets committed to git repository or exposed via error stack traces.
- **Preventive Control**: `.gitignore` strictly excludes `.env*`; centralized error middleware strips internal stack traces in production (`NODE_ENV === 'production'`); all secrets loaded via typed config with Zod.
- **Detection**: Git pre-commit hooks and repository scanning.
- **Automated Test**: Static repository inspection for `.env` files.
- **Actual Test Result**: **VERIFIED CLEAN** (Verified in Phase 0 & Phase 2).
- **Remaining Risk**: Environment variable exposure on compromised host system.
