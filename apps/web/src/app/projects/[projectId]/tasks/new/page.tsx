import { redirect } from "next/navigation";
import { callApi, getApiErrorMessage } from "../../../../../lib/api";

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

    const payload = {
      title: String(formData.get("title")),
      plannedHours: Number(formData.get("plannedHours") || 0),
      dueDate: String(formData.get("dueDate") || ""),
    };

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
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>작업 등록</h1>
      {searchParams?.error ? <p style={{ color: "#b91c1c" }}>{searchParams.error}</p> : null}
      <form action={createTask} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <label>
          작업명
          <input name="title" required />
        </label>
        <label>
          예정 공수(시간)
          <input name="plannedHours" type="number" defaultValue={0} />
        </label>
        <label>
          마감일
          <input name="dueDate" type="date" />
        </label>
        <button type="submit">저장</button>
      </form>
    </main>
  );
}
