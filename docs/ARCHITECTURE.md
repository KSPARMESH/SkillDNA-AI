# SkillDNA AI Master System Architecture Document

## Overview
SkillDNA AI is an enterprise-grade AI-powered SaaS platform built as a monorepo using PNPM Workspaces, TurboRepo, Next.js 14, Express.js, Prisma ORM, PostgreSQL 16, Redis 7, and Google Gemini AI.

## Monorepo Workspaces
* `frontend`: Next.js 14 Web Application (App Router, Tailwind CSS, Lucide, Recharts).
* `backend`: Express.js REST API Microservices (`/api/v1`).
* `database`: Prisma ORM schemas (27 Models, 20 Enums), PostgreSQL migrations, seeders, and utilities.
* `shared`: Universal constants, enums, types, interfaces, and validators.
* `worker`: Background asynchronous task processing worker.
* `scripts`: Developer automation, setup, seeding, and deployment scripts.
* `infrastructure`: Docker, NGINX, and CI/CD configurations.
* `prompt-library`: System AI prompt templates.
* `assets`: Project media, branding, and Mermaid diagrams.
