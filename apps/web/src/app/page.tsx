import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1 className="page-title">인력 공수 관리 MVP</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        빠른 확장용 모노레포 시작 템플릿입니다.
      </p>
      <p style={{ marginBottom: 12 }}>바로 시작할 수 있는 핵심 경로</p>
      <ul className="panel-grid">
        <li>
          <Link href="/login" className="panel">
            로그인
          </Link>
        </li>
        <li>
          <Link href="/signup" className="panel">
            회원가입
          </Link>
        </li>
        <li>
          <Link href="/dashboard" className="panel">
            대시보드
          </Link>
        </li>
        <li>
          <Link href="/projects" className="panel">
            프로젝트
          </Link>
        </li>
        <li>
          <Link href="/timesheets" className="panel">
            공수 입력
          </Link>
        </li>
        <li>
          <Link href="/availability" className="panel">
            가용성 관리
          </Link>
        </li>
        <li>
          <Link href="/audit" className="panel">
            감사 로그
          </Link>
        </li>
        <li>
          <Link href="/users" className="panel">
            회원 관리
          </Link>
        </li>
      </ul>
    </main>
  );
}
