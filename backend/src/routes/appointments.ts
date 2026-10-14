import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import { isPastSlot, parseDateOnly } from "../lib/date";
import { DEFAULT_DOCTOR_ID, DEFAULT_LOCATION_ID, getAvailability, isValidStartTime } from "../services/appointments";
import { requireAuth } from "../middlewares/auth";

export const appointmentsRouter = Router();
appointmentsRouter.use(requireAuth);

const uuid = z.string().uuid();
const appointmentSchema = z.object({
  date: z.string(), time: z.string(),
  doctorId: uuid.optional(), locationId: uuid.optional(),
}).strict().refine(data => Boolean(data.doctorId) === Boolean(data.locationId), {
  message: "Informe médico e unidade juntos.",
});

const doctorSelect = {
  id: true, name: true, specialty: { select: { id: true, name: true } },
} satisfies Prisma.DoctorSelect;
const locationSelect = {
  id: true, name: true, city: true, neighborhood: true, address: true,
} satisfies Prisma.ClinicLocationSelect;
const appointmentSelect = {
  id: true, date: true, startTime: true, createdAt: true,
  doctor: { select: doctorSelect }, location: { select: locationSelect },
} satisfies Prisma.AppointmentSelect;

function toResponse(a: { id: string; date: Date; startTime: string; createdAt: Date;
  doctor: { id: string; name: string; specialty: { id: string; name: string } } | null;
  location: { id: string; name: string; city: string; neighborhood: string; address: string | null } | null;
}) {
  return { id: a.id, date: a.date.toISOString().slice(0, 10), time: a.startTime,
    createdAt: a.createdAt, doctor: a.doctor, location: a.location };
}

// GET /available?date=2026-11-03 (contrato original preservado)
// GET /available?date=2026-11-03&doctorId=...&locationId=... (V3)
appointmentsRouter.get("/available", async (req, res) => {
  const { date, doctorId, locationId } = req.query;
  if (typeof date !== "string") throw new HttpError(400, "Informe date=AAAA-MM-DD.");
  if ((doctorId !== undefined || locationId !== undefined) &&
      (!uuid.safeParse(doctorId).success || !uuid.safeParse(locationId).success)) {
    throw new HttpError(400, "Informe doctorId e locationId válidos juntos.");
  }
  res.json(await getAvailability(date, (doctorId as string | undefined) ?? DEFAULT_DOCTOR_ID,
    (locationId as string | undefined) ?? DEFAULT_LOCATION_ID));
});

appointmentsRouter.post("/appointments", async (req, res) => {
  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Informe data, horário e, na V3, médico e unidade.", parsed.error.flatten().fieldErrors);
  const { date, time } = parsed.data;
  const doctorId = parsed.data.doctorId ?? DEFAULT_DOCTOR_ID;
  const locationId = parsed.data.locationId ?? DEFAULT_LOCATION_ID;
  const appointmentDate = parseDateOnly(date);
  if (!isValidStartTime(time)) throw new HttpError(400, "Horário inválido. Escolha entre 08:00 e 17:00.");

  const availability = await getAvailability(date, doctorId, locationId);
  if (!availability.availableTimes.includes(time)) {
    throw new HttpError(409, "Horário indisponível para agendamento.", {
      reason: availability.reason ?? "OCCUPIED_OR_PAST",
    });
  }

  try {
    const appointment = await prisma.appointment.create({
      data: { userId: req.auth!.userId, date: appointmentDate, startTime: time, doctorId, locationId },
      select: appointmentSelect,
    });
    res.status(201).json({ message: "Agendamento confirmado.", appointment: toResponse(appointment) });
  } catch (error) {
    // O índice único por médico evita conflitos em requisições simultâneas.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "Este médico já tem consulta no horário informado.");
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new HttpError(400, "Médico ou unidade não encontrado.");
    }
    throw error;
  }
});

appointmentsRouter.get("/appointments", async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    where: { userId: req.auth!.userId },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    select: appointmentSelect,
  });
  res.json({ appointments: appointments.map(toResponse) });
});

appointmentsRouter.delete("/appointments/:id", async (req, res) => {
  const id = uuid.safeParse(req.params.id);
  if (!id.success) throw new HttpError(400, "Identificador de consulta inválido.");
  const appointment = await prisma.appointment.findFirst({
    where: { id: id.data, userId: req.auth!.userId }, select: { date: true, startTime: true },
  });
  if (!appointment) throw new HttpError(404, "Consulta não encontrada.");
  if (isPastSlot(appointment.date.toISOString().slice(0, 10), appointment.startTime)) {
    throw new HttpError(409, "Não é possível cancelar uma consulta que já começou ou passou.");
  }
  const result = await prisma.appointment.deleteMany({ where: { id: id.data, userId: req.auth!.userId } });
  if (result.count === 0) throw new HttpError(404, "Consulta não encontrada.");
  res.status(204).send();
});
