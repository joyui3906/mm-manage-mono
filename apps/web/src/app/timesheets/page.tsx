import Link from "next/link";
import { redirect } from "next/navigation";
import { callApi, getApiErrorMessage } from "../../lib/api";
import { canWriteProject, getAuthContext } from "../../lib/auth";
import { DataTable, type TableColumn } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";

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

  try {
    await callApi(`/timesheets/assignments/${assignmentId}/${action}`, {
      method: "POST",
    });

    redirect("/timesheets");
  } catch (error) {
    const message = getApiErrorMessage(error);
    redirect(`/timesheets?error=${encodeURIComponent(message)}`);
  }
};

const assignmentStatusVariant = (
  status: Assignment["status"],
): "ok" | "warn" | "danger" | "info" => {
  if (status === "approved") {
    return "ok";
  }
  if (status === "rejected") {
    return "danger";
  }
  return "warn";
};

export default async function TimesheetsPage({
  searchParams,
}: {
  searchParams?: {
    error?: string;
  };
}) {
  let entries: TimeEntry[] = [];
  let assignments: Assignment[] = [];
  let errorMessage: string | undefined;

  try {
    [entries, assignments] = await Promise.all([loadEntries(), loadAssignments()]);
  } catch (error) {
    errorMessage = getApiErrorMessage(error);
  }

  const { role, userId } = getAuthContext();
  const canApprove = canWriteProject(role);

  const assignmentColumns: TableColumn<Assignment>[] = [
    { key: "task", label: "작업", width: "220px" },
    { key: "user", label: "담당자", width: "220px" },
    { key: "plannedHours", label: "예정 공수(h)", align: "right", width: "130px" },
    { key: "status", label: "상태", width: "110px" },
    { key: "reason", label: "요청 사유", width: "260px" },
    { key: "id", label: "액션", align: "center", width: "220px" },
  ];

  const entryColumns: TableColumn<TimeEntry>[] = [
    { key: "date", label: "일자", width: "130px" },
    { key: "user", label: "작성자", width: "190px" },
    { key: "task", label: "작업", width: "220px" },
    { key: "hours", label: "공수(h)", align: "right", width: "100px" },
    { key: "note", label: "비고" },
  ];

  return (
    <main>
      <h1 className="page-title">공수/배정 관리</h1>
      {searchParams?.error ? <p className="page-message-error">{searchParams.error}</p> : null}
      {errorMessage ? <p className="page-message-error">{errorMessage}</p> : null}
      <div className="toolbar">
        <Link href="/timesheets/new" className="btn btn-secondary">
          새 공수 입력
        </Link>
        {canApprove ? (
          <Link href="/timesheets/assignments/new" className="btn btn-secondary">
            배정 생성
          </Link>
        ) : null}
        <a href="/api/timesheets/export?resource=entries" className="btn btn-ghost btn-sm">
          공수 기록 CSV
        </a>
        <a href="/api/timesheets/export?resource=assignments" className="btn btn-ghost btn-sm">
          배정 CSV
        </a>
      </div>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>배정 목록</h2>
        <DataTable
          columns={assignmentColumns}
          rows={assignments}
          emptyText="배정 데이터가 없습니다."
          renderCell={(assignment, column) => {
            if (column.key === "task") {
              return assignment.task.title;
            }
            if (column.key === "user") {
              return `${assignment.user.name} (${assignment.user.email})`;
            }
            if (column.key === "plannedHours") {
              return <span>{assignment.plannedHours}</span>;
            }
            if (column.key === "status") {
              return <StatusBadge variant={assignmentStatusVariant(assignment.status)}>{assignment.status}</StatusBadge>;
            }
            if (column.key === "reason") {
              return assignment.reason ?? "-";
            }
            if (column.key === "id") {
              return assignment.status === "pending" && (canApprove || assignment.user.id === userId) ? (
                <form action={updateAssignmentStatus} className="toolbar" style={{ margin: 0 }}>
                  <input type="hidden" name="id" value={assignment.id} />
                  {canApprove ? (
                    <>
                      <button name="action" value="approve" type="submit" className="btn btn-primary btn-sm">
                        승인
                      </button>
                      <button name="action" value="reject" type="submit" className="btn btn-danger btn-sm">
                        반려
                      </button>
                    </>
                  ) : null}
                  <button name="action" value="cancel" type="submit" className="btn btn-ghost btn-sm">
                    취소
                  </button>
                </form>
              ) : (
                "-"
              );
            }
            return null;
          }}
        />
      </section>

      <section>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>공수 기록</h2>
        <DataTable
          columns={entryColumns}
          rows={entries}
          emptyText="공수 기록이 없습니다."
          renderCell={(entry, column) => {
            if (column.key === "date") {
              return <span>{new Date(entry.date).toISOString().slice(0, 10)}</span>;
            }
            if (column.key === "user") {
              return `${entry.user.name} (${entry.user.email})`;
            }
            if (column.key === "task") {
              return entry.task.title;
            }
            if (column.key === "hours") {
              return <span>{entry.hours}</span>;
            }
            if (column.key === "note") {
              return entry.note ?? "-";
            }
            return null;
          }}
        />
      </section>
    </main>
  );
}
