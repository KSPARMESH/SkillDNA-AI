# SkillDNA AI Client SDK Integration Guide

## TypeScript Usage Example
```typescript
import { fetchApi } from '@/services/api.service';

// Fetch authenticated profile
const profile = await fetchApi('/users/me', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```
