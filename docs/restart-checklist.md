# 관리자 재시작 체크리스트

## DB 먼저 띄우기 (Docker)

```bash
cd /home/joyui/workspace/mm-manage-mono
chmod +x scripts/start-mm-db.sh
./scripts/start-mm-db.sh
```

DB까지 띄우고 Prisma 스키마 반영까지 같이 하려면:

```bash
cd /home/joyui/workspace/mm-manage-mono
./scripts/start-mm-db.sh --migrate
```

`DATABASE_URL`은 기본적으로 `postgresql://mm_user:mm_password@localhost:5432/mm_manage`로 맞춰집니다.  
이미 `.env`에 `user:password` 기본값이 들어있으면 스크립트가 Docker 기본값으로 자동 교체합니다.

## 새 터미널에서 바로 실행 (권장)

1) `.env` 준비
- `cp -n .env.example .env`
- Prisma 클라이언트 생성(최초 1회 또는 설치 직후)
  - `export HOME=/tmp`
  - `export XDG_DATA_HOME=/tmp/.xdg`
  - `pnpm --filter @mm/prisma db:client:generate`

2) DB 반영 + 앱 시작(한 번에)

```bash
cd /home/joyui/workspace/mm-manage-mono
chmod +x scripts/start-mm-local.sh
./scripts/start-mm-local.sh
```

동일한 DB를 유지하면서 과거 스키마에서 `password` 컬럼만 존재하는 경우에는 다음처럼 실행하세요.

```bash
cd /home/joyui/workspace/mm-manage-mono
chmod +x scripts/start-mm-db.sh
./scripts/start-mm-db.sh --migrate --repair-auth
```

3) 또는 터미널을 2개로 나눠서 실행
- 터미널 A

```bash
cd /home/joyui/workspace/mm-manage-mono
export HOME=/tmp
export XDG_DATA_HOME=/tmp/.xdg
pnpm --filter @mm/api dev
```

- 터미널 B

```bash
cd /home/joyui/workspace/mm-manage-mono
export HOME=/tmp
export XDG_DATA_HOME=/tmp/.xdg
pnpm --filter @mm/web dev
```

4) DB 반영만 먼저 하고 싶다면

```bash
cd /home/joyui/workspace/mm-manage-mono
export HOME=/tmp
export XDG_DATA_HOME=/tmp/.xdg
pnpm --filter @mm/prisma db:push
```

1) Codex 종료/재시작 시 실행 전 복구
- 작업 위치: `/home/joyui/workspace/mm-manage-mono`
- `export HOME=/tmp`
- `export XDG_DATA_HOME=/tmp/.xdg`
- `pnpm -v` 확인(현재 기준 `10.13.1` 표시)

2) 프로젝트 실행
- `pnpm install`
- `pnpm --filter @mm/api dev`
- `pnpm --filter @mm/web dev`

3) 서비스 확인
- API: `http://localhost:4000/api/health`
- Swagger: `http://localhost:4000/api/docs`
- Web: `http://localhost:3000`

문제 재발 시:
- WSL/윈도우 권한 문제이면 터미널을 관리자권한으로 다시 실행
- `pnpm` 동작이 안 되면 위 환경변수 순서를 다시 실행
- `tsx watch` 실행 중 `listen EPERM`가 반복되면 시작하기 전에 다음을 먼저 설정:
  - `export TMPDIR=/tmp/tsx`
  - `mkdir -p "$TMPDIR"`

## 인증 헤더 규약 (임시 MVP)

- 현재 API는 최소 권한 확인을 위해 아래 헤더를 사용합니다.
  - 권장/필수 헤더: `x-user-role`
  - 권장 헤더: `x-user-id`, `x-org-id`
- 웹은 `apps/web/src/lib/api.ts`에서 기본값을 채워서 전송합니다.
  - `MM_DEMO_USER_ID`
  - `MM_DEMO_ORG_ID`
  - `MM_DEMO_USER_ROLE`
- 개발 편의를 위해 기본값이 적용됩니다.
  - `x-user-id` 미지정 시 개발 모드에서 `dev-user`
  - `x-org-id` 미지정 시 `seed-org-id`
  - `x-user-role` 미지정 시 `member`
- 운영 전에는 프론트엔드에서 실제 인증 소스(로그인 세션/토큰) 기반으로 치환하세요.

예시 호출:

```bash
curl -H "x-user-id: demo-user" -H "x-user-role: owner" -H "x-org-id: seed-org-id" \\
  http://localhost:4000/api/dashboard/kpi
```
