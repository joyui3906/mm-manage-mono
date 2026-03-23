# 일자별 작업 기록

## 2026-03-20

- 한 일
  - API 예외 응답 공통화 필터 추가 (`ApiExceptionFilter`).
  - API 입력값 유효성 검사 유틸(`parseBody`)와 Zod 스키마 기반 본문 검증 적용.
  - 프로젝트/타임시트 컨트롤러 생성/등록 API에 검증 적용.
  - `@mm/api`에 `zod` 의존성 추가 및 빌드 산출 반영.
  - timesheets 승인/반려 API 추가 (`POST /timesheets/assignments/:id/reject`).
  - `timesheets` 화면에 배정 목록 + 승인/반려 액션 추가.
  - 배정 생성 화면 추가(`/timesheets/assignments/new`) 및 사유(reason) 입력 지원.
  - 배정 취소 API/UX 추가 (`POST /timesheets/assignments/:id/cancel` + 취소 버튼).
  - 웹/API 타입체크 및 빌드 통과 확인.
- 이슈 처리/운영 보완
  - `pnpm install` 및 WSL/도커 관련 환경에서의 재실행/접속 정리.
  - GitHub 업로드 후 재개/인수인계 관련 접근성 이슈 정리.
- 미완료/다음 예정
  - `.dist`/`.idea` 추적 분리 정리(.gitignore 보강) 완료.
  - 프로젝트/작업 수정 및 삭제 API 추가.
  - 에러 응답을 웹 UI에서 사용자 메시지로 렌더링.

## 2026-03-21 이후 기록 양식

- 한 일
  - (날짜별로 실제 수행 내용 작성)
- 미완료/다음 예정
  - (다음 단계)

## 2026-03-23

- 한 일
  - 프로젝트 API에 수정/삭제 추가 (`PATCH/DELETE /projects/:projectId`, `PATCH/DELETE /projects/:projectId/tasks/:taskId`).
  - 프로젝트 수정 페이지(``/projects/:projectId/edit``) 및 작업 수정 페이지(``/projects/:projectId/tasks/:taskId/edit``) 추가.
  - 프로젝트 상세에서 프로젝트/작업 삭제 액션 노출.
  - 웹 공통 API 클라이언트(`callApi`) 에러 파싱 개선 및 `ApiRequestError` 반영.
  - 타임시트/프로젝트/대시보드/생성 폼에서 API 오류 메시지 렌더링 처리.
  - 대시보드 KPI를 확장해 미배정 작업 수, 초과 배정 사용자 경고를 노출.
  - 인증 가드에 조직 단위 사용자 유효성 검증을 추가 (`AuthGuard`에서 사용자 존재/조직 일치/활성 상태 검사).
  - 타임시트 CSV export API 추가 (`GET /timesheets/export`) 및 웹 다운로드 라우트/버튼 연결.
  - 변경 이력(audit log) 모델/엔티티 추가 및 백엔드 감사 로그 API 구현 (`GET /audit`).
  - 프로젝트/타임시트 핵심 쓰기 동작에 감사 로그 기록 주입.
  - 감사 로그 조회 웹 화면(`/audit`) 추가 및 홈 메뉴 노출.
  - Prisma generate 후 API/Web 타입체크 완료.
  - `.gitignore` 정비로 `.dist/.idea/node_modules/.next` 등 산출물 무시 정책 보강.
  - 대시보드 조직 조회 파라미터 제거해 조직 간 KPI 조회 가능성 차단.
  - 프로젝트 생성 오너 사용자 조직 경계 강제(`ownerUserId`가 다른 조직이면 생성 차단).
  - 프로젝트 수정 시 오너 사용자 조직 경계를 재검증해 타 조직 사용자로의 오너 변경을 차단.
  - 프로젝트 작업 목록 조회도 조직 소속 검증 후 반환하도록 강화.
  - 사용자 가용성 API(`/availability`) 추가: 일별 가용시간 CRUD(조직/권한 경계 포함).
