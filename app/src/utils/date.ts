//* Date helpers that format in the shelter's timezone (Hermes supports Intl timeZone; falls back to the device zone).
const safe = <T,>(fn: () => T, fallback: () => T): T => {
  try {
    return fn();
  } catch {
    return fallback();
  }
};

export const dayKey = (iso: string, tz: string) =>
  safe(() => new Date(iso).toLocaleDateString("en-CA", { timeZone: tz }), () => new Date(iso).toISOString().slice(0, 10));

export const timeLabel = (iso: string, tz: string) =>
  safe(() => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz }), () => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));

export const dateLabel = (iso: string, tz: string) =>
  safe(
    () => new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: tz }),
    () => new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  );

export const timeAgo = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
