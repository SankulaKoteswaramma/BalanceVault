# Interview Preparation & Architecture Defense Guide — BalanceVault

**Project**: BalanceVault — Money Movement with a Ledger You Can Prove  
**Challenge**: Snovasys Fresher Hiring Challenge 2026  
**Candidate**: Koteswararao S  

---

## 1. Architectural Elevator Pitch (60 Seconds)

> "BalanceVault is a secure financial account management platform built with React, Node.js, PostgreSQL, Prisma, and Redis. It provides user onboarding with KYC state transitions, centralized Role-Based Access Control (`SUPER_ADMIN`, `ADMIN`, `ACCOUNT_HOLDER`), a tamper-resistant first-admin bootstrap mechanism, append-only audit logging with secret redaction, and double-entry balanced ledger transfers with idempotency key deduplication. The system adheres to defense-in-depth principles: zero client-side privilege trust, PostgreSQL least-privilege database roles, and resilient rate limiting that falls back to in-memory sliding windows if Redis is unavailable."

---

## 2. Key Technical Questions & Answers

### Q1: Why did you design the First-Admin Bootstrap as a CLI / atomic service instead of a public API endpoint?
**Answer**:
"A public endpoint accepting an admin registration key presents serious security liabilities: timing attacks, brute-force exposure, and replay attacks. Even if protected by a query token, the endpoint remains an unnecessary attack surface once an admin is initialized.
In BalanceVault:
1. Public registration strictly hardcodes `role = Role.ACCOUNT_HOLDER`.
2. The bootstrap CLI performs an atomic database query checking if ANY user with `role IN (ADMIN, SUPER_ADMIN)` exists. If the count is greater than 0, it halts immediately.
3. It requires a cryptographically strong `BOOTSTRAP_SECRET` (>= 32 bytes) configured in the server environment.
4. It logs an `ADMIN_BOOTSTRAPPED` event to the append-only audit table.
5. Once executed, repeated attempts are permanently rejected."

---

### Q2: How do you guarantee that Audit Logs are truly tamper-resistant?
**Answer**:
"We enforce tamper resistance at two distinct layers:
1. **Application Layer**: The `AuditService` only exposes an append operation (`AuditService.record(...)`). There are zero API routes, controller endpoints, or service methods for updating or deleting audit logs. Furthermore, an automatic recursive sanitizer redacts sensitive fields like passwords, tokens, and authorization headers before serialization.
2. **Database Role Layer**: In our PostgreSQL least-privilege role design (`bv_app_runtime`), we execute:
   ```sql
   GRANT SELECT, INSERT ON "AuditLog" TO bv_app_runtime;
   REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog" FROM bv_app_runtime;
   ```
   Even if an attacker gains code execution in the application runtime, the database itself denies any SQL `UPDATE` or `DELETE` against historical audit records."

---

### Q3: How does the system handle Redis failure during rate limiting?
**Answer**:
"Most naive rate limiters fail open (disabling protection) or crash the entire application when Redis is down.
BalanceVault implements a **fail-secure, resilient hybrid limiter**:
- When Redis is connected, it uses atomic `INCR` and `EXPIRE` commands in Redis.
- If Redis disconnects or is unavailable, the middleware automatically falls back to an in-memory sliding-window store with periodic memory reclamation. Rate limiting remains strictly active on sensitive endpoints (e.g. max 5 login attempts / min).
- The `/ready` probe flags Redis as `DEGRADED_FALLBACK_ACTIVE` to alert site reliability engineers without compromising security."

---

### Q4: How is financial integrity and double-entry accounting preserved?
**Answer**:
"We guarantee financial integrity through four invariants:
1. **Double-Entry Balancing**: Every transfer creates matching `DEBIT` and `CREDIT` `LedgerEntry` records within a single atomic database transaction (`$transaction`). The sum of debits strictly equals credits.
2. **Idempotency Key Deduplication**: Financial mutations require a unique client `idempotencyKey`. If a client retries due to network jitter, the system detects the existing transaction and returns the original result without performing a second balance deduction.
3. **Zero-Floor Overdraft Prevention**: Both application service checks and database constraints ensure `source.balance >= amount`.
4. **IDOR Prevention**: The account service verifies that `account.userId === req.user.id`, ensuring users cannot transfer funds from accounts they do not own."

---

### Q5: What is the difference between `/health` and `/ready`?
**Answer**:
- **`/health` (Liveness)**: Shallow check returning HTTP 200 indicating that the Node.js process and HTTP server are responsive.
- **`/ready` (Readiness)**: Deep dependency check executing `SELECT 1` against PostgreSQL and checking Redis connectivity. If the database is disconnected, it returns HTTP 503 so load balancers stop routing customer traffic to an unready instance."

---

## 3. Live Demonstration Cheat Sheet (14 Steps)

1. **System Health**: Open `http://localhost:5000/health` & `http://localhost:5000/ready` &rarr; verify `UP` status.
2. **Landing Page**: Open `http://localhost:5173` &rarr; fintech hero, feature cards, links.
3. **Public Registration**: Register as a new customer &rarr; role is strictly `ACCOUNT_HOLDER`.
4. **Privilege Escalation Block**: Inspect network tab; user cannot call `/api/admin` (HTTP 403).
5. **KYC Onboarding Submission**: Fill out DOB, address, masked ID, income &rarr; status updates to `PENDING_REVIEW`.
6. **Administrator Login**: Sign in as `compliance.officer@balancevault.com` / `Compliance@2026!`.
7. **Compliance Queue**: View pending applicant dossier in review queue.
8. **Self-Approval Guard**: Demonstrate that admins cannot approve their own application (HTTP 403).
9. **Applicant Approval**: Commit decision &rarr; account `BV-XXXX-XXXX` is automatically provisioned.
10. **Customer Dashboard**: Log in as approved customer &rarr; view verified badge and active checking account.
11. **Double-Entry Transfer**: Move money from Checking to Savings &rarr; debits and credits post atomically.
12. **Idempotency Replay**: Re-post transfer with same idempotency key &rarr; idempotent replay detected with 0 duplicate deductions.
13. **Append-Only Audit Trail**: Log in as Super Admin &rarr; inspect chronological, immutable audit log with actor, action, timestamp, and redacted metadata.
14. **Rate Limiting Protection**: Submit 6 rapid login requests &rarr; verify HTTP 429 Too Many Requests response.
