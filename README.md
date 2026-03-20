# 인력 공수 관리 모노레포

이 저장소는 **1인 개발 + 빠른 MVP + 인수인계 용이성**을 목표로 하는 인력 공수 관리 서비스의 시작점입니다.

## 기술 스택

- 모노레포: `pnpm` + `Turborepo`
- 프론트엔드: `Next.js` + `TypeScript` + `Tailwind CSS` + `TanStack Query`
- 백엔드: `NestJS`(도메인 분리, 확장성 우선)
- DB: `PostgreSQL` + `Prisma`
- 인증: `NextAuth` or `Auth.js`
- 배포: Vercel / Railway(FastAPI-like if split) / Docker-compatible targets

## Monorepo 구조

- `apps/web` : 대시보드 및 운영 UI
- `apps/api` : REST API (NestJS)
- `libs/shared` : 타입/공통 상수/zod 스키마/권한 enum
- `libs/prisma` : Prisma 스키마 및 유틸

## 목표 MVP (4주)

- 1주차: 핵심 데이터 구조 정리, 인증/사용자/권한, 프로젝트·작업 CRUD, 공수 입력
- 2주차: 대시보드 핵심 지표(총 배정률, 프로젝트 진행률), 알림 규칙(초과/미할당)
- 3주차: 승인 워크플로우, 변경 이력, CSV 내보내기
- 4주차: 권한 보완, UX 다듬기, 운영 문서 정리 및 테스트 보강

## 설치/실행

```bash
pnpm install
pnpm dev
```

서버/클라이언트를 동시에 띄웁니다.

- `apps/api`의 기본 포트: `4000`
- `apps/web`의 기본 포트: `3000`

환경 변수는 `.env.example`을 복사해서 사용합니다.

```bash
cp .env.example .env
```

이 환경(윈도우/WSL + Corepack)에서는 `pnpm`이 기본적으로 쓰기 불가 경로를 참조할 수 있어 버전 핀 확인이 실패할 수 있습니다. 실행은 아래처럼 홈 경로를 분리해 주면 안정적입니다.

```bash
HOME=/tmp XDG_DATA_HOME=/tmp/.xdg pnpm -v
HOME=/tmp XDG_DATA_HOME=/tmp/.xdg pnpm install
```

## 관리자권한 재기동 시, 반드시 남겨둘 체크리스트

Codex를 종료했다가 다시 열더라도 위 작업 순서를 먼저 실행해야 즉시 재개 가능합니다.

1. 터미널에서 작업 루트 확인
   - `cd /home/joyui/workspace/mm-manage-mono`
2. 환경 변수 적용
   - `export HOME=/tmp`
   - `export XDG_DATA_HOME=/tmp/.xdg`
3. pnpm 동작 점검
   - `pnpm -v` (정상: `10.13.1`)
4. 필요 시 `.env` 확인
   - `cp .env.example .env` (기존 파일 없을 때만)
5. 의존성 설치
   - `pnpm install`
6. 앱 실행
   - `pnpm --filter @mm/api dev`
   - `pnpm --filter @mm/web dev`

### 빠른 재개 한 줄(원하면 복붙)

```bash
cd /home/joyui/workspace/mm-manage-mono && export HOME=/tmp && export XDG_DATA_HOME=/tmp/.xdg && pnpm -v
```

더 자세한 항목은 [docs/restart-checklist.md](/home/joyui/workspace/mm-manage-mono/docs/restart-checklist.md)를 참고하세요.

## 실행 순서

1. PostgreSQL 접속 가능 URL 준비(`DATABASE_URL`)
2. Prisma 스키마 반영
   - `cd libs/prisma`
   - `pnpm db:push` 또는 `pnpm db:migrate`
3. API 실행: `cd apps/api && pnpm dev`
4. UI 실행: `cd apps/web && pnpm dev`

## 인수인계 포인트

- 핵심 도메인 스키마: `libs/prisma/prisma/schema.prisma`
- 공통 타입: `libs/shared/src/index.ts`
- API 엔드포인트: `apps/api/src/modules`
- MVP 우선순위: `docs/mvp-backlog.md`

현재 상태는 MVP 초안이므로, 1차 출시 전에 다음 항목만 추가하면 안정화됩니다.

- 인증/권한 가드
- 조직 단위 유효성 검증
- API 응답 표준화(Error 형식, ValidationPipe, Zod)

현재 단계에서는 간단한 헤더 기반 임시 인증으로 운영됩니다.

- `x-user-role` (필수/기본값: `member`)
- `x-user-id` (개발 모드 기본값: `dev-user`)
- `x-org-id` (기본값: `seed-org-id`)

웹 임시 인증 헤더는 `apps/web/src/lib/api.ts`에서 기본값 환경변수로 읽습니다.

- `MM_DEMO_USER_ID`
- `MM_DEMO_ORG_ID`
- `MM_DEMO_USER_ROLE`
