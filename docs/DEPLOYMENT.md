# SkillDNA AI Production Deployment Guide

This guide documents the complete production architecture, service URLs, environment variable configurations, database deployment steps, and verification procedures for the live SkillDNA AI ecosystem.

---

## 1. Production Service Architecture & URLs

The production deployment consists of three decoupled, specialized tiers:

| Tier                 | Service / Platform | Production URL                               | Details                                                              |
| :------------------- | :----------------- | :------------------------------------------- | :------------------------------------------------------------------- |
| **Frontend Web App** | **Vercel**         | `https://skill-dna-ai-frontend.vercel.app`   | Next.js 14 App Router client with responsive glassmorphism UI        |
| **Backend REST API** | **Render**         | `https://skilldna-backend-ii5w.onrender.com` | Express.js REST API with JWT auth, CORS whitelist, and rate limiting |
| **Database**         | **Supabase**       | `db.[PROJECT-REF].supabase.co`               | Managed PostgreSQL 16 relational database with Prisma ORM            |

```mermaid
graph LR
    User[Candidate / Recruiter] -->|HTTPS| Vercel[Vercel Frontend: Next.js 14<br/>https://skill-dna-ai-frontend.vercel.app]
    Vercel -->|CORS Whitelisted REST API| Render[Render Backend: Express API<br/>https://skilldna-backend-ii5w.onrender.com]
    Render -->|PostgreSQL 16| Supabase[(Supabase Managed PostgreSQL)]
    Render -->|AI Neural Analysis| Gemini[Google Gemini 3.7 Flash API]
```

---

## 2. Database Tier Deployment (Supabase PostgreSQL)

SkillDNA AI uses **Supabase Managed PostgreSQL 16** with Prisma ORM for relational persistence.

### Prisma Migration Deployment

Run Prisma migrations against the Supabase instance:

```bash
# Validate Prisma schema
pnpm --filter @skilldna/database exec prisma validate

# Deploy pending migrations to production Supabase database
pnpm --filter @skilldna/database exec prisma migrate deploy
```

> [!NOTE]
> For production safety, never run `prisma migrate dev` or database resets in production. Only use `prisma migrate deploy`.

---

## 3. Backend REST API Deployment (Render)

The backend microservice runs on **Render** as a Node.js Web Service.

### Render Service Settings

- **Environment**: `Node`
- **Node Version**: `>=20.0.0`
- **Build Command**:
  ```bash
  pnpm --filter @skilldna/shared build && pnpm --filter @skilldna/database build && pnpm --filter @skilldna/backend build
  ```
- **Start Command**:
  ```bash
  pnpm --filter @skilldna/backend start
  ```
- **Health Check Path**: `/health`
- **Auto-Deploy**: Enabled on `main` branch push

### Render Environment Variables

