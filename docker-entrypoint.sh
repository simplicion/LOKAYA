#!/bin/sh
set -e

echo "Starting Lokaya Unified Backend Production Container..."

# Sync database schema with live database if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "Verifying and syncing database schema with Prisma..."
  (cd /app/packages/db && npx prisma db push --skip-generate) || {
    echo "Warning: Prisma db push completed with warnings, proceeding with server launch..."
  }
fi

echo "Executing command: $@"
exec "$@"
