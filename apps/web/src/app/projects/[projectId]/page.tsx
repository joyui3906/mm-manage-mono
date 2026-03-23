import Link from "next/link";
import { redirect } from "next/navigation";
import { callApi, getApiErrorMessage } from "../../../lib/api";
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

const deleteProject = async (projectId: string) => {
  "use server";

  try {
    await callApi(`/projects/${projectId}`, {
      method: "DELETE",
    });
  } catch (error) {
    const message = getApiErrorMessage(error);
    redirect(`/projects/${projectId}?error=${encodeURIComponent(message)}`);
  }

  redirect("/projects");
};

const deleteTask = async (projectId: string, taskId: string) => {
  "use server";

  try {
    await callApi(`/projects/${projectId}/tasks/${taskId}`, {
      method: "DELETE",
    });
  } catch (error) {
    const message = getApiErrorMessage(error);
    redirect(`/projects/${projectId}?error=${encodeURIComponent(message)}`);
  }

  redirect(`/projects/${projectId}`);
};

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: { projectId: string };
  searchParams?: {
    error?: string;
  };
}) {
  const { role, userId } = getAuthContext();
  let errorMessage: string | undefined;
  let project: Project | undefined;

  try {
    project = await loadProject(params.projectId);
  } catch (error) {
    errorMessage = getApiErrorMessage(error);
  }

  if (!project) {
    return (
      <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <h1 style={{ fontSize: 28, marginBottom: 16 }}>프로젝트 상세</h1>
        <p style={{ color: "#b91c1c" }}>{errorMessage ?? "프로젝트를 불러올 수 없습니다."}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>프로젝트 상세</h1>
      <p style={{ marginBottom: 16 }}>
        {project.name} ({project.code}) / 상태: {project.status}
      </p>
      <p style={{ marginBottom: 24 }}>
        예산 공수: {project.budgetHours}h / 기간: {project.startDate ?? "-"} ~ {project.endDate ?? "-"}
      </p>
      {searchParams?.error ? <p style={{ color: "#b91c1c" }}>{searchParams.error}</p> : null}

      {canWriteProject(role) ? (
        <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
          <Link href={`/projects/${project.id}/edit`}>프로젝트 수정</Link>
          <form action={() => deleteProject(project.id)}>
            <button type="submit">프로젝트 삭제</button>
          </form>
        </div>
      ) : null}

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>작업 목록</h2>
        <ul style={{ display: "grid", gap: 8 }}>
          {project.tasks.map((task) => (
            <li key={task.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>
                {task.title} - 예정 {task.plannedHours}h / 상태 {task.status}
                {task.dueDate ? ` / 마감 ${task.dueDate.slice(0, 10)}` : ""}
              </span>
              {canWriteProject(role) ? (
                <form action={() => deleteTask(project.id, task.id)}>
                  <button type="submit" style={{ color: "#b91c1c" }}>
                    작업 삭제
                  </button>
                </form>
              ) : null}
              {canWriteProject(role) ? <Link href={`/projects/${project.id}/tasks/${task.id}/edit`}>작업 수정</Link> : null}
            </li>
          ))}
        </ul>
      </section>

      <section>
        {canWriteProject(role) ? <Link href={`/projects/${project.id}/tasks/new`}>작업 등록</Link> : null}
      </section>

      {!canWriteProject(role) ? (
        <p style={{ marginTop: 16, color: "#64748b" }}>
          공수 입력은 로그인 사용자 ID({userId})를 기준으로 가능합니다.
        </p>
      ) : null}
    </main>
  );
}
