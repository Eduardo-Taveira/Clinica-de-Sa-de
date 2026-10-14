import { prisma } from "../lib/prisma";
import { getLocalNow, isPastSlot, isWeekend, parseDateOnly, TIME_ZONE } from "../lib/date";
import { ALL_SLOTS, availableSlots } from "../lib/slots";
import { nationalHolidayFor } from "./holidays";

export const DEFAULT_DOCTOR_ID = "80000000-0000-4000-8000-000000000001";
export const DEFAULT_LOCATION_ID = "70000000-0000-4000-8000-000000000001";

export type UnavailabilityReason = "WEEKEND" | "HOLIDAY" | "PAST_DATE" | "DOCTOR_OFF" | null;

export function weekdayIndex(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

/** Verifica o vínculo ativo e o dia de atendimento, sem confiar no frontend. */
export async function isDoctorAtLocationOnDate(doctorId: string, locationId: string, date: Date): Promise<boolean> {
  const assignment = await prisma.doctorLocation.findUnique({
    where: { doctorId_locationId: { doctorId, locationId } },
    include: { doctor: { select: { active: true } }, location: { select: { active: true } } },
  });
  return Boolean(assignment && assignment.doctor.active && assignment.location.active && assignment.weekdays.includes(weekdayIndex(date)));
}

export async function getAvailability(dateText: string, doctorId = DEFAULT_DOCTOR_ID, locationId = DEFAULT_LOCATION_ID): Promise<{
  date: string;
  timeZone: string;
  hours: { opening: string; closing: string; durationMinutes: number };
  availableTimes: string[];
  reason: UnavailabilityReason;
  holidayName?: string;
}> {
  const date = parseDateOnly(dateText);
  const basic = {
    date: dateText,
    timeZone: TIME_ZONE,
    hours: { opening: "08:00", closing: "18:00", durationMinutes: 60 },
  };
  if (dateText < getLocalNow().date) return { ...basic, availableTimes: [], reason: "PAST_DATE" };
  if (isWeekend(date)) return { ...basic, availableTimes: [], reason: "WEEKEND" };

  // A integração pública Nager.Date permanece obrigatória e bloqueante.
  const holidayName = await nationalHolidayFor(dateText);
  if (holidayName) return { ...basic, availableTimes: [], reason: "HOLIDAY", holidayName };

  if (!(await isDoctorAtLocationOnDate(doctorId, locationId, date))) {
    return { ...basic, availableTimes: [], reason: "DOCTOR_OFF" };
  }

  const booked = await prisma.appointment.findMany({
    where: { date, doctorId }, // bloqueia o médico mesmo em outra unidade
    select: { startTime: true },
  });
  return {
    ...basic,
    availableTimes: availableSlots(dateText, booked.map(a => a.startTime), isPastSlot),
    reason: null,
  };
}

export function isValidStartTime(value: string): boolean {
  return ALL_SLOTS.includes(value);
}
