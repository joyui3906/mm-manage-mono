import { redirect } from "next/navigation";
import { callApi } from "../../../lib/api";

type TimeEntryUser = {
  id: string;
  name: string;
  email: string;
};

type OrgTask = {
  id: string;
  title: string;
  plannedHours: number;
  dueDate: string | null;
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

export default async function NewTimeEntryPage() {
  const [users, tasks] = await Promise.all([loadUsers(), loadTasks()]);

  const createTimeEntry = async (formData: FormData) => {
    "use server";

    const payload = {
      taskId: String(formData.get("taskId")),
      userId: String(formData.get("userId")),
      date: String(formData.get("date")),
      hours: Number(formData.get("hours") || 0),
      note: String(formData.get("note") || ""),
    };

    await callApi("/timesheets/entries", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    redirect("/timesheets");
  };

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>공수 입력</h1>
      <form action={createTimeEntry} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <label>
          작업
          <select name="taskId" required>
            <option value="">선택</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                [{task.project.code}] {task.title} ({task.project.name}) - 예정 {task.plannedHours}h
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
          날짜
          <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </label>
        <label>
          투입시간
          <input name="hours" type="number" step="1" defaultValue={1} required />
        </label>
        <label>
          비고
          <input name="note" />
        </label>
        <button type="submit">저장</button>
      </form>
    </main>
  );
}
