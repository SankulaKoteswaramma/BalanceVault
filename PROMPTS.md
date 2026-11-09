# AI Interaction & Development Audit Log (PROMPTS.md)

**Project**: BalanceVault — Money Movement with a Ledger You Can Prove  
**Challenge**: Snovasys Fresher Hiring Challenge 2026  
**Document Purpose**: Genuine record of AI interactions, risk analyses, corrections, architectural decisions, and testing verification as required by official submission guidelines.

---

### Entry 1: Architecture, Least Privilege DB Roles & First-Admin Bootstrap Design

- **Date**: 2026-11-09
- **AI Tool Used**: Gemini 3.8 Flash (Antigravity Senior Architecture Agent)
- **Exact Task or Prompt**:
  > "Perform repository inspection, analyze requirements between the updated BalanceVault specification and original LedgerLine requirements, and design the initial architecture, database schema, security threat model, and bootstrap procedure."
- **AI-Generated Suggestion**:
  Initial boilerplate suggestions recommended using a default PostgreSQL superuser (`postgres:postgres`) connection for all backend queries, implementing a standard `/api/auth/register-admin` public route with an admin registration key in the query string, and managing audit logs in a standard table with auto-generated Prisma CRUD operations (`update`, `delete`).
- **What Was Incorrect, Incomplete, or Risky**:
  1. *Database Security Flaw*: Using a single superuser role violates the Principle of Least Privilege. If the application runtime is compromised via an RCE or injection, the attacker can truncate all tables including audit logs.
  2. *Admin Bootstrap Flaw*: A public endpoint accepting an admin registration key is vulnerable to timing attacks, brute forcing, and replay attacks. Furthermore, once an admin exists, such an endpoint remains an unnecessary attack surface.
  3. *Audit Log Integrity Flaw*: Allowing Prisma or backend services to update or delete audit logs contradicts the immutable append-only compliance requirement.
- **How I Investigated the Issue**:
  Reviewed PostgreSQL role privilege documentation (`GRANT`/`REVOKE`), investigated the Snovasys Fresher Hiring Challenge security rubric, and analyzed the requirements in Section 8 (First Administrator Bootstrap) and Section 12 (Audit Logging).
- **What I Changed or Decided**:
  1. Designed separate PostgreSQL roles (`bv_migration_owner`, `bv_app_runtime`, `bv_readonly_auditor`, `bv_bootstrap_operator`). Explicitly configured `REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog" FROM bv_app_runtime`.
  2. Designed the First-Admin Bootstrap as an atomic CLI / secure execution mechanism that queries the database, ensures total admin count is 0, validates a high-entropy `BOOTSTRAP_SECRET`, creates the initial `SUPER_ADMIN`, logs the event to `AuditLog`, and locks the mechanism against re-execution.
  3. Structured `REQUIREMENTS_TRACEABILITY.md` to reconcile updated BalanceVault specifications with extensible LedgerLine double-entry capabilities.
- **How I Tested It**:
  1. Inspected workspace state (`Get-ChildItem -Force`).
  2. Verified greenfield environment and absence of secret leaks.
  3. Validated architectural documentation in `docs/ARCHITECTURE.md`, `docs/DATABASE_DESIGN.md`, and `docs/SECURITY.md`.
- **Git Commit Reference**:
  `16bfdf4` — *feat: phase 1 & 2 - baseline architecture, threat model, and project scaffold*

---

### Entry 2: First-Administrator Bootstrap Security and Re-Execution Prevention

- **Date**: 2026-11-09
- **AI Tool Used**: Gemini 3.8 Flash (Antigravity Security & Backend Agent)
- **Exact Task or Prompt**:
  > "Implement the first-administrator bootstrap service, CLI script, and automated tests following Section 8 requirements."
- **AI-Generated Suggestion**:
  Initial implementation suggested checking if an admin user with the specific requested email existed. If not, create the user with role `ADMIN`.
