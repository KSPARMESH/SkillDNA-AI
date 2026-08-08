#!/bin/sh
echo "🚀 Setting up SkillDNA AI Monorepo Workspace..."
pnpm install
cp -n .env.example .env || true
pnpm --filter database db:generate
echo "✅ Setup Complete!"
