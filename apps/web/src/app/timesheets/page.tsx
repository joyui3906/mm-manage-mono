import Link from "next/link";
import { callApi } from "../../lib/api";

type TimeEntry = {
  id: string;
  date: string;
  hours: number;
  note?: string;
  user: { name: string; email: string };
  task: { title: string };
};

async function loadEntries(): Promise<TimeEntry[]> {
  return callApi<TimeEntry[]>("/timesheets/entries", { cache: "no-store" });
}

export default async function TimesheetsPage() {
  const entries = await loadEntries();
  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>공수 기록</h1>
      <Link href="/timesheets/new">새 공수 입력</Link>
      <ul style={{ display: "grid", gap: 8 }}>
        {entries.map((entry) => (
          <li key={entry.id}>
            {new Date(entry.date).toISOString().slice(0, 10)} / {entry.task.title} / {entry.user.name} / {entry.hours}h
          </li>
        ))}
      </ul>
    </main>
  );
}
