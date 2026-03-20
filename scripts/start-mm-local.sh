#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/home/joyui/workspace/mm-manage-mono"
export HOME=/tmp
export XDG_DATA_HOME=/tmp/.xdg

cd "$PROJECT_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

./scripts/start-mm-db.sh --migrate
pnpm dev
