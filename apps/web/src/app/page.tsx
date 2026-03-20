import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>인력 공수 관리 MVP</h1>
      <p style={{ marginBottom: 24 }}>빠른 확장용 모노레포 시작 템플릿입니다.</p>
      <ul style={{ display: "grid", gap: 8 }}>
        <li>
          <Link href="/dashboard">대시보드</Link>
        </li>
        <li>
          <Link href="/projects">프로젝트</Link>
        </li>
        <li>
          <Link href="/timesheets">공수 입력</Link>
        </li>
      </ul>
    </main>
  );
}
