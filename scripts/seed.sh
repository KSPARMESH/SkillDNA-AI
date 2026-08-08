#!/bin/sh
echo "🌱 Seeding SkillDNA AI Database..."
pnpm --filter database db:seed
