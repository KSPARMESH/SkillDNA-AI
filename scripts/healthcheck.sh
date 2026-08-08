#!/bin/sh
echo "🩺 Checking SkillDNA AI System Health..."
curl -s http://localhost:5000/health || echo "⚠️ Backend HTTP Server Unreachable"
nc -z localhost 5432 && echo "✅ PostgreSQL 16 Online (5432)" || echo "⚠️ PostgreSQL Offline"
nc -z localhost 6379 && echo "✅ Redis 7 Online (6379)" || echo "⚠️ Redis Offline"
