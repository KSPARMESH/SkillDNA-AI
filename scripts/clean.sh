#!/bin/sh
echo "🧹 Cleaning SkillDNA AI Monorepo Build Artifacts & Caches..."
pnpm run clean || true
rm -rf node_modules .next dist coverage || true
echo "✨ Workspace Clean Complete!"
