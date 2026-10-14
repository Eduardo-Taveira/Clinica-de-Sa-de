import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import { requireAuth } from "../middlewares/auth";

export const catalogRouter = Router();
catalogRouter.use(requireAuth);
const uuid = z.string().uuid();

catalogRouter.get("/specialties", async (_req, res) => {
  const specialties = await prisma.specialty.findMany({
    where: { doctors: { some: { active: true, locations: { some: { location: { active: true } } } } } },
    select: { id: true, name: true }, orderBy: { name: "asc" },
  });
  res.json({ specialties });
});

catalogRouter.get("/locations", async (_req, res) => {
  const locations = await prisma.clinicLocation.findMany({
    where: { active: true },
    select: { id: true, name: true, city: true, neighborhood: true, address: true },
    orderBy: [{ city: "asc" }, { name: "asc" }],
  });
  res.json({ locations });
});

catalogRouter.get("/doctors", async (req, res) => {
  const q = z.object({ specialtyId: uuid.optional(), locationId: uuid.optional() }).safeParse(req.query);
  if (!q.success) throw new HttpError(400, "Filtros de médico inválidos.");
  const doctors = await prisma.doctor.findMany({
    where: {
      active: true,
      ...(q.data.specialtyId ? { specialtyId: q.data.specialtyId } : {}),
      locations: { some: {
        location: { active: true },
        ...(q.data.locationId ? { locationId: q.data.locationId } : {}),
      } },
    },
    select: {
      id: true, name: true, specialty: { select: { id: true, name: true } },
      locations: {
        where: { location: { active: true }, ...(q.data.locationId ? { locationId: q.data.locationId } : {}) },
        select: { weekdays: true, location: { select: { id: true, name: true, city: true, neighborhood: true, address: true } } },
      },
    },
    orderBy: { name: "asc" },
  });
  res.json({ doctors: doctors.map(d => ({
    id: d.id, name: d.name, specialty: d.specialty,
    locations: d.locations.map(dl => ({ ...dl.location, weekdays: dl.weekdays })),
  })) });
});