- **What Was Incorrect, Incomplete, or Risky**:
  Checking only for the specific email address would allow an attacker to run the bootstrap multiple times with different email addresses, generating arbitrary administrative accounts and completely breaking the "first admin bootstrap runs once only" security invariant.
- **How I Investigated the Issue**:
  Reviewed Section 8 requirement #3 ("Verify that no administrator exists before creating the initial administrator") and requirement #6 ("Ensure repeated execution cannot create duplicate initial administrators").
- **What I Changed or Decided**:
  Updated `BootstrapService.bootstrapFirstAdmin` to perform an atomic query across the entire `User` table for `role: { in: [Role.ADMIN, Role.SUPER_ADMIN] }`. If ANY administrator exists in the entire database, the process aborts immediately, logs `BOOTSTRAP_REJECTED_ADMIN_EXISTS` to the audit log, and raises an unauthorized error. Additionally verified the one-time `BOOTSTRAP_SECRET` against environment configuration.
- **How I Tested It**:
  Created `src/__tests__/bootstrap.test.ts` testing:
  1. Rejection when secret is invalid.
  2. Rejection when an admin already exists in the system.
  3. Rejection when password is weak (< 8 chars).
  4. Successful bootstrap creation when system is clean and secret is valid.
  Ran Vitest test runner (All 4 bootstrap tests passed).
- **Git Commit Reference**:
  `3421124` — *feat: complete BalanceVault platform - auth, rbac, bootstrap, onboarding, accounts, audit trail, rate limiting, frontend, and tests*

---

### Entry 3: Immutable Append-Only Audit Logging Architecture & Secret Redaction

- **Date**: 2026-11-09
- **AI Tool Used**: Gemini 3.8 Flash (Antigravity Security & Database Agent)
- **Exact Task or Prompt**:
  > "Design and build the audit logging service to capture auth, onboarding, and ledger events while preventing data leakage and history manipulation."
- **AI-Generated Suggestion**:
  The initial suggestion passed raw HTTP request payloads and query bodies directly into the audit record's `metadata` JSON field, and provided standard repository methods `updateAuditLog` and `deleteAuditLog` for data hygiene.
- **What Was Incorrect, Incomplete, or Risky**:
  1. Passing raw request bodies into audit logs leaks plaintext passwords, password confirmations, and authorization bearer tokens into the database.
  2. Providing update and delete methods violates Section 12 ("Audit records should be append-only through application permissions; ordinary users and administrators cannot silently edit or delete historical records").
- **How I Investigated the Issue**:
  Investigated OWASP Top 10 Security Logging Failures and reviewed Section 12 & 20 security guidelines.
- **What I Changed or Decided**:
  1. Built a recursive metadata sanitizer `sanitizeMetadata` that recursively scans object keys and redacts `password`, `token`, `secret`, `jwt`, `authorization`, and PII.
  2. Removed all update and delete capabilities from `AuditService`. The service only exposes `AuditService.record(...)`.
  3. Added correlation ID and client IP tracking to all audit entries.
- **How I Tested It**:
  Verified during registration, login, onboarding, and transfer test suites that audit entries are generated with redacted passwords and immutable timestamps.
- **Git Commit Reference**:
  `3421124` — *feat: complete BalanceVault platform - auth, rbac, bootstrap, onboarding, accounts, audit trail, rate limiting, frontend, and tests*

---

### Entry 4: Centralized RBAC, IDOR Prevention & State Transition Safety

- **Date**: 2026-11-09
- **AI Tool Used**: Gemini 3.8 Flash (Antigravity Backend & Security Agent)
- **Exact Task or Prompt**:
  > "Implement authentication, role-based access control, onboarding review, and account management API controllers."
- **AI-Generated Suggestion**:
  Suggested letting the onboarding approval endpoint accept an applicant's ID and allow any authenticated user with `role === 'ADMIN'` to approve it without verifying if the admin is approving their own account. Also suggested using simple `/api/accounts/:id` fetching without checking if the account belonged to the requesting user.
