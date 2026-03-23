import Link from "next/link";
import { redirect } from "next/navigation";
import { callApi, getApiErrorMessage } from "../../../lib/api";
import { canWriteProject, getAuthContext } from "../../../lib/auth";
import { DataTable, type TableColumn } from "../../../components/ui/DataTable";
import { StatusBadge } from "../../../components/ui/StatusBadge";

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

const deleteProject = async (formData: FormData) => {
  "use server";

  const projectId = String(formData.get("projectId") || "");
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

const deleteTask = async (formData: FormData) => {
  "use server";

  const projectId = String(formData.get("projectId") || "");
  const taskId = String(formData.get("taskId") || "");
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

const taskStatusVariant = (status: string): "ok" | "warn" | "danger" | "info" => {
  if (status === "done" || status === "completed") {
    return "ok";
  }
  if (status === "in_progress") {
    return "warn";
  }
  if (status === "blocked") {
    return "danger";
  }
  return "info";
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
  const taskColumns: TableColumn<Task>[] = [
    { key: "title", label: "작업명", width: "240px" },
    { key: "plannedHours", label: "예정 공수(h)", align: "right", width: "130px" },
    { key: "status", label: "상태", width: "120px" },
    { key: "dueDate", label: "마감일", width: "130px" },
    { key: "id", label: "관리", align: "center", width: "150px" },
  ];

  try {
    project = await loadProject(params.projectId);
  } catch (error) {
    errorMessage = getApiErrorMessage(error);
  }

  if (!project) {
    return (
      <main>
        <h1 className="page-title">프로젝트 상세</h1>
        <p className="page-message-error">{errorMessage ?? "프로젝트를 불러올 수 없습니다."}</p>
      </main>
    );
  }

  return (
    <main>
      <h1 className="page-title">프로젝트 상세</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        {project.name} ({project.code}) / 상태: {project.status}
      </p>
      <p className="muted" style={{ marginBottom: 24 }}>
        예산 공수: {project.budgetHours}h / 기간: {project.startDate ?? "-"} ~ {project.endDate ?? "-"}
      </p>
      {searchParams?.error ? <p className="page-message-error">{searchParams.error}</p> : null}

      {canWriteProject(role) ? (
        <div className="toolbar">
          <Link href={`/projects/${project.id}/edit`} className="btn btn-secondary btn-sm">
            프로젝트 수정
          </Link>
          <form action={deleteProject}>
            <input type="hidden" name="projectId" value={project.id} />
            <button type="submit" className="btn btn-danger btn-sm">
              프로젝트 삭제
            </button>
          </form>
        </div>
      ) : null}

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>작업 목록</h2>
        <DataTable
          columns={taskColumns}
          rows={project.tasks}
          emptyText="작업이 없습니다."
          renderCell={(task, column) => {
            if (column.key === "title") {
              return task.title;
            }
            if (column.key === "plannedHours") {
              return <span>{task.plannedHours}</span>;
            }
            if (column.key === "status") {
              return <StatusBadge variant={taskStatusVariant(task.status)}>{task.status}</StatusBadge>;
            }
            if (column.key === "dueDate") {
              return task.dueDate ? task.dueDate.slice(0, 10) : "-";
            }
            if (column.key === "id") {
              return (
                <div className="toolbar" style={{ margin: 0 }}>
                  {canWriteProject(role) ? (
                    <>
                      <form action={deleteTask}>
                        <input type="hidden" name="projectId" value={project.id} />
                        <input type="hidden" name="taskId" value={task.id} />
                        <button type="submit" className="btn btn-danger btn-sm">
                          작업 삭제
                        </button>
                      </form>
                      <Link
                        href={`/projects/${project.id}/tasks/${task.id}/edit`}
                        className="btn btn-ghost btn-sm"
                      >
                        작업 수정
                      </Link>
                    </>
                  ) : (
                    "-"
                  )}
                </div>
              );
            }
            return null;
          }}
        />
      </section>

      <section>
        {canWriteProject(role) ? (
          <Link href={`/projects/${project.id}/tasks/new`} className="btn btn-secondary">
            작업 등록
          </Link>
        ) : null}
      </section>

      {!canWriteProject(role) ? (
        <p className="muted" style={{ marginTop: 16 }}>
          공수 입력은 로그인 사용자 ID({userId})를 기준으로 가능합니다.
        </p>
      ) : null}
    </main>
  );
}
