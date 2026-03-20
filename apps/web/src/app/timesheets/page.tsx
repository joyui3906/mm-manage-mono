import Link from "next/link";
import { redirect } from "next/navigation";
import { callApi } from "../../lib/api";
import { canWriteProject, getAuthContext } from "../../lib/auth";

type TimeEntry = {
  id: string;
  date: string;
  hours: number;
  note?: string;
  user: { name: string; email: string };
  task: { title: string };
};

type Assignment = {
  id: string;
  plannedHours: number;
  status: "pending" | "approved" | "rejected";
  reason?: string | null;
  task: { id: string; title: string };
  user: { id: string; name: string; email: string };
};

async function loadEntries(): Promise<TimeEntry[]> {
  return callApi<TimeEntry[]>("/timesheets/entries", { cache: "no-store" });
}

async function loadAssignments(): Promise<Assignment[]> {
  return callApi<Assignment[]>("/timesheets/assignments", { cache: "no-store" });
}

const updateAssignmentStatus = async (formData: FormData) => {
  "use server";

  const assignmentId = String(formData.get("id") || "");
  const action = String(formData.get("action") || "");

  if (!assignmentId || (action !== "approve" && action !== "reject" && action !== "cancel")) {
    return;
  }

  await callApi(`/timesheets/assignments/${assignmentId}/${action}`, {
    method: "POST",
  });

  redirect("/timesheets");
}

export default async function TimesheetsPage() {
  const [entries, assignments] = await Promise.all([loadEntries(), loadAssignments()]);
  const { role, userId } = getAuthContext();
  const canApprove = canWriteProject(role);

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>공수/배정 관리</h1>
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <Link href="/timesheets/new">새 공수 입력</Link>
        {canApprove ? <Link href="/timesheets/assignments/new">배정 생성</Link> : null}
      </div>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>배정 목록</h2>
        <ul style={{ display: "grid", gap: 10 }}>
          {assignments.map((assignment) => (
            <li key={assignment.id} style={{ border: "1px solid #e2e8f0", padding: 10, borderRadius: 8 }}>
              <p style={{ margin: 0 }}>
                [{assignment.status}] {assignment.task.title} / {assignment.user.name} ({assignment.user.email}) / 예정{" "}
                {assignment.plannedHours}h
              </p>
              {assignment.reason ? <p style={{ margin: "4px 0 0" }}>요청 사유: {assignment.reason}</p> : null}
              {assignment.status === "pending" && (canApprove || assignment.user.id === userId) ? (
                <form action={updateAssignmentStatus} style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <input type="hidden" name="id" value={assignment.id} />
                  {canApprove ? (
                    <>
                      <button name="action" value="approve" type="submit">
                        승인
                      </button>
                      <button name="action" value="reject" type="submit">
                        반려
                      </button>
                    </>
                  ) : null}
                  <button name="action" value="cancel" type="submit">
                    취소
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>공수 기록</h2>
        <ul style={{ display: "grid", gap: 8 }}>
          {entries.map((entry) => (
            <li key={entry.id}>
              {new Date(entry.date).toISOString().slice(0, 10)} / {entry.task.title} / {entry.user.name} / {entry.hours}h
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
