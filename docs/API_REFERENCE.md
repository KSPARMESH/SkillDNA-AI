# SkillDNA AI REST API Reference (`/api/v1`)

## Authentication (`/api/v1/auth`)
* `POST /auth/register` — Candidate / Recruiter registration
* `POST /auth/login` — Account login & JWT issuance

## User Profile (`/api/v1/users`)
* `GET /users/me` — Authenticated profile metadata

## Platform Integrations (`/api/v1/integrations`)
* `POST /integrations/sync/:platform` — Trigger GitHub/LeetCode sync

## AI Intelligence (`/api/v1/ai`)
* `POST /ai/skill-dna-report` — Generate AI SkillDNA score report via Gemini API

## Recruitment (`/api/v1/recruitment`)
* `GET /recruitment/candidates` — Recruiter talent matrix search

## Organization (`/api/v1/organizations`)
* `GET /organizations/jobs` — Active job posting listings

## Analytics (`/api/v1/analytics`)
* `GET /analytics/user` — User activity & score metrics
