import Link from "next/link";
import { callApi, getApiErrorMessage } from "../../lib/api";
import { canWriteProject, getAuthContext } from "../../lib/auth";
import { DataTable, type TableColumn } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";

type Project = {
  id: string;
  name: string;
  code: string;
  status: string;
  budgetHours: number;
};

async function loadProjects(): Promise<Project[]> {
  return callApi<Project[]>("/projects", { cache: "no-store" });
}

const projectStatusVariant = (status: string): "ok" | "warn" | "danger" | "info" => {
  const normalized = status.toLowerCase();
  if (normalized === "active") {
    return "ok";
  }
  if (normalized === "completed" || normalized === "done") {
    return "info";
  }
  if (normalized === "paused") {
    return "warn";
  }
  return "danger";
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?: {
    error?: string;
  };
}) {
  let errorMessage: string | undefined;
  let projects: Project[] = [];

  try {
    projects = await loadProjects();
  } catch (error) {
    errorMessage = getApiErrorMessage(error);
  }

  const { role } = getAuthContext();
  const columns: TableColumn<Project>[] = [
    { key: "name", label: "프로젝트", width: "220px" },
    { key: "code", label: "코드", width: "120px" },
    { key: "status", label: "상태" },
    { key: "budgetHours", label: "예산 공수(h)", align: "right", width: "120px" },
    { key: "id", label: "액션", align: "center", width: "120px" },
  ];

  return (
    <main>
      <h1 className="page-title">프로젝트</h1>
      {searchParams?.error ? <p className="page-message-error">{searchParams.error}</p> : null}
      {!errorMessage ? null : <p className="page-message-error">{errorMessage}</p>}
      {canWriteProject(role) && (
        <div className="toolbar">
          <Link href="/projects/new" className="btn btn-primary">
            새 프로젝트 등록
          </Link>
        </div>
      )}
      <DataTable
        columns={columns}
        rows={projects}
        emptyText="조회된 프로젝트가 없습니다."
        renderCell={(project, column) => {
          if (column.key === "name") {
            return (
              <Link href={`/projects/${project.id}`} style={{ fontWeight: 700 }}>
                {project.name}
              </Link>
            );
          }
          if (column.key === "status") {
            return <StatusBadge variant={projectStatusVariant(project.status)}>{project.status}</StatusBadge>;
          }
          if (column.key === "budgetHours") {
            return <span>{project.budgetHours}</span>;
          }
          if (column.key === "id") {
            return (
              <Link href={`/projects/${project.id}`} className="btn btn-ghost btn-sm">
                상세
              </Link>
            );
          }
          return null;
        }}
      />
    </main>
  );
}
