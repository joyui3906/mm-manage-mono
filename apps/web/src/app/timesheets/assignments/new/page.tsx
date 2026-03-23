import { redirect } from "next/navigation";
import { callApi, getApiErrorMessage } from "../../../../lib/api";
import { FormField } from "../../../../components/ui/FormField";

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

export default async function NewAssignmentPage({
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

  const createAssignment = async (formData: FormData) => {
    "use server";

    const payload = {
      taskId: String(formData.get("taskId") || ""),
      userId: String(formData.get("userId") || ""),
      plannedHours: Number(formData.get("plannedHours") || 0),
      reason: String(formData.get("reason") || ""),
    };

    try {
      await callApi("/timesheets/assignments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const message = getApiErrorMessage(error);
      redirect(`/timesheets/assignments/new?error=${encodeURIComponent(message)}`);
    }

    redirect("/timesheets");
  };

  return (
    <main>
      <h1 className="page-title">배정 생성</h1>
      {searchParams?.error ? <p className="page-message-error">{searchParams.error}</p> : null}
      {errorMessage ? <p className="page-message-error">{errorMessage}</p> : null}
      <form action={createAssignment} style={{ maxWidth: 420 }}>
        <FormField label="작업" required>
          <select name="taskId" required>
            <option value="">선택</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                [{task.project.code}] {task.title} ({task.project.name})
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
        <FormField label="배정 공수(시간)" required>
          <input name="plannedHours" type="number" step="1" min="1" defaultValue={1} required />
        </FormField>
        <FormField label="요청 사유">
          <input name="reason" placeholder="선택 사유를 입력하세요" />
        </FormField>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            배정 요청
          </button>
        </div>
      </form>
    </main>
  );
}
