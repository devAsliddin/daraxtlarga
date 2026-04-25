#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
fi

cp .env backend/.env

echo "Backend dependencies..."
(cd backend && npm install)

echo "Frontend dependencies..."
(cd frontend && npm install)

echo "Prisma generate..."
(cd backend && npm run prisma:generate)

echo "SQLite schema setup..."
(cd backend && npm run db:push)

echo "Seed..."
(cd backend && npm run prisma:seed)

mkdir -p uploads

echo ""
echo "Setup finished."
echo "Run:"
echo "  npm run dev:backend"
echo "  npm run dev:frontend"
echo "Optional CV:"
echo "  npm run dev:cv"
