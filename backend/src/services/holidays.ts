import { z } from "zod";
import { HttpError } from "../lib/http-error";

const holidaysSchema = z.array(z.object({
  date: z.string(),
  name: z.string(),
  localName: z.string().optional(),
  global: z.boolean(),
  types: z.array(z.string()).optional(),
}));

type Holiday = z.infer<typeof holidaysSchema>[number];
const TTL_MS = 12 * 60 * 60 * 1000;
const cache = new Map<number, { expires: number; holidays: Holiday[] }>();

async function getHolidays(year: number): Promise<Holiday[]> {
  const saved = cache.get(year);
  if (saved && saved.expires > Date.now()) return saved.holidays;

  // Endpoint obrigatório do teste: para 2026 -> /PublicHolidays/2026/BR.
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/BR`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Nager.Date HTTP ${response.status}`);
    const parsed = holidaysSchema.safeParse(await response.json());
    if (!parsed.success) throw new Error("Resposta inválida da API de feriados");
    cache.set(year, { expires: Date.now() + TTL_MS, holidays: parsed.data });
    return parsed.data;
  } catch (error) {
    console.error("Falha na consulta de feriados:", error);
    // Falha de forma segura: não confirma reservas sem validar feriados.
    throw new HttpError(503, "Serviço de feriados indisponível. Tente novamente.");
  }
}

export async function nationalHolidayFor(date: string): Promise<string | null> {
  const year = Number(date.slice(0, 4));
  const holidays = await getHolidays(year);
  const match = holidays.find((holiday) =>
    holiday.date === date &&
    holiday.global &&
    (holiday.types === undefined || holiday.types.includes("Public"))
  );
  return match ? (match.localName ?? match.name) : null;
}
