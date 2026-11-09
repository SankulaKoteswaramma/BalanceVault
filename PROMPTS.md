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
  *Will be linked upon initial repository commit for Phase 1 & 2.*

---
