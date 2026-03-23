import { redirect } from "next/navigation";
import { callApi, getApiErrorMessage } from "../../../lib/api";
import { FormField } from "../../../components/ui/FormField";

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

export default async function NewTimeEntryPage({
  searchParams,
}: {
  searchParams?: {
    error?: string;
  };
}) {
  let users: TimeEntryUser[] = [];
  let tasks: OrgTask[] = [];
  let errorMessage: string | undefined;

  try {
    [users, tasks] = await Promise.all([loadUsers(), loadTasks()]);
  } catch (error) {
    errorMessage = getApiErrorMessage(error);
  }

  const createTimeEntry = async (formData: FormData) => {
    "use server";

    const payload = {
      taskId: String(formData.get("taskId")),
      userId: String(formData.get("userId")),
      date: String(formData.get("date")),
      hours: Number(formData.get("hours") || 0),
      note: String(formData.get("note") || ""),
    };

    try {
      await callApi("/timesheets/entries", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const message = getApiErrorMessage(error);
      redirect(`/timesheets/new?error=${encodeURIComponent(message)}`);
    }

    redirect("/timesheets");
  };

  return (
    <main>
      <h1 className="page-title">공수 입력</h1>
      {searchParams?.error ? <p className="page-message-error">{searchParams.error}</p> : null}
      {errorMessage ? <p className="page-message-error">{errorMessage}</p> : null}
      <form action={createTimeEntry} style={{ maxWidth: 420 }}>
        <FormField label="작업" required>
          <select name="taskId" required>
            <option value="">선택</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                [{task.project.code}] {task.title} ({task.project.name}) - 예정 {task.plannedHours}h
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="담당자" required>
          <select name="userId" required>
            <option value="">선택</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="날짜" required>
          <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </FormField>
        <FormField label="투입시간" required>
          <input name="hours" type="number" step="1" defaultValue={1} required />
        </FormField>
        <FormField label="비고">
          <input name="note" />
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
