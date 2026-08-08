# SkillDNA AI Database Migration Documentation

This directory contains database migration policy documentation, SQL templates, example migration scripts, baseline snapshots, and shell automation scripts for managing zero-downtime database schema updates in PostgreSQL.

## Directory Overview
* `migration-policy.md`: Zero-downtime migration guidelines and rules.
* `migration-template.sql`: Standard SQL template for forward migrations.
* `rollback-template.sql`: Standard SQL template for backward rollback migrations.
* `baseline/`: Initial database schema baseline definition.
* `examples/`: Reference SQL examples for common schema alterations.
* `scripts/`: Shell automation scripts for CI/CD database deployments.
