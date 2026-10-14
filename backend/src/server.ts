import { app } from "./app";
import { prisma } from "./lib/prisma";

const port = Number(process.env.PORT ?? 3333);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT deve ser um número de 1 a 65535.");
}

const server = app.listen(port, () => {
  console.log(`API de agendamento em http://localhost:${port}`);
});

async function shutdown(): Promise<void> {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
