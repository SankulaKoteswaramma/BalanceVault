# BalanceVault — Money Movement with a Ledger You Can Prove
### Snovasys Fresher Hiring Challenge 2026

[![Node.js](https://img.shields.io/badge/Node.js-v24.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-v18.3-61dafb.svg)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2d3748.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-24%20Passed%20(100%25)-brightgreen.svg)]()

---

## 1. Project Overview & Objectives

**BalanceVault** is an enterprise-grade, secure account management and financial ledger platform developed for the **Snovasys Fresher Hiring Challenge 2026**.

The platform proves that financial account operations can be strictly controlled, traceable, and protected against unauthorized access, privilege escalation, and historical tampering.

### Core Capabilities
- **Multi-Stage KYC Onboarding**: Complete state machine (`REGISTERED` &rarr; `PENDING_REVIEW` &rarr; `APPROVED` / `REJECTED`) with an administrative review dossier and self-approval prevention.
- **Centralized Role-Based Access Control (RBAC)**: Strict separation across `SUPER_ADMIN`, `ADMIN`, and `ACCOUNT_HOLDER` with deny-by-default route guards and IDOR protection.
- **First-Administrator Bootstrap**: A single-execution CLI / service mechanism protected by a high-entropy secret, atomic database verification, and permanent lock against re-execution.
- **Append-Only Tamper-Resistant Audit Trail**: Immutable logging enforced by application constraints and PostgreSQL least-privilege roles, with automatic recursive redaction of sensitive credentials.
- **Double-Entry Financial Integrity**: Multi-legged balanced transactions (`DEBIT` = `CREDIT`) with client-side idempotency key deduplication and zero-floor overdraft prevention.
- **Resilient Sliding-Window Rate Limiting**: Redis-backed sliding-window rate limiting with automatic in-memory fail-secure fallback during Redis outages.
- **System Observability**: Shallow liveness (`/health`) and deep PostgreSQL/Redis readiness (`/ready`) probes.

---

## 2. Pre-Seeded Demonstration Accounts

The database comes pre-seeded with four distinct accounts covering all roles and onboarding lifecycles:

| Role | Email Address | Password | Permissions & Experience |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `superadmin@balancevault.com` | `VaultAdmin@2026!` | Administrative metrics, user directory, status suspensions, staff role assignments, and append-only audit trail inspection. |
| **Compliance Officer** | `compliance.officer@balancevault.com` | `Compliance@2026!` | KYC onboarding review queue: inspect applicant dossiers, approve or reject applications with mandatory notes, and lock account statuses. |
| **Approved Customer** | `alice.customer@balancevault.com` | `CustomerPass@2026!` | Verified customer with active Checking & Savings accounts ($24,500 balance), enabled for double-entry money transfers. |
| **Pending Applicant** | `bob.applicant@balancevault.com` | `ApplicantPass@2026!` | Customer who submitted KYC documentation and is currently in `PENDING_REVIEW` state awaiting compliance review. |

---

## 3. How to Run the Project

You can run BalanceVault in **two ways**: via Docker Compose (all-in-one) or locally via Node.js.

### Option A: Running with Docker Compose (Recommended All-in-One)

Prerequisites: [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

#### Step 1: Start All Containers
From the root project directory:
```bash
docker compose up -d --build
```
This builds and starts 4 services:
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **PostgreSQL Database**: `localhost:5432`
- **Redis Cache**: `localhost:6379`

#### Step 2: Initialize Database Schema & Seed Data
```bash
# Push schema to PostgreSQL
docker compose exec backend npx prisma db push

# Seed demonstration accounts
docker compose exec backend npx tsx prisma/seed.ts
```

#### Step 3: Open in Your Browser
- Web Application: **[http://localhost:5173](http://localhost:5173)**
- Backend Health Probe: **[http://localhost:5000/health](http://localhost:5000/health)**
- Backend Readiness Probe: **[http://localhost:5000/ready](http://localhost:5000/ready)**

---

### Option B: Running Locally with Node.js (Without Docker)

Prerequisites: Node.js >= 20.x, npm >= 10.x, and a PostgreSQL database (local or cloud like Neon.tech).

#### Step 1: Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### Step 2: Configure Environment Variables
Copy `.env.example` in `backend/`:
```bash
cd backend
cp ../.env.example .env
```
Ensure `DATABASE_URL` in `backend/.env` points to your PostgreSQL instance:
```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/balancevault?schema=public"
```

#### Step 3: Sync Database & Seed Demo Accounts
```bash
cd backend
npx prisma db push
npm run prisma:seed
```

#### Step 4: Start Development Servers
Open two terminal windows:

- **Terminal 1 (Backend API on Port 5000)**:
  ```bash
  cd backend
  npm run dev
  ```
- **Terminal 2 (Frontend SPA on Port 5173)**:
  ```bash
  cd frontend
  npm run dev
  ```

Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 4. Cloud Deployment (Render + Vercel + Neon)

### 1. Database (Neon.tech)
1. Create a free PostgreSQL project at [Neon.tech](https://neon.tech).
2. Copy the connection string (`postgresql://...@...neon.tech/neondb?sslmode=require`).

### 2. Backend API (Render.com)
1. Create a **New Web Service** connected to your GitHub repository `SankulaKoteswaramma/BalanceVault`.
2. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma db push && npm run build`
   - **Start Command**: `node dist/server.js`
3. Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `DATABASE_URL`: *(Your Neon connection string)*
   - `JWT_SECRET`: `vault_super_secret_jwt_key_32_bytes_long_render_2026!`
   - `BOOTSTRAP_SECRET`: `vault_bootstrap_secret_token_render_2026_challenge!`
   - `FRONTEND_URL`: `https://your-app.vercel.app`

### 3. Frontend SPA (Vercel.com)
1. Import `SankulaKoteswaramma/BalanceVault` on [Vercel](https://vercel.com).
2. Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
3. Environment Variables:
   - `VITE_API_URL`: `https://your-render-backend.onrender.com/api`
4. Deploy!

---

## 5. Automated Test Suite

BalanceVault includes **24 automated unit, integration, security, and end-to-end tests** with a 100% pass rate:

```bash
cd backend
npm test
```

### Test Suite Breakdown

| Suite File | Test Count | Security Invariants Covered |
| :--- | :---: | :--- |
| `health.test.ts` | 3 | Shallow liveness probe and deep PostgreSQL connection readiness checking. |
| `bootstrap.test.ts` | 4 | First-admin bootstrap security, invalid secrets rejection, duplicate creation block, weak password rejection. |
| `auth_rbac.test.ts` | 6 | Password confirmation matching, password policy enforcement, public signup role hardcoding, denial of customer access to admin routes (HTTP 403), denial of staff role modification by normal admin. |
| `onboarding_account.test.ts` | 3 | Admin self-approval block (HTTP 403), double-entry transfer idempotency replay protection, overdraft prevention (HTTP 400). |
| `rateLimiter.test.ts` | 1 | Sliding-window threshold enforcement, blocking after max requests with HTTP 429 and Retry-After headers. |
| `e2e_workflow.test.ts` | 7 | Complete 7-step candidate submission simulation from registration to admin review, account provisioning, double-entry transfers, and audit log inspection. |

---

## 6. Project Architecture & Directory Structure

```
BalanceVault/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma           # PostgreSQL models, enums & relations
│   │   └── seed.ts                 # Pre-configured demonstration data seed script
│   ├── src/
│   │   ├── config/                 # Typed environment validation with Zod
│   │   ├── controllers/            # HTTP controllers (auth, onboarding, accounts, admin)
│   │   ├── middleware/             # RBAC guards, rate limiters, correlation IDs, error handlers
│   │   ├── routes/                 # REST route definitions
│   │   ├── scripts/                # First-administrator bootstrap CLI
│   │   ├── services/               # Pure business logic, state machines, audit loggers
│   │   ├── utils/                  # Cryptographic utilities, JSON loggers
│   │   ├── validators/             # Strict Zod request schemas
│   │   ├── app.ts                  # Express application setup, Helmet & CORS
│   │   ├── prisma.ts               # Prisma client singleton & query event logger
│   │   ├── redis.ts                # Redis client with in-memory fallback
│   │   └── server.ts               # HTTP server lifecycle & graceful shutdown
│   ├── Dockerfile                  # Multi-stage production container build
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/             # Navigation, protected routes, modals
│   │   ├── context/                # AuthContext with session lifecycle & JWT storage
│   │   ├── layouts/                # Dashboard responsive layout with role distinction
│   │   ├── pages/                  # Landing, Login, Register, User & Admin portals
│   │   ├── services/               # Axios API client with dynamic VITE_API_URL
│   │   ├── types/                  # Shared TypeScript interfaces & enums
│   │   ├── App.tsx                 # Route hierarchy & role guards
│   │   └── main.tsx                # React 18 DOM mount point
│   ├── Dockerfile                  # Multi-stage build with Nginx static hosting
│   ├── nginx.conf                  # Nginx reverse proxy & SPA fallback routing
│   ├── vercel.json                 # Vercel SPA rewrite configuration
│   └── package.json
│
├── docs/
│   ├── ARCHITECTURE.md             # High-level architecture specification
│   ├── DATABASE_DESIGN.md          # Database ER diagram & least-privilege role DDL
│   ├── SECURITY.md                 # Threat defense model & cryptographic standards
│   ├── API_DOCUMENTATION.md        # Full REST API request/response catalog
│   ├── TESTING.md                  # Automated testing report & verification matrix
│   ├── DEPLOYMENT.md               # Production deployment runbook
│   └── INTERVIEW_PREP.md           # 14-step interview demonstration cheat sheet & technical Q&A
│
├── REQUIREMENTS_TRACEABILITY.md    # Snovasys requirements traceability matrix
├── THREATS.md                      # STRIDE threat model with verified test evidence
├── PROMPTS.md                      # AI interaction audit log (5 dated entries + commit links)
├── docker-compose.yml              # All-in-one local multi-container composition
└── README.md                       # Master project documentation
```

---

## 7. Troubleshooting Common Issues

### Issue 1: `Error: listen EADDRINUSE: address already in use :::5000`
- **Cause**: Port 5000 is already in use (most commonly because Docker Compose is running the backend).
- **Fix**: Either stop the Docker backend with `docker compose stop backend`, or change `PORT=5001` in `backend/.env`.

### Issue 2: `failed to connect to the docker API at npipe:////./pipe/docker_engine`
- **Cause**: Docker Desktop is installed but not open.
- **Fix**: Launch **Docker Desktop** from the Windows Start Menu and wait until the whale icon in your taskbar turns steady green ("Engine running").

### Issue 3: `CORS blocked for origin: http://localhost:5174`
- **Cause**: Vite selected port 5174 because 5173 was busy.
- **Fix**: The backend CORS middleware automatically allows all `http://localhost:*`, `http://127.0.0.1:*`, and `*.vercel.app` origins. Simply refresh the page.

---

## 8. Snovasys Candidate Submission Information

- **Candidate Name**: Koteswararao S
- **Candidate Email**: `srkotesh03@gmail.com`
- **GitHub Repository**: [`https://github.com/SankulaKoteswaramma/BalanceVault.git`](https://github.com/SankulaKoteswaramma/BalanceVault.git)
- **Challenge Period**: 6 November 2026 – 12 November 2026
- **Challenge Portal**: [https://hackathon.snovasys.com/project/768](https://hackathon.snovasys.com/project/768)
- **Submission Requirements**: All 21 mandatory requirements and financial ledger integrity requirements are verified, tested, and documented.
