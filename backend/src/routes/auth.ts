import { Router, type Response } from "express";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import { COOKIE_NAME, hashToken, requireAuth } from "../middlewares/auth";

export const authRouter = Router();
const SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const cookieOptions = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(72).refine((v) => Buffer.byteLength(v, "utf8") <= 72, {
    message: "A senha deve ter no máximo 72 bytes.",
  }),
}).strict();

const loginSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1),
}).strict();

async function attachSession(res: Response, userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_AGE_MS),
    },
  });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_AGE_MS });
}

// Cadastro cria apenas PATIENT. ADMIN nunca é definido pelo cliente.
authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Dados de cadastro inválidos.", parsed.error.flatten().fieldErrors);

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
      },
      select: { id: true, name: true, email: true, role: true },
    });
    await attachSession(res, user.id);
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "Este e-mail já está cadastrado.");
    }
    throw error;
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Dados de login inválidos.");
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    throw new HttpError(401, "E-mail ou senha incorretos.");
  }
  await attachSession(res, user.id);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.auth!.userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  res.json({ user });
});

authRouter.post("/logout", requireAuth, async (req, res) => {
  const token = req.cookies[COOKIE_NAME] as string;
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.status(204).send();
});
