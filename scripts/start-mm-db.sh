#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/home/joyui/workspace/mm-manage-mono"
DB_URL="postgresql://mm_user:mm_password@localhost:5432/mm_manage"

if ! command -v docker >/dev/null; then
  echo "docker가 없습니다. Docker Desktop/Engine이 설치되어 있지 않은지 확인해 주세요."
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null; then
  COMPOSE_CMD=(docker-compose)
else
  echo "docker compose 플러그인도, docker-compose 구버전도 없습니다."
  exit 1
fi

cd "$PROJECT_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
fi

if grep -q "^DATABASE_URL=postgresql://user:password@localhost:5432/mm_manage$" .env; then
  sed -i "s|^DATABASE_URL=.*$|DATABASE_URL=$DB_URL|" .env
fi

RUN_MIGRATE="${1:-}"

if [ "${RUN_MIGRATE}" = "--migrate" ]; then
  echo "DB 컨테이너 시작 + 스키마 반영"
else
  echo "DB 컨테이너 시작"
fi

"${COMPOSE_CMD[@]}" up -d mm-postgres >/dev/null

echo "PostgreSQL 준비 대기 중..."
for i in {1..30}; do
  if [ "${COMPOSE_CMD[0]}" = "docker" ]; then
    if docker compose exec -T mm-postgres pg_isready -U mm_user -d mm_manage >/dev/null 2>&1; then
      READY=1
      break
    fi
  else
    if docker-compose exec -T mm-postgres pg_isready -U mm_user -d mm_manage >/dev/null 2>&1; then
      READY=1
      break
    fi
  fi
  sleep 1
done

if [ "${READY:-0}" != "1" ]; then
  echo "DB가 30초 내에 준비되지 않았습니다. 컨테이너 상태를 확인하세요."
  exit 1
fi

if [ "${RUN_MIGRATE}" = "--migrate" ]; then
  export HOME=/tmp
  export XDG_DATA_HOME=/tmp/.xdg
  DATABASE_URL="$DB_URL" pnpm --filter @mm/prisma db:push
  echo "db:push 완료"
fi

echo "DB 상태: up (컨테이너: mm-postgres, DB: mm_manage)"
echo "접속: psql \"$DB_URL\""
