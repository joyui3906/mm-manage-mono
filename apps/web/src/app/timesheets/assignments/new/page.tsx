import { redirect } from "next/navigation";
import { callApi } from "../../../../lib/api";

type TimeEntryUser = {
  id: string;
  name: string;
  email: string;
};

type OrgTask = {
  id: string;
  title: string;
  plannedHours: number;
  project: {
    id: string;
    name: string;
    code: string;
  };
};

async function loadUsers() {
  return callApi<TimeEntryUser[]>("/timesheets/users", { cache: "no-store" });
}

async function loadTasks() {
  return callApi<OrgTask[]>("/timesheets/tasks", { cache: "no-store" });
}

export default async function NewAssignmentPage() {
  const [users, tasks] = await Promise.all([loadUsers(), loadTasks()]);

  const createAssignment = async (formData: FormData) => {
    "use server";

    const payload = {
      taskId: String(formData.get("taskId") || ""),
      userId: String(formData.get("userId") || ""),
      plannedHours: Number(formData.get("plannedHours") || 0),
      reason: String(formData.get("reason") || ""),
    };

    await callApi("/timesheets/assignments", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    redirect("/timesheets");
  };

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>배정 생성</h1>
      <form action={createAssignment} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <label>
          작업
          <select name="taskId" required>
            <option value="">선택</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                [{task.project.code}] {task.title} ({task.project.name})
              </option>
            ))}
          </select>
        </label>
        <label>
          담당자
          <select name="userId" required>
            <option value="">선택</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </label>
        <label>
          배정 공수(시간)
          <input name="plannedHours" type="number" step="1" min="1" defaultValue={1} required />
        </label>
        <label>
          요청 사유
          <input name="reason" placeholder="선택 사유를 입력하세요" />
        </label>
        <button type="submit">배정 요청</button>
      </form>
    </main>
  );
}
