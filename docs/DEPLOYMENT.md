# Deployment & Operational Runbook — BalanceVault

**Project**: BalanceVault — Money Movement with a Ledger You Can Prove  
**Challenge**: Snovasys Fresher Hiring Challenge 2026  
**Version**: 1.0.0  

---

## 1. Local Single-Command Deployment (Docker Compose)

The entire BalanceVault platform (PostgreSQL, Redis, Backend, Frontend) can be launched locally using Docker Compose:

```bash
# From workspace root
docker compose up -d --build
```

### Services Started:
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Liveness Probe**: `http://localhost:5000/health`
- **Readiness Probe**: `http://localhost:5000/ready`

### Run Database Migrations & Initial Seed inside Container:
```bash
# Execute migrations
docker compose exec backend npx prisma migrate deploy

# Seed demonstration data
docker compose exec backend npm run prisma:seed
```

---

## 2. Cloud Platform Deployment (Render / Railway / Vercel)

### 2.1 Backend API (Render / Railway / Fly.io)
1. **Build Command**: `cd backend && npm install && npm run build`
2. **Start Command**: `cd backend && node dist/server.js`
3. **Environment Variables Required**:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `FRONTEND_URL=https://your-frontend-app.vercel.app`
   - `DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/balancevault?schema=public`
   - `REDIS_URL=redis://<user>:<password>@<host>:<port>`
   - `JWT_SECRET=<32_bytes_random_hex_secret>`
   - `JWT_EXPIRES_IN=15m`
   - `BOOTSTRAP_SECRET=<32_bytes_random_hex_secret>`
4. **Health Check Path**: `/health` (liveness) and `/ready` (readiness).

### 2.2 Frontend SPA (Vercel / Netlify / Cloudflare Pages)
1. **Framework Preset**: Vite
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables**:
   - `VITE_API_URL=https://your-backend-api.onrender.com/api`

---

## 3. First Administrator Bootstrap Procedure

Once the database and backend are deployed in production, public administrator registration is prohibited. Execute the one-time bootstrap command:

```bash
ADMIN_BOOTSTRAP_EMAIL=superadmin@yourdomain.com \
ADMIN_BOOTSTRAP_PASSWORD=YourStrongPass@2026! \
ADMIN_BOOTSTRAP_NAME="Primary Compliance Officer" \
ADMIN_BOOTSTRAP_PHONE="+15551234567" \
BOOTSTRAP_SECRET="<YOUR_BOOTSTRAP_SECRET>" \
npm run bootstrap:admin --prefix backend
```

**Security Invariants Enforced**:
1. Checks that zero administrators exist in the database.
2. Validates `BOOTSTRAP_SECRET` against server environment.
3. Automatically writes an `ADMIN_BOOTSTRAPPED` event to the append-only `AuditLog`.
4. Subsequent attempts are permanently rejected.
