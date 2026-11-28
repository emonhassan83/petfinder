//* Timezone helpers built on Intl (no date library). "Local" means wall-clock time in an IANA zone.

export const SLOT_MINUTES = 60;

export const isValidTimeZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const partsIn = (date: Date, tz: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour"), min: get("minute"), s: get("second") };
};

//* "YYYY-MM-DD" of an instant in the zone
export const localDateString = (date: Date, tz: string) => {
  const p = partsIn(date, tz);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
};

//* Converts a zone's wall-clock date + "HH:mm" to a UTC Date (DST-safe via two-pass offset correction)
export const zonedToUtc = (dateStr: string, time: string, tz: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const asUtc = Date.UTC(y, m - 1, d, h, min);
  let guess = asUtc;
  for (let i = 0; i < 2; i++) {
    const p = partsIn(new Date(guess), tz);
    const shown = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s);
    guess += asUtc - shown;
  }
  return new Date(guess);
};

//* 0 = Monday … 6 = Sunday for a "YYYY-MM-DD" calendar date
export const weekdayOf = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
};

export const addDays = (dateStr: string, days: number) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};
