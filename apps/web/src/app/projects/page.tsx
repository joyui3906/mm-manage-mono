import Link from "next/link";
import { callApi, getApiErrorMessage } from "../../lib/api";
import { canWriteProject, getAuthContext } from "../../lib/auth";

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

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>프로젝트</h1>
      {searchParams?.error ? <p style={{ color: "#b91c1c" }}>{searchParams.error}</p> : null}
      {!errorMessage ? null : <p style={{ color: "#b91c1c" }}>{errorMessage}</p>}
      {canWriteProject(role) && <Link href="/projects/new">새 프로젝트 등록</Link>}
      {projects.length === 0 ? <p style={{ marginTop: 12 }}>조회된 프로젝트가 없습니다.</p> : null}
      <ul style={{ marginTop: 12 }}>
        {projects.map((project) => (
          <li key={project.id} style={{ marginBottom: 8 }}>
            <Link href={`/projects/${project.id}`}>
              <b>{project.name}</b>
            </Link>{" "}
            ({project.code}) - {project.status} /예산 {project.budgetHours}h
          </li>
        ))}
      </ul>
    </main>
  );
}
