import { callApi, getApiErrorMessage } from "../../lib/api";

type DashboardKpi = {
  projectProgress: number;
  activeAssignments: number;
  pendingAssignments: number;
  totalTasks: number;
  doneTasks: number;
  unassignedTasks: number;
  unassignedTasksList: Array<{
    taskId: string;
    taskTitle: string;
    projectCode: string;
    projectName: string;
  }>;
  overloadedCount: number;
  overloadedUsers: Array<{
    userId: string;
    name: string;
    email: string;
    plannedHours: number;
    threshold: number;
  }>;
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
    unassignedTasks: 0,
    unassignedTasksList: [],
    overloadedCount: 0,
    overloadedUsers: [],
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
        <p>미배정 작업: {data.unassignedTasks}</p>
      </section>

      {data.overloadedCount > 0 ? (
        <section style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>경고: 초과 배정</h2>
          <ul style={{ display: "grid", gap: 4 }}>
            {data.overloadedUsers.map((user) => (
              <li key={user.userId}>
                {user.name} ({user.email}) - 배정 {user.plannedHours}h / 임계치 {user.threshold}h
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.unassignedTasks > 0 ? (
        <section style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>미배정 작업 경고</h2>
          <ul style={{ display: "grid", gap: 4 }}>
            {data.unassignedTasksList.map((task) => (
              <li key={task.taskId}>
                [{task.projectCode}] {task.taskTitle} / {task.projectName}
              </li>
            ))}
          </ul>
          {data.unassignedTasks > data.unassignedTasksList.length ? (
            <p style={{ color: "#64748b", marginTop: 8 }}>
              미배정 작업이 {data.unassignedTasks}건 있습니다.
            </p>
          ) : null}
        </section>
      ) : null}
      <section style={{ marginTop: 16 }}>
        <p style={{ color: "#64748b" }}>
          임계치: 사용자 승인 배정 합계 {data.overloadedUsers?.[0]?.threshold ?? 160}h 초과시 경고
        </p>
      </section>
    </main>
  );
}
