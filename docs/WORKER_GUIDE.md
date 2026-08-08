# SkillDNA AI Background Worker & Processing Guide

## Worker Architecture
Powered by Redis background queues and `@skilldna/worker`.

## Processor Modules
1. `github.processor.ts` — Fetches commits, stars, repos.
2. `analytics.processor.ts` — Computes weekly velocity.
3. `notification.processor.ts` — Dispatches emails via Nodemailer.
4. `reports.processor.ts` — Invokes Gemini AI to calculate SkillDNA scores.
5. `wrapped.processor.ts` — Aggregates annual growth metrics.
6. `roadmap.processor.ts` — Derives learning gap milestones.
