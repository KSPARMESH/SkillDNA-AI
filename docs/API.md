# SkillDNA AI REST API Specification

## Base URL
`http://localhost:5000/api/v1`

## Endpoints
* `POST /auth/register`: Candidate / Recruiter registration.
* `POST /auth/login`: Authentication & JWT token issuance.
* `GET /users/me`: Authenticated profile retrieval.
* `POST /integrations/sync/:platform`: Trigger platform data sync (GitHub/LeetCode).
* `POST /ai/skill-dna-report`: Generate AI SkillDNA score report via Gemini API.
* `GET /recruitment/candidates`: Recruiter candidate discovery matrix.
* `GET /organizations/jobs`: Job posting listings.
* `GET /analytics/user`: User activity analytics.
