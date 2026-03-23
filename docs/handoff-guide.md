# 인수인계 가이드

## 먼저 확인할 것

1. `.env` 값 확인 (`DATABASE_URL`, `NEXT_PUBLIC_API_BASE_URL`)
2. API 문서(스웨거): `http://localhost:4000/api/docs`
3. PostgreSQL 연결 후 `libs/prisma/prisma/schema.prisma` 마이그레이션
   - 회원가입 시 `User.passwordHash`가 없다는 에러가 난다면 다음을 먼저 실행:
     - `./scripts/start-mm-db.sh --migrate --repair-auth`
4. API 실행 전 Prisma 클라이언트 생성
   - `pnpm --filter @mm/prisma db:client:generate`
3. API 실행: `apps/api`
4. Web 실행: `apps/web`

## 핵심 파일

- 도메인 엔티티/권한: `libs/shared/src/index.ts`
- DB 모델: `libs/prisma/prisma/schema.prisma`
- 프로젝트/작업 API: `apps/api/src/modules/projects`
- 공수/배정 API: `apps/api/src/modules/timesheets`
- 대시보드 API: `apps/api/src/modules/dashboard`
- 초기 화면: `apps/web/src/app/{dashboard,page,projects,timesheets}`
- API 인증/권한: `apps/api/src/common/auth`, `apps/api/src/common/types/current-user.ts`

## 운영 가드레일(권장)

- API DTO validation: Zod + 공용 유효성 스키마
- 인증 미들웨어: `x-user-role` 기반의 Owner/Manager/Member 역할 검사
- CI: 린트 + 타입체크 + 최소 E2E 2개
