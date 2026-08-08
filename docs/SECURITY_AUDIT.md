# SkillDNA AI Security Architecture & Audit Report

## Security Controls
1. **Password Security**: Bcrypt 12-round salted hashing.
2. **Token Security**: Short-lived JWT access tokens (15m) + rotated refresh tokens (7d).
3. **HTTP Security**: Helmet security headers, CORS origin restriction, rate limiting.
4. **Access Control**: Role-Based Access Control (`authorize('STUDENT', 'RECRUITER', 'ADMIN')`).
