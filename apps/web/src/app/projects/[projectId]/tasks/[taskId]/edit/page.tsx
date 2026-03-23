import { redirect } from "next/navigation";
import { callApi, getApiErrorMessage } from "../../../../../../lib/api";
import { FormField } from "../../../../../../components/ui/FormField";

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

type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
type Task = {
  id: string;
  title: string;
  plannedHours: number;
  status: TaskStatus;
  dueDate: string | null;
};

type ProjectTaskList = Task[];

const taskStatuses: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];

async function loadTask(projectId: string, taskId: string): Promise<Task> {
  const tasks = await callApi<ProjectTaskList>(`/projects/${projectId}/tasks`, { cache: "no-store" });
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  return task;
}

export default async function EditTaskPage({
  params,
  searchParams,
}: {
  params: {
    projectId: string;
    taskId: string;
  };
  searchParams?: {
    error?: string;
  };
}) {
  let task: Task | undefined;
  let errorMessage: string | undefined;

  try {
    task = await loadTask(params.projectId, params.taskId);
  } catch (error) {
    errorMessage = getApiErrorMessage(error);
  }

  const updateTask = async (formData: FormData) => {
    "use server";

    const payload: {
      title: string;
      plannedHours?: number;
      status: string;
      dueDate?: string;
    } = {
      title: getText(formData.get("title")),
      status: getText(formData.get("status")),
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
      await callApi(`/projects/${params.projectId}/tasks/${params.taskId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const message = getApiErrorMessage(error);
      redirect(
        `/projects/${params.projectId}/tasks/${params.taskId}/edit?error=${encodeURIComponent(message)}`,
      );
    }

    redirect(`/projects/${params.projectId}`);
  };

  if (!task) {
    return (
      <main>
        <h1 className="page-title">작업 수정</h1>
        <p className="page-message-error">{errorMessage ?? "작업을 불러올 수 없습니다."}</p>
      </main>
    );
  }

  return (
    <main>
      <h1 className="page-title">작업 수정</h1>
      {searchParams?.error ? <p className="page-message-error">{searchParams.error}</p> : null}
      <form action={updateTask} style={{ maxWidth: 420 }}>
        <FormField label="작업명" required>
          <input name="title" defaultValue={task.title} required />
        </FormField>
        <FormField label="예정 공수(시간)">
          <input name="plannedHours" type="number" defaultValue={task.plannedHours} />
        </FormField>
        <FormField label="상태">
          <select name="status" defaultValue={task.status}>
            {taskStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="마감일">
          <input name="dueDate" type="date" defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ""} />
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
