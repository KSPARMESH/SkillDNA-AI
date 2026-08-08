#!/bin/bash
echo 'Running database migrations...'
pnpm prisma migrate deploy
