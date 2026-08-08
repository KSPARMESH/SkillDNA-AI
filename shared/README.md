# SkillDNA AI Shared Package (`@skilldna/shared`)

This workspace package provides **universal, framework-independent** constants, enums, TypeScript interfaces, types, validators, and helper utilities shared across the SkillDNA AI monorepo (`frontend`, `backend`, `worker`, `database`, `scripts`).

## Architecture Rules
1. **Zero External Domain Dependencies**: This package must NOT import from `backend`, `frontend`, `database`, or `ai-engine`.
2. **Framework Agnostic**: Code must be runnable in both Node.js (V8) and Browser environments.
3. **Strict Type Safety**: Every exported type and interface must enforce strict type safety without using `any`.

## Folder Organization
* `constants/`: Global application, security, and scoring constants.
* `enums/`: Standardized system enums (Roles, Statuses, Categories).
* `types/`: Common API payloads, AI types, and primitive aliases.
* `interfaces/`: Entity data transfer objects (DTOs) and domain contracts.
* `helpers/`: Pure utility functions for dates, strings, and scoring math.
* `utils/`: Cross-platform logger and standardized application error classes.
* `validators/`: Pure JavaScript/TypeScript input validation rules.
* `config/`: Shared configuration constants.
