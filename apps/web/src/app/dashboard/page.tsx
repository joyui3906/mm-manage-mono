import { callApi, getApiErrorMessage } from "../../lib/api";

type DashboardKpi = {
  projectProgress: number;
  activeAssignments: number;
  pendingAssignments: number;
  totalTasks: number;
  doneTasks: number;
};

async function loadDashboard() {
  return callApi<DashboardKpi>("/dashboard/kpi", { cache: "no-store" });
}

export default async function DashboardPage() {
  let data: DashboardKpi = {
    projectProgress: 0,
    activeAssignments: 0,
    pendingAssignments: 0,
    totalTasks: 0,
    doneTasks: 0,
  };
  let errorMessage: string | undefined;

  try {
    data = await loadDashboard();
  } catch (error) {
    errorMessage = getApiErrorMessage(error);
  }

  if (errorMessage) {
    return (
      <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <h1 style={{ fontSize: 28, marginBottom: 16 }}>대시보드</h1>
        <p style={{ color: "#b91c1c" }}>{errorMessage}</p>
      </main>
    );
  }

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
