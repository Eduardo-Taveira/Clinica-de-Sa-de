import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { HttpError } from "./lib/http-error";
import { authRouter } from "./routes/auth";
import { appointmentsRouter } from "./routes/appointments";
import { catalogRouter } from "./routes/catalog";

export const app = express();
app.disable("x-powered-by");
app.use(helmet());
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

// Mitigação básica de CSRF: mutações vindas de navegador precisam usar a origem esperada.
app.use((req, _res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.get("origin");
    if (origin !== frontendOrigin) return next(new HttpError(403, "Origem não permitida."));
  }
  next();
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false }), authRouter);
app.use(catalogRouter);
app.use(appointmentsRouter);
app.use((_req, _res, next) => next(new HttpError(404, "Rota não encontrada.")));

const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message, ...(error.details ? { details: error.details } : {}) });
    return;
  }
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: "JSON inválido." });
    return;
  }
  console.error("Erro interno:", error);
  res.status(500).json({ error: "Erro interno no servidor." });
};
app.use(errorHandler);
