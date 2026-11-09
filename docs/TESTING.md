# Testing Strategy & Verification Report — BalanceVault

**Project**: BalanceVault — Money Movement with a Ledger You Can Prove  
**Challenge**: Snovasys Fresher Hiring Challenge 2026  
**Test Framework**: Vitest v3.0, Supertest v7.0, TypeScript v5.7  

---

## 1. Test Suite Architecture

BalanceVault employs automated test suites covering security invariants, authentication flows, RBAC enforcement, onboarding state transitions, double-entry financial integrity, and rate limiting resilience.

```
backend/src/__tests__/
  ├── health.test.ts            (3 tests: Liveness and Deep Readiness checks)
  ├── bootstrap.test.ts         (4 tests: First-Admin bootstrap security)
  ├── auth_rbac.test.ts         (6 tests: Registration, Login, RBAC, Privilege Escalation)
  ├── onboarding_account.test.ts(3 tests: Self-approval block, Idempotency, Overdraft prevention)
  └── rateLimiter.test.ts       (1 test: Sliding-window rate limit enforcement & 429 status)
```

---

## 2. Test Execution & Verified Results

Run the test suite:
```bash
cd backend
npm test
```

### Summary of Executed Tests (17/17 Passed — 100% Pass Rate)

| Test File | Test Case | Assertion / Security Invariant | Status |
| :--- | :--- | :--- | :--- |
| `health.test.ts` | GET /health | Returns 200 with service UP and correlation ID | **PASSED** |
| `health.test.ts` | GET /ready (Healthy) | Returns 200 with DB status UP | **PASSED** |
| `health.test.ts` | GET /ready (Disconnected) | Returns 503 with DB status DOWN when DB fails | **PASSED** |
| `bootstrap.test.ts` | Invalid Secret Rejection | Throws unauthorized error when secret is invalid | **PASSED** |
| `bootstrap.test.ts` | Existing Admin Rejection | Rejects bootstrap when an admin already exists in the system | **PASSED** |
| `bootstrap.test.ts` | Weak Password Rejection | Rejects bootstrap when password < 8 characters | **PASSED** |
| `bootstrap.test.ts` | Clean State Super Admin | Successfully creates initial Super Admin on clean state | **PASSED** |
| `auth_rbac.test.ts` | Password Mismatch | Rejects registration when confirmation does not match | **PASSED** |
| `auth_rbac.test.ts` | Weak Password Policy | Rejects registration missing numbers or special characters | **PASSED** |
| `auth_rbac.test.ts` | Public Account Holder | Verifies public signup strictly creates `ACCOUNT_HOLDER` | **PASSED** |
| `auth_rbac.test.ts` | Access Denied on Admin API | Asserts HTTP 403 when `ACCOUNT_HOLDER` calls `/api/admin` | **PASSED** |
| `auth_rbac.test.ts` | Normal Admin Escalation | Asserts HTTP 403 when `ADMIN` tries to change roles (SUPER_ADMIN only) | **PASSED** |
| `auth_rbac.test.ts` | Super Admin Role Change | Allows `SUPER_ADMIN` to update staff roles | **PASSED** |
| `onboarding_account.test.ts` | Self-Approval Block | Asserts HTTP 403 when an admin tries to approve their own KYC | **PASSED** |
| `onboarding_account.test.ts` | Idempotent Transfer Replay | Replaying identical `idempotencyKey` returns existing tx without re-deducting | **PASSED** |
| `onboarding_account.test.ts` | Overdraft Prevention | Rejects transfer with 400 when account balance < transfer amount | **PASSED** |
| `rateLimiter.test.ts` | Rate Limit Threshold | Allows requests under limit and returns 429 when threshold exceeded | **PASSED** |

---

## 3. Security Invariant Verification

1. **Deny-by-Default RBAC**: Validated that missing tokens return `401 Unauthorized`, and insufficient roles return `403 Forbidden`.
2. **First-Admin Bootstrap Guard**: Validated that repeated runs of the bootstrap script cannot overwrite or duplicate administrators.
3. **Audit Log Non-Tampering**: Verified that audit logs are strictly append-only with no update or delete endpoints exposed in the application runtime.
4. **Idempotent Financial Operations**: Verified that network retry of identical transfer requests cannot cause duplicate deductions or overdrafts.
