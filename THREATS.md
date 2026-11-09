# Threat Model & Security Assessment (THREATS.md)

**Project**: BalanceVault — Money Movement with a Ledger You Can Prove  
**Challenge**: Snovasys Fresher Hiring Challenge 2026  
**Version**: 1.0.0  
**Status**: Living Threat Matrix (Updated through Development)  

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
- **Preventive Control**: Redis-backed sliding window rate limiter restricting login attempts to 5 requests per minute per IP/Email; Argon2id/bcrypt work factor slows hash verification.
- **Detection**: High-frequency failure count in Redis and `LOGIN_FAILED` entries in audit logs.
- **Automated Test**: `tests/security/rateLimit.test.ts` (Asserts HTTP 429 Too Many Requests after 5 attempts).
- **Actual Test Result**: Planned for Phase 14 & 15.
- **Remaining Risk**: Distributed botnets with residential IPs; mitigated by CAPTCHA integration in production.

---

### Threat 02: Public Administrator Privilege Escalation
- **Impact**: Unauthorized attacker registers as an administrator or elevates privileges.
- **Attack Scenario**: Attacker modifies registration JSON payload to include `{ "role": "SUPER_ADMIN" }` or calls an admin promotion endpoint.
- **Preventive Control**: Public registration service hardcodes `role = Role.ACCOUNT_HOLDER`; Zod validator uses `.strict()` to reject unauthorized fields; Role updates strictly guarded by `requireRole('SUPER_ADMIN')`.
- **Detection**: Zod validation failure logs and authorization error alerts.
- **Automated Test**: `tests/security/privilegeEscalation.test.ts`.
- **Actual Test Result**: Planned for Phase 14 & 15.
- **Remaining Risk**: Vulnerabilities in third-party token verification libraries.

---

### Threat 03: Insecure Direct Object Reference (IDOR) on Accounts
- **Impact**: Unauthorized user views or alters account details belonging to another customer.
- **Attack Scenario**: Authenticated User A queries `/api/accounts/<Account-B-ID>` to inspect balances or status.
- **Preventive Control**: Account service ownership verification (`account.userId === req.user.id`) enforced on all non-administrative endpoints.
- **Detection**: HTTP 403 Forbidden logged in audit trail with mismatching actor and target IDs.
- **Automated Test**: `tests/security/idor.test.ts`.
- **Actual Test Result**: Planned for Phase 14 & 15.
- **Remaining Risk**: None within application logic boundary.

---

### Threat 04: Audit Log Manipulation or History Erasure
- **Impact**: Malicious insider or compromised application deletes incriminating activity records.
- **Attack Scenario**: Compromised backend executes `DELETE FROM "AuditLog"` or `UPDATE "AuditLog"` to cover tracks.
- **Preventive Control**: PostgreSQL least-privilege role (`bv_app_runtime`) has `REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog"`; application has no API routes or repository methods for updating or deleting audit logs.
- **Detection**: PostgreSQL permission denied errors triggered if modification is attempted.
- **Automated Test**: `tests/security/auditTamper.test.ts`.
- **Actual Test Result**: Planned for Phase 14 & 15.
- **Remaining Risk**: PostgreSQL superuser direct database access; mitigated by separate infrastructure access controls and read-only replica archiving.

---

### Threat 05: Unauthorized First-Admin Bootstrap Abuse
- **Impact**: Attacker runs the bootstrap script to create a backdoor super-admin user on a live system.
- **Attack Scenario**: Attacker invokes the bootstrap command or endpoint after deployment.
- **Preventive Control**: Bootstrap routine explicitly queries if any user with `role = ADMIN` or `role = SUPER_ADMIN` exists; if count > 0, halts immediately. Requires high-entropy `BOOTSTRAP_SECRET`. Executed inside an atomic transaction.
- **Detection**: Audit log records `BOOTSTRAP_ATTEMPT_DENIED`.
- **Automated Test**: `tests/security/bootstrap.test.ts`.
- **Actual Test Result**: Planned for Phase 14 & 15.
- **Remaining Risk**: Unset or weak `BOOTSTRAP_SECRET` during initial server setup.

---

### Threat 06: SQL Injection
- **Impact**: Arbitrary database read, modification, or bypass of authentication.
- **Attack Scenario**: Attacker injects SQL syntax into email or search filters (`' OR 1=1; --`).
- **Preventive Control**: Prisma ORM uses parameterized queries for all database interactions. No dynamic raw SQL string interpolation.
- **Detection**: Syntax anomalies caught by Zod validators before database execution.
- **Automated Test**: `tests/security/sqlInjection.test.ts`.
- **Actual Test Result**: Planned for Phase 14 & 15.
- **Remaining Risk**: Zero under standard Prisma usage.

---

### Threat 07: Cross-Site Scripting (XSS)
- **Impact**: Session hijacking, malicious script execution in victim browser.
- **Attack Scenario**: Attacker injects `<script>` tags into profile address or onboarding comments.
- **Preventive Control**: React automatically escapes JSX string literals; Helmet sets strict `Content-Security-Policy`; Zod sanitizes text fields.
- **Detection**: Browser CSP violation reports.
- **Automated Test**: React frontend component tests with XSS payloads.
- **Actual Test Result**: Planned for Phase 14 & 15.
- **Remaining Risk**: Third-party JavaScript dependencies.

---

### Threat 08: Unauthorized Onboarding Application Approval
- **Impact**: Fraudulent accounts approved without verification or customer approving their own application.
- **Attack Scenario**: Regular user crafts a `PATCH /api/admin/onboarding/:id/approve` request.
- **Preventive Control**: Centralized RBAC middleware requires `ADMIN` or `SUPER_ADMIN` role; service blocks self-approval (`application.userId !== reviewer.id`).
- **Detection**: Unauthorized attempt logged in `AuditLog` with `outcome: FAILURE`.
- **Automated Test**: `tests/security/onboardingAuth.test.ts`.
- **Actual Test Result**: Planned for Phase 14 & 15.
- **Remaining Risk**: Compromised admin credentials.

---

### Threat 09: Concurrent Transaction Race Condition / Double Spend
- **Impact**: Balance overdraft or duplicate withdrawals under simultaneous parallel requests.
- **Attack Scenario**: Attacker executes 10 concurrent withdrawal requests against an account with $100 balance.
- **Preventive Control**: Database check constraint `balance >= 0.00`; row-level locking (`SELECT ... FOR UPDATE`) in PostgreSQL transaction isolation; atomic balance updates.
- **Detection**: Check constraint violation (PostgreSQL Error 23514) and transaction rollback.
- **Automated Test**: `tests/concurrency/concurrency.test.ts`.
- **Actual Test Result**: Planned for Phase 14 & 15.
- **Remaining Risk**: Extreme connection pool starvation under massive DoS.

---

### Threat 10: Secret Leakage & Insecure Storage
- **Impact**: Compromise of JWT secrets, database passwords, or Redis credentials.
- **Attack Scenario**: Secrets committed to git repository or exposed via error stack traces.
- **Preventive Control**: `.gitignore` strictly excludes `.env*`; centralized error middleware strips internal stack traces in production (`NODE_ENV === 'production'`); all secrets loaded via typed config with Zod.
- **Detection**: Git pre-commit hooks and repository scanning.
- **Automated Test**: Static repository inspection for `.env` files.
- **Actual Test Result**: Verified clean in Phase 0.
- **Remaining Risk**: Environment variable exposure on compromised host system.
