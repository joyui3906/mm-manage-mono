import { redirect } from "next/navigation";
import { callApi, getApiErrorMessage } from "../../../../../../lib/api";

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

    const payload = {
      title: String(formData.get("title")),
      plannedHours: Number(formData.get("plannedHours") || 0),
      status: String(formData.get("status")),
      dueDate: String(formData.get("dueDate") || ""),
    };

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
      <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <h1 style={{ fontSize: 28, marginBottom: 16 }}>작업 수정</h1>
        <p style={{ color: "#b91c1c" }}>{errorMessage ?? "작업을 불러올 수 없습니다."}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>작업 수정</h1>
      {searchParams?.error ? <p style={{ color: "#b91c1c" }}>{searchParams.error}</p> : null}
      <form action={updateTask} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <label>
          작업명
          <input name="title" defaultValue={task.title} required />
        </label>
        <label>
          예정 공수(시간)
          <input name="plannedHours" type="number" defaultValue={task.plannedHours} />
        </label>
        <label>
          상태
          <select name="status" defaultValue={task.status}>
            {taskStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          마감일
          <input name="dueDate" type="date" defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ""} />
        </label>
        <button type="submit">저장</button>
      </form>
    </main>
  );
}

