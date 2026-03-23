import { redirect } from "next/navigation";
import { callApi, getApiErrorMessage } from "../../../../../lib/api";
import { FormField } from "../../../../../components/ui/FormField";

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

export default function NewProjectTaskPage({
  params,
  searchParams,
}: {
  params: { projectId: string };
  searchParams?: {
    error?: string;
  };
}) {
  const createTask = async (formData: FormData) => {
    "use server";

    const payload: {
      title: string;
      plannedHours?: number;
      dueDate?: string;
    } = {
      title: getText(formData.get("title")),
    };
    const plannedHours = getNumberValue(formData.get("plannedHours"));
    const dueDate = getOptionalText(formData.get("dueDate"));

    if (plannedHours !== undefined) {
      payload.plannedHours = plannedHours;
    }
    if (dueDate) {
      payload.dueDate = dueDate;
    }

    try {
      await callApi(`/projects/${params.projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const message = getApiErrorMessage(error);
      redirect(`/projects/${params.projectId}/tasks/new?error=${encodeURIComponent(message)}`);
    }

    redirect(`/projects/${params.projectId}`);
  };

  return (
    <main>
      <h1 className="page-title">작업 등록</h1>
      {searchParams?.error ? <p className="page-message-error">{searchParams.error}</p> : null}
      <form action={createTask} style={{ maxWidth: 420 }}>
        <FormField label="작업명" required>
          <input name="title" required />
        </FormField>
        <FormField label="예정 공수(시간)">
          <input name="plannedHours" type="number" defaultValue={0} />
        </FormField>
        <FormField label="마감일">
          <input name="dueDate" type="date" />
        </FormField>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            저장
          </button>
        </div>
      </form>
    </main>
  );
}
