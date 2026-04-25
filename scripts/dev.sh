#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Yashil Quest Docker'siz dev mode"
echo "1-terminal: npm run dev:backend"
echo "2-terminal: npm run dev:frontend"
echo "Ixtiyoriy CV: npm run dev:cv"
