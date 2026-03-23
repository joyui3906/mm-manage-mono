import { redirect } from "next/navigation";
import { callApi, getApiErrorMessage } from "../../../../lib/api";

type ProjectStatus = "planning" | "active" | "on_hold" | "done" | "cancelled";

type Project = {
  id: string;
  name: string;
  code: string;
  budgetHours: number;
  status: ProjectStatus;
  ownerUserId?: string | null;
  startDate: string | null;
  endDate: string | null;
};

const projectStatuses: ProjectStatus[] = ["planning", "active", "on_hold", "done", "cancelled"];

async function loadProject(projectId: string): Promise<Project> {
  return callApi<Project>(`/projects/${projectId}`, { cache: "no-store" });
}

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: { projectId: string };
  searchParams?: {
    error?: string;
  };
}) {
  let project: Project | undefined;
  let errorMessage: string | undefined;

  try {
    project = await loadProject(params.projectId);
  } catch (error) {
    errorMessage = getApiErrorMessage(error);
  }

  const updateProject = async (formData: FormData) => {
    "use server";

    const payload = {
      name: String(formData.get("name")),
      code: String(formData.get("code")),
      budgetHours: Number(formData.get("budgetHours") || 0),
      status: String(formData.get("status")),
      ownerUserId: String(formData.get("ownerUserId")),
      startDate: String(formData.get("startDate")),
      endDate: String(formData.get("endDate")),
    };

    try {
      await callApi(`/projects/${params.projectId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const message = getApiErrorMessage(error);
      redirect(`/projects/${params.projectId}/edit?error=${encodeURIComponent(message)}`);
    }

    redirect(`/projects/${params.projectId}`);
  };

  if (!project) {
    return (
      <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <h1 style={{ fontSize: 28, marginBottom: 16 }}>프로젝트 수정</h1>
        <p style={{ color: "#b91c1c" }}>{errorMessage ?? "프로젝트를 불러올 수 없습니다."}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>프로젝트 수정</h1>
      {searchParams?.error ? <p style={{ color: "#b91c1c" }}>{searchParams.error}</p> : null}
      <form action={updateProject} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <label>
          프로젝트명
          <input name="name" defaultValue={project.name} required />
        </label>
        <label>
          코드
          <input name="code" defaultValue={project.code} required />
        </label>
        <label>
          상태
          <select name="status" defaultValue={project.status}>
            {projectStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          예산 공수(시간)
          <input name="budgetHours" type="number" defaultValue={project.budgetHours} />
        </label>
        <label>
          소유자 ID
          <input name="ownerUserId" defaultValue={project.ownerUserId ?? ""} />
        </label>
        <label>
          시작일
          <input name="startDate" type="date" defaultValue={project.startDate ? project.startDate.slice(0, 10) : ""} />
        </label>
        <label>
          종료일
          <input name="endDate" type="date" defaultValue={project.endDate ? project.endDate.slice(0, 10) : ""} />
        </label>
        <button type="submit">수정</button>
      </form>
    </main>
  );
}

