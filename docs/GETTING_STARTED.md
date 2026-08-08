# SkillDNA AI Getting Started & Developer Onboarding Guide

## Prerequisites
* Node.js v20+ or v24+
* pnpm v9.15.0+
* Python launcher (`py`)
* Docker & Docker Compose

## Quickstart Setup
```bash
# 1. Clone & install monorepo dependencies
pnpm install

# 2. Start PostgreSQL 16 & Redis 7 containers
docker-compose up -d

# 3. Generate Prisma ORM Client & Seed Database
pnpm --filter database db:generate
pnpm --filter database db:seed

# 4. Start all development servers concurrently (Next.js frontend + Express backend)
pnpm dev
```
