# SkillDNA AI Backend REST API (`@skilldna/backend`)

This package provides the production-grade **Express.js + TypeScript REST API microservices** for SkillDNA AI.

## Architectural Domains
* `auth/`: Authentication, JWT access/refresh token rotation, password hashing, RBAC middleware.
* `user/`: Candidate profile, bio, education, skill ratings, and portfolio management.
* `integrations/`: Third-party APIs data sync (GitHub, LeetCode, HackerRank, LinkedIn).
* `ai/`: Neural scoring via Google Gemini AI (SkillDNA score, career readiness, resume audit, AI Mentor).
* `recruitment/`: Recruiter talent search, skill verification, candidate candidate profile audit.
* `organization/`: Enterprise company registration, member roles, and job postings.
* `analytics/`: User activity analytics and notifications engine.

## Execution
```bash
# Start local development server (HTTP 5000)
pnpm --filter backend dev

# Compile TypeScript production build
pnpm --filter backend build
```