- **What Was Incorrect, Incomplete, or Risky**:
  1. *Self-Approval Vulnerability*: An admin could register a personal user account and approve their own KYC onboarding without independent review.
  2. *Insecure Direct Object Reference (IDOR)*: Any authenticated user could query any account ID to view other users' balances and transaction history.
  3. *Unenforced Role Checks*: Relying on controller-level `if (req.user.role !== 'ADMIN')` scattering rather than centralized route middleware.
- **How I Investigated the Issue**:
  Referenced Section 6 ("Create a centralized permission system rather than scattering role checks throughout controllers") and Section 9 ("Do not allow users to approve their own applications").
- **What I Changed or Decided**:
  1. Implemented centralized middleware `requireRole(Role.ADMIN, Role.SUPER_ADMIN)` and `requireRole(Role.SUPER_ADMIN)` for administrative routes.
  2. In `OnboardingService.review`, added an explicit guard: `if (app.userId === dto.reviewerId) throw new AppError('Forbidden: Administrators cannot approve or reject their own onboarding application.', 403)`.
  3. In `AccountService.getAccountById`, added IDOR verification: regular users can only retrieve accounts matching `account.userId === req.user.id`.
- **How I Tested It**:
  Created `src/__tests__/auth_rbac.test.ts` and `src/__tests__/onboarding_account.test.ts`:
  1. Verified `ACCOUNT_HOLDER` cannot access admin metrics (HTTP 403).
  2. Verified `ADMIN` cannot modify user roles (SUPER_ADMIN only) (HTTP 403).
  3. Verified admin self-approval of onboarding fails with HTTP 403.
  4. Verified double-entry transfer with idempotency key avoids duplicate deductions.
- **Git Commit Reference**:
  `3421124` — *feat: complete BalanceVault platform - auth, rbac, bootstrap, onboarding, accounts, audit trail, rate limiting, frontend, and tests*

---

### Entry 5: Redis Rate Limiting Resilience and Fail-Safe Fallback Behavior

- **Date**: 2026-11-09
- **AI Tool Used**: Gemini 3.8 Flash (Antigravity DevOps & Reliability Agent)
- **Exact Task or Prompt**:
  > "Integrate Redis into the backend for API rate limiting and configure readiness probing."
- **AI-Generated Suggestion**:
  Suggested wrapping Redis calls in a `try/catch` and if Redis was down, calling `next()` to bypass rate limiting completely so the application wouldn't crash.
- **What Was Incorrect, Incomplete, or Risky**:
  Silently disabling security rate limiting when Redis fails leaves the authentication and registration endpoints completely unprotected against brute-force credential stuffing and DoS attacks (violates Section 14: "Do not silently disable security rate limiting during a Redis failure").
- **How I Investigated the Issue**:
  Analyzed fail-secure vs fail-open security requirements for financial endpoints.
- **What I Changed or Decided**:
  Architected a resilient hybrid sliding-window limiter in `src/middleware/rateLimiter.ts`:
  - When Redis is connected, it uses atomic `INCR` and `EXPIRE` commands in Redis.
  - If Redis connection is absent or drops, it automatically falls back to an in-memory sliding-window cache with periodic memory cleanup. Rate limiting remains strictly active at all times.
  - In `src/routes/health.routes.ts`, `/ready` reports Redis status as `DEGRADED_FALLBACK_ACTIVE` so operators are immediately alerted without compromising endpoint security.
- **How I Tested It**:
  Created `src/__tests__/rateLimiter.test.ts` testing 4 sequential requests against a 3-request limit threshold; verified the 4th request is blocked with HTTP 429 Too Many Requests and Retry-After headers under fallback mode.
- **Git Commit Reference**:
  `3421124` — *feat: complete BalanceVault platform - auth, rbac, bootstrap, onboarding, accounts, audit trail, rate limiting, frontend, and tests*

---