| Variable                          | Example / Production Value                                                       | Description                                          |
| :-------------------------------- | :------------------------------------------------------------------------------- | :--------------------------------------------------- |
| `NODE_ENV`                        | `production`                                                                     | Enables production mode & strict key checks          |
| `PORT`                            | `5000`                                                                           | Port allocated by Render                             |
| `API_PREFIX`                      | `/api/v1`                                                                        | Base REST API route prefix                           |
| `CLIENT_URL`                      | `https://skill-dna-ai-frontend.vercel.app`                                       | Allowed CORS frontend origin                         |
| `CORS_ALLOWED_ORIGINS`            | `https://skill-dna-ai-frontend.vercel.app`                                       | Comma-separated CORS whitelist                       |
| `DATABASE_URL`                    | `postgresql://postgres:[PASS]@db.[REF].supabase.co:5432/postgres?pgbouncer=true` | Supabase PostgreSQL connection string                |
| `DIRECT_URL`                      | `postgresql://postgres:[PASS]@db.[REF].supabase.co:5432/postgres`                | Direct connection string for Prisma migrations       |
| `ENCRYPTION_KEY`                  | `<32-byte-hex-or-base64-key>`                                                    | 256-bit key for OAuth token AES-256-GCM encryption   |
| `JWT_SECRET`                      | `<secure-random-string-min-32-chars>`                                            | Secret key for signing access tokens                 |
| `JWT_REFRESH_SECRET`              | `<secure-random-string-min-32-chars>`                                            | Secret key for signing refresh tokens                |
| `JWT_EXPIRES_IN`                  | `15m`                                                                            | Access token lifespan                                |
| `JWT_REFRESH_EXPIRES_IN`          | `7d`                                                                             | Refresh token lifespan                               |
| `GEMINI_API_KEY`                  | `<google-gemini-api-key>`                                                        | Google Gemini API key for AI evaluations             |
| `GEMINI_MODEL`                    | `gemini-3.7-flash`                                                               | Selected Gemini model                                |
| `RATE_LIMIT_WINDOW`               | `15m`                                                                            | Global rate limiting window duration                 |
| `RATE_LIMIT_MAX_REQUESTS`         | `100`                                                                            | Max requests per IP per window                       |
| `AUTH_RATE_LIMIT_MAX_REQUESTS`    | `10`                                                                             | Brute-force limit for `/api/v1/auth/login`           |
| `REFRESH_RATE_LIMIT_MAX_REQUESTS` | `30`                                                                             | Refresh abuse limit for `/api/v1/auth/refresh`       |
| `AI_RATE_LIMIT_MAX_REQUESTS`      | `10`                                                                             | Cost-control limit for `/api/v1/ai/skill-dna-report` |
| `BCRYPT_ROUNDS`                   | `12`                                                                             | Password hashing work factor                         |

---

## 4. Frontend Web Application Deployment (Vercel)

The client application runs on **Vercel** as a Next.js 14 App Router application.

### Vercel Project Settings

- **Framework Preset**: Next.js
- **Root Directory**: `./` (or `frontend`)
- **Build Command**:
  ```bash
  pnpm --filter @skilldna/shared build && pnpm --filter @skilldna/frontend build
  ```
- **Output Directory**: `frontend/.next`
- **Install Command**: `pnpm install`

### Vercel Environment Variables

| Variable              | Production Value                                    | Description                      |
| :-------------------- | :-------------------------------------------------- | :------------------------------- |
| `NODE_ENV`            | `production`                                        | Execution environment            |
| `NEXT_PUBLIC_API_URL` | `https://skilldna-backend-ii5w.onrender.com/api/v1` | Public backend REST API base URL |
| `NEXT_PUBLIC_APP_URL` | `https://skill-dna-ai-frontend.vercel.app`          | Public canonical application URL |

---

## 5. Post-Deployment Verification & Health Probing

Verify the live deployment using these standard probes:

### 1. Backend Liveness Healthcheck

```bash
curl -I https://skilldna-backend-ii5w.onrender.com/health
```

**Expected Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "status": "UP",
  "service": "SkillDNA AI Backend API",
  "environment": "production",
  "timestamp": "..."
}
```

### 2. CORS Preflight Verification

```bash
curl -X OPTIONS https://skilldna-backend-ii5w.onrender.com/api/v1/auth/login \
  -H "Origin: https://skill-dna-ai-frontend.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization, Content-Type" \
  -I
```

**Expected Response**:

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://skill-dna-ai-frontend.vercel.app
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
```

### 3. Rate Limit Header Verification

```bash
curl -i https://skilldna-backend-ii5w.onrender.com/api/v1/users/me \
  -H "Origin: https://skill-dna-ai-frontend.vercel.app"
```

**Expected Headers**:

```http
ratelimit-limit: 100
ratelimit-remaining: 99
ratelimit-reset: ...
```

### 4. End-to-End Frontend Verification

1. Navigate to `https://skill-dna-ai-frontend.vercel.app`
2. Log in at `/login`
3. Verify concurrent dashboard data hydration (`/users/me`, `/projects`, `/integrations`, `/ai/skill-dna-report`)
4. Verify AI SkillDNA evaluation generation at `/ai-workspace`
