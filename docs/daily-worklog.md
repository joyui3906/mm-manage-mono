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
