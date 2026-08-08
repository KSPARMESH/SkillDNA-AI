#!/bin/sh
echo "🧪 Running CI Quality Assurance Tests..."
pnpm run lint
pnpm run typecheck
