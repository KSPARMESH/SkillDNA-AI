# SkillDNA AI Database Architecture & Schema Specification

Welcome to the **SkillDNA AI Database Infrastructure**. This package contains the complete Prisma ORM database schema, migration management scripts, seed data generator, query building utilities, and Prisma middleware/extensions.

---

## 1. Architectural Design Principles
The SkillDNA AI database follows strict **Third Normal Form (3NF)** relational normalization rules while providing performant access for analytical, AI-driven, and real-time user workloads.

* **Database Engine**: PostgreSQL 16
* **ORM Engine**: Prisma ORM 6.x
* **Primary Key Strategy**: UUID v4 (36-character string) for distributed globally unique identifiers.
* **Timestamping Standard**: All models contain `createdAt` (UTC timestamp) and `updatedAt` (auto-updated UTC timestamp).
* **Soft Delete Pattern**: Models supporting audit retention use `deletedAt` timestamps with Prisma middleware filtering.
* **Indexing Strategy**: B-Tree composite indexes applied to foreign key columns, lookup slugs, unique email fields, and composite search parameters.

---

## 2. Entity Model Categories

### User & Authentication Domain
* `User`: Core account model (Student, Recruiter, Mentor, Admin).
* `RefreshToken`: JWT refresh token rotation records.
* `UserSession`: Active browser / IP session tracking.
* `UserProfile`: User persona details, total SkillDNA score, target role, and availability.

### Skills & Portfolio Domain
* `Education`: Degrees, field of study, institutions, and grades.
* `Skill`: Master skill taxonomy catalog.
* `UserSkill`: Junction table for candidate verified proficiency and rating.
* `Project`: User portfolio projects with LOC, star counts, and repository links.
* `ProjectSkill`: Junction mapping skills to specific projects.
* `Certification`: Verified industry certifications.
* `Hackathon`: Hackathon achievements, positions, and awards.

### External Integrations Domain
* `PlatformIntegration`: GitHub, LeetCode, HackerRank, LinkedIn connection state.
* `GitHubStat`: Sync statistics (commits, stars, PRs, top languages).
* `CodingStat`: LeetCode / HackerRank solved problems and contest ratings.

### AI Intelligence Domain
* `SkillDnaReport`: AI-generated SkillDNA score breakdown across 6 dimensions.
* `CareerReadiness`: Role gap analysis, missing skills, and readiness scores.
* `SkillVerification`: Proof-of-work skill audit logs.
* `ResumeAnalysis`: Parsed skills, formatting scores, and keyword gap analysis.
* `PortfolioAnalysis`: Web portfolio design and code quality AI review.
* `AiChatHistory`: Conversational history with the AI Mentor engine.

### Organization & Recruiter Domain
* `Organization`: Enterprise / University company profiles.
* `OrganizationMember`: Team membership and RBAC roles.
* `JobPosting`: Recruiter job postings with salary bands and required skills.

### System & Governance Domain
* `AuditLog`: Security audit trails for compliance.
* `Notification`: In-app and system alerts.
* `Subscription`: SaaS billing plans and subscription status.
* `SystemMetric`: Operational system metrics tracking.

---

## 3. CLI Commands
Run commands from the monorepo root or inside `database/`:

```bash
# Generate Prisma Client types
pnpm --filter database db:generate

# Apply pending schema migrations locally
pnpm --filter database db:migrate

# Seed database with realistic mock data
pnpm --filter database db:seed

# Launch Prisma Studio web GUI (http://localhost:5555)
pnpm --filter database db:studio
```
