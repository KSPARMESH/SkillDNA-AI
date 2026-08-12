# SkillDNA AI - Platform Integrations Domain

The **Platform Integrations Domain** serves as the unified synchronization, normalization, and API connector engine for SkillDNA AI. It connects to external developer platforms, problem-solving platforms, technical identity networks, and content platforms, standardizing external metrics into common SkillDNA models.

---

## 🏛 Architecture

The domain is designed using enterprise design patterns:

1. **Adapter Pattern**: Standardizes external API calls across diverse provider signatures (`IPlatformAdapter`).
2. **Strategy / Factory Pattern**: Resolves platform adapters dynamically via `PlatformAdapterFactory`.
3. **Repository Pattern**: Separates database access (`IntegrationRepository`, `SyncRepository`, `WebhookRepository`) from domain business logic.
4. **Service Layer**: Manages integration flows, token encryption, normalization pipelines, and synchronization queues.
5. **Circuit Breaker & Backoff Engine**: Handles rate limits, exponential retries, and network errors gracefully.

---

## 🔌 Supported Platforms

| Platform           | Domain Type             | Auth / Connector Model  | Primary Data Extracted                                                 |
| ------------------ | ----------------------- | ----------------------- | ---------------------------------------------------------------------- |
| **GitHub**         | Code / Repositories     | OAuth 2.0 / REST API v3 | Public repos, stars, forks, commits, top languages, projects           |
| **LeetCode**       | Coding / DSA            | GraphQL API             | Solved counts (Easy/Med/Hard), ranking, reputation, badges             |
| **HackerRank**     | Coding / DSA            | REST Profile API        | Solved challenges, contest rating, badges                              |
| **Codeforces**     | Competitive Programming | REST API v2             | Solved problems count, contest rating, rank                            |
| **AtCoder**        | Competitive Programming | Problems API v3         | Accepted problems count, contest rating                                |
| **Kaggle**         | Data Science / AI       | Kaggle API / Token      | Competitions, datasets, notebooks, medals                              |
| **LinkedIn**       | Professional            | OAuth 2.0 REST API      | Headline, summary, experience, profile metadata                        |
| **Devpost**        | Hackathons              | REST API                | Hackathons attended, hackathon projects built                          |
| **Medium**         | Technical Writing       | RSS / REST API v1       | Published technical articles, titles, dates                            |
| **Stack Overflow** | Q&A Community           | Stack Exchange API v2.3 | Reputation, badge counts (gold/silver/bronze), answers/questions count |

---

## 🔐 Security & Encryption

- **OAuth Tokens**: All `accessToken` and `refreshToken` strings are encrypted at rest using AES-256-GCM (`encryptPayload` / `decryptPayload`).
- **Webhook Verification**: HMAC SHA-256 signature verification guards against forged requests.
- **Replay Protection**: The `WebhookRepository` tracks event IDs and timestamp signatures to block replay attacks.

---

## 📁 Folder Structure

```
backend/src/domains/integrations/
├── README.md
├── index.ts
├── adapters/
│   ├── base.adapter.ts
│   ├── github.adapter.ts
│   ├── leetcode.adapter.ts
│   ├── hackerrank.adapter.ts
│   ├── codeforces.adapter.ts
│   ├── atcoder.adapter.ts
│   ├── kaggle.adapter.ts
│   ├── linkedin.adapter.ts
│   ├── devpost.adapter.ts
│   ├── medium.adapter.ts
│   ├── stackoverflow.adapter.ts
│   └── adapter.factory.ts
├── controllers/
│   ├── github.controller.ts
│   ├── leetcode.controller.ts
│   ├── hackerrank.controller.ts
│   ├── codeforces.controller.ts
│   ├── atcoder.controller.ts
│   ├── kaggle.controller.ts
│   ├── linkedin.controller.ts
│   ├── devpost.controller.ts
│   ├── medium.controller.ts
│   ├── stackoverflow.controller.ts
│   ├── integration.controller.ts
│   ├── sync.controller.ts
│   └── webhook.controller.ts
├── dto/
│   ├── connect-platform.dto.ts
│   ├── disconnect-platform.dto.ts
│   ├── sync-request.dto.ts
│   └── webhook.dto.ts
├── errors/
│   └── integration.errors.ts
├── interfaces/
│   └── integration.interface.ts
├── repositories/
│   ├── integration.repository.ts
│   ├── sync.repository.ts
│   └── webhook.repository.ts
├── routes/
│   ├── github.routes.ts
│   ├── integration.routes.ts
│   ├── sync.routes.ts
│   └── webhook.routes.ts
├── services/
│   ├── atcoder.service.ts
│   ├── codeforces.service.ts
│   ├── devpost.service.ts
│   ├── github.service.ts
│   ├── hackerrank.service.ts
│   ├── kaggle.service.ts
│   ├── leetcode.service.ts
│   ├── linkedin.service.ts
│   ├── medium.service.ts
│   ├── normalization.service.ts
│   ├── oauth.service.ts
│   ├── scheduler.service.ts
│   ├── stackoverflow.service.ts
│   ├── sync.service.ts
│   └── webhook.service.ts
├── tests/
│   ├── github.test.ts
│   ├── integration.test.ts
│   ├── sync.test.ts
│   └── webhook.test.ts
├── types/
│   └── integration.types.ts
└── validators/
    ├── integration.validator.ts
    └── webhook.validator.ts
```

---

## 🛠 Extension Guide: Adding a New Platform Connector

To add a new connector (e.g. `Behance`, `GitLab`, or `Bitbucket`):

1. **Add Enum**: Add the platform string key to `PlatformType` in `shared/enums/platform.enum.ts` and `schema.prisma`.
2. **Create Adapter**: Implement `IPlatformAdapter` in `adapters/newplatform.adapter.ts`.
3. **Register in Factory**: Add the instance in `PlatformAdapterFactory.initialize()` inside `adapters/adapter.factory.ts`.
4. **Create Service**: Add `services/newplatform.service.ts` for domain orchestration.
5. **Create Controller & Route**: Add endpoints for connection or platform sync.
