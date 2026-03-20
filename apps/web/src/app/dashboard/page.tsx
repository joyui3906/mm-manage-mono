import { callApi } from "../../lib/api";

export default async function DashboardPage() {
  const data = await callApi<{
    projectProgress: number;
    activeAssignments: number;
    pendingAssignments: number;
    totalTasks: number;
    doneTasks: number;
  }>("/dashboard/kpi", { cache: "no-store" });

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>대시보드</h1>
      <section style={{ display: "grid", gap: 8 }}>
        <p>프로젝트 진행률: {data.projectProgress}%</p>
        <p>활성 배정: {data.activeAssignments}</p>
        <p>승인 대기: {data.pendingAssignments}</p>
        <p>총 작업: {data.totalTasks}</p>
      </section>
    </main>
  );
}
