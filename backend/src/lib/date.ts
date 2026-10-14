import { HttpError } from "./http-error";

export const TIME_ZONE = "America/Sao_Paulo";

const localFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function parseDateOnly(value: unknown): Date {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, "Data inválida: utilize AAAA-MM-DD.");
  }
  const result = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(result.getTime()) || result.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, "Data inexistente no calendário.");
  }
  return result;
}

export function isWeekend(date: Date): boolean {
  const weekday = date.getUTCDay();
  return weekday === 0 || weekday === 6;
}

export function getLocalNow(now: Date = new Date()): { date: string; time: string } {
  const parts = Object.fromEntries(
    localFormatter.formatToParts(now).map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

export function isPastSlot(date: string, time: string, now: Date = new Date()): boolean {
  const local = getLocalNow(now);
  return date < local.date || (date === local.date && time <= local.time);
}
