import { redirect } from "next/navigation";
import { callApi, getApiErrorMessage } from "../../../lib/api";

export default function NewProjectPage({
  searchParams,
}: {
  searchParams?: {
    error?: string;
  };
}) {
  const createProject = async (formData: FormData) => {
    "use server";

    const payload = {
      name: String(formData.get("name")),
      code: String(formData.get("code")),
      budgetHours: Number(formData.get("budgetHours") || 0),
      startDate: String(formData.get("startDate")),
      endDate: String(formData.get("endDate")),
    };

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
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>새 프로젝트</h1>
      {searchParams?.error ? <p style={{ color: "#b91c1c" }}>{searchParams.error}</p> : null}
      <form action={createProject} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <label>
          프로젝트명
          <input name="name" required />
        </label>
        <label>
          코드
          <input name="code" required />
        </label>
        <label>
          예산 공수(시간)
          <input name="budgetHours" type="number" defaultValue={0} />
        </label>
        <label>
          시작일
          <input name="startDate" type="date" />
        </label>
        <label>
          종료일
          <input name="endDate" type="date" />
        </label>
        <button type="submit">저장</button>
      </form>
    </main>
  );
}
