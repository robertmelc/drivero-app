export type DeadlineStatus = "ok" | "warn" | "bad" | "unknown";

/** Green if far off, amber within 30 days, red if past, gray if not set. */
export function getDeadlineStatus(date: Date | null | undefined): DeadlineStatus {
  if (!date) return "unknown";
  const now = new Date();
  const daysLeft = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return "bad";
  if (daysLeft <= 30) return "warn";
  return "ok";
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" }).format(date);
}

export const statusColor: Record<DeadlineStatus, string> = {
  ok: "bg-signal shadow-[0_0_6px_rgba(52,227,122,0.7)]",
  warn: "bg-amber shadow-[0_0_6px_rgba(226,194,61,0.6)]",
  bad: "bg-danger shadow-[0_0_6px_rgba(227,92,92,0.7)]",
  unknown: "bg-white/20",
};
