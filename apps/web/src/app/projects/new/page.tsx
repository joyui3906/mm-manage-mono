import { redirect } from "next/navigation";
import { callApi, getApiErrorMessage } from "../../../lib/api";
import { FormField } from "../../../components/ui/FormField";

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

export default function NewProjectPage({
  searchParams,
}: {
  searchParams?: {
    error?: string;
  };
}) {
  const createProject = async (formData: FormData) => {
    "use server";

    const payload: {
      name: string;
      code: string;
      budgetHours?: number;
      startDate?: string;
      endDate?: string;
    } = {
      name: getText(formData.get("name")),
      code: getText(formData.get("code")),
    };
    const budgetHours = getNumberValue(formData.get("budgetHours"));
    const startDate = getOptionalText(formData.get("startDate"));
    const endDate = getOptionalText(formData.get("endDate"));
    if (budgetHours !== undefined) {
      payload.budgetHours = budgetHours;
    }
    if (startDate) {
      payload.startDate = startDate;
    }
    if (endDate) {
      payload.endDate = endDate;
    }

    try {
      await callApi("/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const message = getApiErrorMessage(error);
      redirect(`/projects/new?error=${encodeURIComponent(message)}`);
    }

    redirect("/projects");
  };

  return (
    <main>
      <h1 className="page-title">새 프로젝트</h1>
      {searchParams?.error ? <p className="page-message-error">{searchParams.error}</p> : null}
      <form action={createProject} style={{ maxWidth: 420 }}>
        <FormField label="프로젝트명" required>
          <input name="name" required />
        </FormField>
        <FormField label="코드" required>
          <input name="code" required />
        </FormField>
        <FormField label="예산 공수(시간)">
          <input name="budgetHours" type="number" defaultValue={0} />
        </FormField>
        <FormField label="시작일">
          <input name="startDate" type="date" />
        </FormField>
        <FormField label="종료일">
          <input name="endDate" type="date" />
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