- 대시보드 월별 개인 투입 추적(`monthlyUtilization`) 추가 및 `/dashboard/kpi` 월 파라미터 지원.
- 가용성 관리 화면(`/availability`) 및 홈 메뉴 연동.
- 회원가입 500 에러의 원인이 DB 스키마 불일치(`User.passwordHash` 누락)로 확인되어, 스크립트 레벨 정합성 복구 흐름을 추가.
- 사용자 관리 API(`/users`) 추가:
    - `GET /users`, `POST /users`, `PATCH /users/:userId`, `DELETE /users/:userId`
    - 회원 등록/수정/비활성화 화면(`/users`) 추가 및 홈 메뉴 노출.
    - 비활성 사용자의 타임시트 배정/입력 제어 적용.
  - 사용자 변경 이력 감사 로그(`user.create`, `user.update`, `user.deactivate`) 기록.
  - 회원 목록 조회 고도화:
    - `GET /users` 필터 파라미터(`isActive`, `role`, `teamId`, `q`, `userId`) 지원.
    - 팀 목록 API(`GET /users/teams`) 추가 및 회원 목록 필터 UI 연동.
  - 회원 등록/수정 폼의 팀 입력을 팀명 드롭다운으로 교체 (`teams` 목록 기반).
  - 사용자 API 통합 스크립트(`apps/api/scripts/integration/users-api.test.mjs`) 추가 (`pnpm --filter @mm/api test:users-it`).
  - 웹/API 타입체크 통과 (`@mm/web`, `@mm/api`).
- 인증 라우트(회원가입/로그인) `service` 바인딩 실패로 인한 `Cannot read properties of undefined (reading 'signup')` 500을 우회하고 진단성을 높이기 위해 `AuthController`에서 서비스 resolve fallback 및 예외 로그 추가.
- 예외 응답 필터에 개발 모드 stack/details 노출 보강.
- 이슈 로그(3/23)
  - 증상: `pnpm --filter @mm/api dev` 실행 시 일부 요청에서 `500`과 함께 `Cannot read properties of undefined` 또는 `... was not provided by Nest DI`가 반복 발생.
    - 예시
      - `ProjectsService constructor: AuditService was not provided by Nest DI`
      - `DashboardController constructor: DashboardService was not provided by Nest DI`
      - `Cannot read properties of undefined (reading 'signup')`
      - `Cannot read properties of undefined (reading 'getAllAndOverride')` 등
  - 원인 분석:
    - 소스 컴파일(`tsc`)은 통과했으나 `tsx` 런타임 실행 시 Nest DI 메타데이터 해석이 불안정하여 타입 기반 주입이 일부에서 `undefined`로 해석되는 패턴 발생.
    - 특히 `providers`와 임포트 조합만으로는 런타임 주입 보장이 불완전해 일부 모듈에서 `service` 주입 실패.
  - 조치:
    - 핵심 서비스/컨트롤러 생성자에 `@Inject(...)` 토큰 명시 주입을 추가해 주입 경로를 고정.
    - 대상 범위: `ProjectsService`, `UsersService`, `TimesheetsService`, `AuthService`, `DashboardController`, `UsersController`, `TimesheetsController`, `ProjectsController`, `AvailabilityController`, `AuditController`.
    - 모듈/서비스 바인딩 중복/누락 포인트 재검토 후 정리.
  - 결과:
    - `pnpm --filter @mm/api typecheck` 통과 유지.
    - 재실행 시 DI constructor 에러 종료.
    - `@mm/api dev`가 정상 기동되어 라우트 등록 후 `API server running on http://localhost:4000/api` 로그 확인.
- 화면 작업 시작(3/23)
  - 웹 공통 레이아웃(`AppShell`) 적용으로 사이드바/헤더/내비게이션을 통일.
  - 전역 스타일(`globals.css`) 업데이트: 카드/폼/버튼/툴바/에러 텍스트 토큰.
  - 홈/로그인/회원가입/대시보드/프로젝트/타임시트/가용성/감사로그/회원 관리 화면에서 공통 타이틀·오류 표시 패턴 정비.
  - 로그인/회원가입 및 주요 폼 화면을 `FormField` 공통 컴포넌트로 통일.
  - `AppShell`에서 인증 상태를 판별해 게스트/로그인 모드 네비게이션을 분기 처리:
    - 게스트: 홈 + 로그인/회원가입.
    - 로그인: 홈 + 대시보드/프로젝트/공수/가용성 + 권한 기반 메뉴.
  - 로그아웃 버튼을 서버 액션으로 처리하고 쿠키 기반 세션 정리 흐름 완료.
  - `401/403` 오류 응답에 대한 사용자 메시지 매핑을 `callApi`에서 적용.
  - 미인증 접근 차단 미들웨어(`apps/web/src/middleware.ts`)를 추가해 보호 라우트에서 로그인 리다이렉트 수행.
  - `pnpm --filter @mm/web typecheck`, `pnpm --filter @mm/web build`, `pnpm --filter @mm/api typecheck` 확인.
- 미완료/다음 예정
  - `.dist`/`.idea` 추적 정리(.gitignore 보강) 유지.
