# Requirements Traceability Matrix — BalanceVault

**Project**: BalanceVault — Money Movement with a Ledger You Can Prove  
**Challenge**: Snovasys Fresher Hiring Challenge 2026  
**Document Status**: Baseline / Initial Analysis (Phase 0)  
**Date**: November 9, 2026  

---

## 1. Confirmed Mandatory Requirements

These requirements are explicitly identified in the updated BalanceVault specification (Section 3A & Master Specification):

| Req ID | Category | Requirement Description | Architecture / Implementation Target | Status |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | Frontend | Modern React SPA with TypeScript, Vite, Tailwind CSS, Lucide Icons, responsive layouts | `frontend/` (Vite + React + TS) | Pending Approval |
| **REQ-02** | Backend | Node.js + Express API in TypeScript with RESTful design, Zod validation, centralized error handling | `backend/src/` | Pending Approval |
| **REQ-03** | Database | PostgreSQL relational database with normalized schema, constraints, indexes, timestamps | PostgreSQL instance | Pending Approval |
| **REQ-04** | ORM | Prisma ORM for schema definition, modeling, typed client, and connection handling | `backend/prisma/schema.prisma` | Pending Approval |
| **REQ-05** | Migrations | Version-controlled database migrations via Prisma (`prisma migrate deploy`) | `backend/prisma/migrations/` | Pending Approval |
| **REQ-06** | DB Security | Separate PostgreSQL database roles with least privilege (Migration Owner, App Runtime, Bootstrap/Read) | PostgreSQL role DDL scripts | Pending Approval |
| **REQ-07** | Auth | Secure JWT-based authentication, Argon2id/bcrypt password hashing, logout, token expiration | `backend/src/services/auth.service.ts` | Pending Approval |
| **REQ-08** | Access Control | Centralized Role-Based Access Control (RBAC): `SUPER_ADMIN`, `ADMIN`, `ACCOUNT_HOLDER` | `backend/src/middleware/auth.middleware.ts` | Pending Approval |
| **REQ-09** | Registration | Public user registration for `ACCOUNT_HOLDER` only (strict prevention of admin self-assignment) | `POST /api/auth/register` | Pending Approval |
| **REQ-10** | Onboarding | Account-holder onboarding workflow (`REGISTERED` -> `PROFILE_INCOMPLETE` -> `PENDING_REVIEW` -> `APPROVED`/`REJECTED`) | `backend/src/services/onboarding.service.ts` | Pending Approval |
| **REQ-11** | Admin Functions | Administrative portal for onboarding review, user status management, system oversight | `frontend/src/pages/admin/` & `backend/src/routes/admin/` | Pending Approval |
| **REQ-12** | User Mgmt | Admin user management (listing, filtering, pagination, status activation/suspension, audit trail) | `backend/src/controllers/admin.controller.ts` | Pending Approval |
| **REQ-13** | Onboarding Mgmt | Admin onboarding decisioning (approve/reject with mandatory reasons, state validation) | `backend/src/controllers/onboarding.controller.ts` | Pending Approval |
| **REQ-14** | Audit Logs | Tamper-resistant, append-only audit trail for critical security, auth, onboarding, and account actions | `backend/src/services/audit.service.ts` | Pending Approval |
| **REQ-15** | Rate Limiting | Redis-backed rate limiting for brute-force prevention, registration throttling, endpoint abuse | `backend/src/middleware/rateLimiter.ts` | Pending Approval |
| **REQ-16** | Health Endpoint | Shallow liveness health endpoint returning server process status (`GET /health`) | `backend/src/routes/health.routes.ts` | Pending Approval |
| **REQ-17** | Ready Endpoint | Deep readiness endpoint checking PostgreSQL and Redis connectivity (`GET /ready`) | `backend/src/routes/health.routes.ts` | Pending Approval |
| **REQ-18** | Bootstrap | Secure First-Administrator Bootstrap (no public admin signup, one-time secret, runs once only) | `backend/src/scripts/bootstrapAdmin.ts` | Pending Approval |
| **REQ-19** | Admin Auth | Complete Administrator login flow and session management | `POST /api/auth/login` | Pending Approval |
| **REQ-20** | Testing | Automated test suite (Vitest/Jest, Supertest API tests, RBAC tests, Playwright E2E) | `backend/src/__tests__/`, `tests/` | Pending Approval |
| **REQ-21** | Deployment | Deployment verification (Production builds, Docker compose / cloud deployment, environment isolation) | Deployment scripts & configs | Pending Approval |

---

## 2. Original Requirements Awaiting Clarification (LedgerLine Inheritance)

The earlier problem statement emphasized financial ledger integrity under the working title *LedgerLine*. We have mapped these to an extensible architecture so they can be seamlessly enabled without refactoring:

| Req ID | Requirement | Description | Current Strategy |
| :--- | :--- | :--- | :--- |
| **LEG-01** | Double-Entry Accounting | Multi-legged balanced debit/credit entries for all balance movements | Schema model prepared in Prisma (`Transaction`, `LedgerEntry`); activated upon confirmation |
| **LEG-02** | Idempotency Keys | Client-provided idempotency keys on financial mutation endpoints to prevent duplicate processing | Design idempotent request handler with Redis cache/PostgreSQL unique constraint |
| **LEG-03** | Concurrency Safety & Pessimistic Locks | Row-level locking (`SELECT ... FOR UPDATE`) or atomic balance checks to prevent race conditions | Architectural design ready in transaction service |
| **LEG-04** | Overdraft Prevention | Strict zero-floor constraint (`balance >= 0`) at both application and database check levels | Database check constraint ready in migration design |
| **LEG-05** | Immutable Posted Ledger | Disallow `UPDATE` or `DELETE` on posted ledger records; only compensatory reversal transactions permitted | Database triggers / privilege restrictions |
| **LEG-06** | Concurrency & Idempotency Tests | Automated stress tests simulating parallel requests against identical accounts | Test suite templates designed in `tests/concurrency` |
| **LEG-07** | Demo Video & Technical Write-up | Formal recorded presentation and deep-dive architectural document | Documentation prepared in `docs/` and `README.md` |

> **Clarification Note to Evaluator / Candidate**: If the official evaluation requires the complete transactional LedgerLine double-entry transfer engine beyond account status management, our schema and repository layer will support immediate activation of `POST /api/accounts/:id/transfers` with idempotency and double-entry guarantees.

---

## 3. Optional Improvements & Operational Hardening

| Req ID | Improvement | Description |
| :--- | :--- | :--- |
| **OPT-01** | Dual-Token Auth (Access + Refresh Rotation) | Short-lived JWT access tokens (15m) paired with cryptographically secure, rotatable refresh tokens stored in HTTP-only cookies |
| **OPT-02** | Strict Security Headers (Helmet + CSP) | Production-ready HTTP security headers (`Content-Security-Policy`, `HSTS`, `X-Frame-Options`, `X-Content-Type-Options`) |
| **OPT-03** | OpenAPI 3.0 / Swagger UI | Interactive API documentation accessible at `/api/docs` in development |
| **OPT-04** | Redis Fallback / Circuit Breaker | Resilient handling of Redis network drops with fail-secure or memory-backed throttling |
| **OPT-05** | Cryptographic Audit Hashing | Merkle tree or chained SHA-256 hash chaining on audit log rows to cryptographically prove non-tampering |

---

## 4. Missing Official Requirements Checklist

- [ ] Exact ten functional requirement list from the Snovasys hackathon portal (pending user clarification or confirmation of Section 3A).
- [ ] Confirmation on whether financial transfers (money movement between accounts) are evaluated in addition to account creation/status lifecycles.
