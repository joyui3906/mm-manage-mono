import { callApi, getApiErrorMessage } from "../../lib/api";
import { DataTable, type TableColumn } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { FormField } from "../../components/ui/FormField";

type DashboardKpi = {
  projectProgress: number;
  activeAssignments: number;
  pendingAssignments: number;
  totalTasks: number;
  doneTasks: number;
  unassignedTasks: number;
  month: string;
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
  monthlyUtilization: Array<{
    userId: string;
    name: string;
    email: string;
    assignedHours: number;
    capacityHours: number;
    utilizationPercent: number;
    isOverCapacity: boolean;
  }>;
};

async function loadDashboard(month?: string) {
  const query = new URLSearchParams();
  if (month) {
    query.set("month", month);
  }
  const suffix = query.toString();
  return callApi<DashboardKpi>(`/dashboard/kpi${suffix ? `?${suffix}` : ""}`, { cache: "no-store" });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: {
    month?: string;
    error?: string;
  };
}) {
  let data: DashboardKpi = {
    projectProgress: 0,
    activeAssignments: 0,
    pendingAssignments: 0,
    totalTasks: 0,
    doneTasks: 0,
    unassignedTasks: 0,
    month: "",
    unassignedTasksList: [],
    overloadedCount: 0,
    overloadedUsers: [],
    monthlyUtilization: [],
  };
  let errorMessage: string | undefined;

  try {
    data = await loadDashboard(searchParams?.month);
  } catch (error) {
    errorMessage = getApiErrorMessage(error);
  }

  const overloadedColumns: TableColumn<DashboardKpi["overloadedUsers"][number]>[] = [
    { key: "name", label: "이름", width: "200px" },
    { key: "email", label: "이메일", width: "260px" },
    { key: "plannedHours", label: "배정(h)", align: "right", width: "120px" },
    { key: "threshold", label: "임계치(h)", align: "right", width: "130px" },
  ];

  const unassignedColumns: TableColumn<DashboardKpi["unassignedTasksList"][number]>[] = [
    { key: "projectCode", label: "프로젝트", width: "130px" },
    { key: "taskTitle", label: "작업명", width: "320px" },
    { key: "projectName", label: "프로젝트명", width: "260px" },
  ];

  const utilizationColumns: TableColumn<DashboardKpi["monthlyUtilization"][number]>[] = [
    { key: "name", label: "이름", width: "190px" },
    { key: "email", label: "이메일", width: "260px" },
    { key: "assignedHours", label: "투입(h)", align: "right", width: "100px" },
    { key: "capacityHours", label: "가용(h)", align: "right", width: "100px" },
    { key: "utilizationPercent", label: "가동률", align: "right", width: "110px" },
  ];

  if (errorMessage) {
    return (
      <main>
        <h1 className="page-title">대시보드</h1>
        <p className="page-message-error">{errorMessage}</p>
      </main>
    );
  }

  return (
    <main>
      <h1 className="page-title">대시보드</h1>
      <form method="get" action="/dashboard" className="toolbar" style={{ alignItems: "flex-end" }}>
        <FormField label="월">
          <input type="month" name="month" defaultValue={data.month || searchParams?.month || ""} />
        </FormField>
        <button type="submit" className="btn btn-secondary">
          조회
        </button>
      </form>
      <section className="panel-grid">
        <p>조회월: {data.month || "현재 월"}</p>
        <p>프로젝트 진행률: {data.projectProgress}%</p>
        <p>활성 배정: {data.activeAssignments}</p>
        <p>승인 대기: {data.pendingAssignments}</p>
        <p>총 작업: {data.totalTasks}</p>
        <p>미배정 작업: {data.unassignedTasks}</p>
      </section>

      {data.overloadedCount > 0 ? (
        <section style={{ marginTop: 16 }} className="panel">
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>경고: 초과 배정</h2>
          <DataTable
            columns={overloadedColumns}
            rows={data.overloadedUsers}
            emptyText="초과 배정 사용자 없음"
            renderCell={(user, column) => {
              if (column.key === "name") {
                return user.name;
              }
              if (column.key === "email") {
                return user.email;
              }
              if (column.key === "plannedHours") {
                return <span>{user.plannedHours}</span>;
              }
              if (column.key === "threshold") {
                return <span>{user.threshold}</span>;
              }
              return null;
            }}
          />
        </section>
      ) : null}

      {data.unassignedTasks > 0 ? (
        <section className="panel">
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>미배정 작업 경고</h2>
          <DataTable
            columns={unassignedColumns}
            rows={data.unassignedTasksList}
            emptyText="미배정 작업이 없습니다."
            renderCell={(task, column) => {
              if (column.key === "projectCode") {
                return task.projectCode;
              }
              if (column.key === "taskTitle") {
                return task.taskTitle;
              }
              if (column.key === "projectName") {
                return task.projectName;
              }
              return null;
            }}
          />
          {data.unassignedTasks > data.unassignedTasksList.length ? (
            <p style={{ color: "#64748b", marginTop: 8 }}>
              미배정 작업이 {data.unassignedTasks}건 있습니다.
            </p>
          ) : null}
        </section>
      ) : null}
      <section className="panel">
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>개인 월별 투입 추적 ({data.month || "현재 월"})</h2>
        <DataTable
          columns={utilizationColumns}
          rows={data.monthlyUtilization}
          emptyText="데이터가 없습니다."
          renderCell={(user, column) => {
            if (column.key === "name") {
              return user.name;
            }
            if (column.key === "email") {
              return user.email;
            }
            if (column.key === "assignedHours") {
              return <span>{user.assignedHours}</span>;
            }
            if (column.key === "capacityHours") {
              return <span>{user.capacityHours}</span>;
            }
            if (column.key === "utilizationPercent") {
              return (
                <StatusBadge variant={user.isOverCapacity ? "danger" : "ok"}>
                  {`${user.utilizationPercent}%`}
                </StatusBadge>
              );
            }
            return null;
          }}
        />
      </section>

      <section style={{ marginTop: 16 }}>
        <p className="muted">
          임계치: 사용자 승인 배정 합계 {data.overloadedUsers?.[0]?.threshold ?? 160}h 초과시 경고
        </p>
      </section>
    </main>
  );
}
