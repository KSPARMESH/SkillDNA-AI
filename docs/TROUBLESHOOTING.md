# SkillDNA AI Operational Troubleshooting Runbook

## Common Issues & Remediation
1. **Database Connection Timeout**: Check `DATABASE_URL` pool size in `database/prisma/client.ts`.
2. **Redis Queue Disconnection**: Verify Redis 7 container status (`docker-compose ps`).
3. **JWT Expiry Error**: Trigger `/api/v1/auth/refresh` endpoint to acquire new access token.
