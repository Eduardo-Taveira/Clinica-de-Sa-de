import type { RequestHandler } from "express";
import { createHash } from "node:crypto";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http-error";

export const COOKIE_NAME = "clinica_session";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (typeof token !== "string" || token.length !== 64 || !/^[a-f0-9]+$/.test(token)) {
    return next(new HttpError(401, "Faça login para continuar."));
  }
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { userId: true, expiresAt: true, user: { select: { role: true } } },
  });
  if (!session || session.expiresAt <= new Date()) {
    return next(new HttpError(401, "Sessão inválida ou expirada."));
  }
  req.auth = { userId: session.userId, role: session.user.role };
  next();
};
