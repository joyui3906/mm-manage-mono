import Link from "next/link";
import { callApi } from "../../lib/api";
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

export default async function ProjectsPage() {
  const projects = await loadProjects();
  const { role } = getAuthContext();

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>프로젝트</h1>
      {canWriteProject(role) && <Link href="/projects/new">새 프로젝트 등록</Link>}
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
