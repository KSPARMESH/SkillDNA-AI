# Database Migration & Schema Maintenance Policy

## 1. Zero-Downtime Migration Principles
1. **Never Drop Columns in a Single Release**: Use a 2-phase deployment (Deprecate -> Drop).
2. **Add Columns as Nullable First**: New columns must either be nullable or have a safe `DEFAULT` value.
3. **Concurrent Indexing**: Always create non-blocking indexes in production using `CREATE INDEX CONCURRENTLY`.
4. **Idempotency**: All SQL migration statements must be re-runnable (`IF NOT EXISTS`, `IF EXISTS`).

## 2. Backward Compatibility
Every schema change must be accompanied by a tested rollback script stored in `migrations/rollback-template.sql`.
