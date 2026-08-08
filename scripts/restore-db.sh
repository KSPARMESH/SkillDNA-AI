#!/bin/sh
if [ -z "$1" ]; then
  echo "Usage: ./scripts/restore-db.sh <backup-file.sql>"
  exit 1
fi
echo "🔄 Restoring SkillDNA PostgreSQL Database from $1..."
psql -U postgres -d skilldna_db < "$1"
echo "✅ Database Restored!"
