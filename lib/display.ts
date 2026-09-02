import type { Person } from "@/lib/types";

export const PEOPLE: Record<
  Person,
  { id: Person; name: string; initials: string; accent: string }
> = {
  landon: { id: "landon", name: "Landon", initials: "LD", accent: "var(--accent)" },
  emma: { id: "emma", name: "Emma", initials: "EM", accent: "var(--emma)" },
};

export const PERSON_IDS: Person[] = ["landon", "emma"];

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/** "2026-06-08" -> "JUN 08 2026" */
export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${String(d).padStart(2, "0")} ${y}`;
}

/** epoch ms -> "JUN 08 · 9:41 AM" */
export function fmtDateTime(ms: number): string {
  const dt = new Date(ms);
  const hh = dt.getHours();
  const mm = String(dt.getMinutes()).padStart(2, "0");
  const ap = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${MONTHS[dt.getMonth()]} ${String(dt.getDate()).padStart(2, "0")} · ${h12}:${mm} ${ap}`;
}

/** "2026-06" -> "JUN '26" */
export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS[m - 1]} '${String(y).slice(2)}`;
}

/** Local calendar date as YYYY-MM-DD. */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Local date `days` ago as YYYY-MM-DD. */
export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
