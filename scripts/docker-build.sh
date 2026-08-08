#!/bin/sh
echo "🐳 Building SkillDNA Docker Containers..."
docker build -t skilldna-backend:latest -f infrastructure/docker/Dockerfile.backend .
docker build -t skilldna-frontend:latest -f infrastructure/docker/Dockerfile.frontend .
