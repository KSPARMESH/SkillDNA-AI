# SkillDNA AI Architecture Deep Dive

## Monorepo Strategy
SkillDNA AI is structured as a high-performance monorepo using **PNPM Workspaces** and **TurboRepo**.

```
SkillDNA-AI/
├── frontend/           # Next.js 14 Web Application (App Router, Tailwind)
├── backend/            # Express.js REST API Microservices (/api/v1)
├── database/           # Prisma ORM Schemas, Seeders, Migrations
├── shared/             # Universal Types, Enums, Interfaces, Validators
├── worker/             # Asynchronous Queue Processing Worker
├── docs/               # Technical Handbook & Documentation Suite
├── scripts/            # Automation & Maintenance Utilities
├── infrastructure/     # Docker, NGINX, GitHub Actions CI/CD
└── prompt-library/     # Google Gemini AI Prompt Templates
```
