import { redirect } from "next/navigation";
import { callApi, getApiErrorMessage } from "../../../../lib/api";
import { FormField } from "../../../../components/ui/FormField";

const getText = (value: FormDataEntryValue | null) => (typeof value === "string" ? value.trim() : "");
const getOptionalText = (value: FormDataEntryValue | null) => {
  const text = getText(value);
  return text.length > 0 ? text : undefined;
};
const getNumberValue = (value: FormDataEntryValue | null): number | undefined => {
  const text = getText(value);
  if (!text) {
    return undefined;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
};

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

    const payload: {
      name: string;
      code: string;
      status: string;
      budgetHours?: number;
      ownerUserId?: string;
      startDate?: string;
      endDate?: string;
    } = {
      name: getText(formData.get("name")),
      code: getText(formData.get("code")),
      status: getText(formData.get("status")),
    };
    const budgetHours = getNumberValue(formData.get("budgetHours"));
    const ownerUserId = getOptionalText(formData.get("ownerUserId"));
    const startDate = getOptionalText(formData.get("startDate"));
    const endDate = getOptionalText(formData.get("endDate"));

    if (budgetHours !== undefined) {
      payload.budgetHours = budgetHours;
    }
    if (ownerUserId !== undefined) {
      payload.ownerUserId = ownerUserId;
    }
    if (startDate) {
      payload.startDate = startDate;
    }
    if (endDate) {
      payload.endDate = endDate;
    }

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
      <main>
        <h1 className="page-title">프로젝트 수정</h1>
        <p className="page-message-error">{errorMessage ?? "프로젝트를 불러올 수 없습니다."}</p>
      </main>
    );
  }

  return (
    <main>
      <h1 className="page-title">프로젝트 수정</h1>
      {searchParams?.error ? <p className="page-message-error">{searchParams.error}</p> : null}
      <form action={updateProject} style={{ maxWidth: 420 }}>
        <FormField label="프로젝트명" required>
          <input name="name" defaultValue={project.name} required />
        </FormField>
        <FormField label="코드" required>
          <input name="code" defaultValue={project.code} required />
        </FormField>
        <FormField label="상태">
          <select name="status" defaultValue={project.status}>
            {projectStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="예산 공수(시간)">
          <input name="budgetHours" type="number" defaultValue={project.budgetHours} />
        </FormField>
        <FormField label="소유자 ID">
          <input name="ownerUserId" defaultValue={project.ownerUserId ?? ""} />
        </FormField>
        <FormField label="시작일">
          <input name="startDate" type="date" defaultValue={project.startDate ? project.startDate.slice(0, 10) : ""} />
        </FormField>
        <FormField label="종료일">
          <input name="endDate" type="date" defaultValue={project.endDate ? project.endDate.slice(0, 10) : ""} />
        </FormField>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            수정
          </button>
        </div>
      </form>
    </main>
  );
}
