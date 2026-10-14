/** Consultas de 1h; 17:00 termina às 18:00. */
export const ALL_SLOTS: readonly string[] = Array.from(
  { length: 10 },
  (_, index) => `${String(index + 8).padStart(2, "0")}:00`,
);

export function availableSlots(
  date: string,
  busy: readonly string[],
  isPast: (date: string, time: string) => boolean,
): string[] {
  const occupied = new Set(busy);
  return ALL_SLOTS.filter((time) => !occupied.has(time) && !isPast(date, time));
}
