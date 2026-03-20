import Link from "next/link";
import { redirect } from "next/navigation";
import { callApi } from "../../../lib/api";
import { canWriteProject, getAuthContext } from "../../../lib/auth";

type Task = {
  id: string;
  title: string;
  plannedHours: number;
  status: string;
  dueDate: string | null;
};

type Project = {
  id: string;
  name: string;
  code: string;
  status: string;
  budgetHours: number;
  startDate: string | null;
  endDate: string | null;
  tasks: Task[];
};

async function loadProject(projectId: string): Promise<Project> {
  return callApi(`/projects/${projectId}`, { cache: "no-store" });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { projectId: string };
}) {
  const { role, userId } = getAuthContext();
  const project = await loadProject(params.projectId);

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>프로젝트 상세</h1>
      <p style={{ marginBottom: 16 }}>
        {project.name} ({project.code}) / 상태: {project.status}
      </p>
      <p style={{ marginBottom: 24 }}>
        예산 공수: {project.budgetHours}h / 기간: {project.startDate ?? "-"} ~ {project.endDate ?? "-"}
      </p>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>작업 목록</h2>
        <ul style={{ display: "grid", gap: 8 }}>
          {project.tasks.map((task) => (
            <li key={task.id}>
              {task.title} - 예정 {task.plannedHours}h / 상태 {task.status}
              {task.dueDate ? ` / 마감 ${task.dueDate.slice(0, 10)}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section>
        {canWriteProject(role) ? (
          <Link href={`/projects/${project.id}/tasks/new`}>작업 등록</Link>
        ) : null}
      </section>

      {!canWriteProject(role) ? (
        <p style={{ marginTop: 16, color: "#64748b" }}>
          공수 입력은 로그인 사용자 ID({userId})를 기준으로 가능합니다.
        </p>
      ) : null}
    </main>
  );
}

