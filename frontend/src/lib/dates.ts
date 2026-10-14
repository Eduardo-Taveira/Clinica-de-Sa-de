/** Trata datas civis sem convertê-las acidentalmente para outro fuso. */
export function localIsoAtClinic(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function dateForDisplay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function prettyDate(iso: string, opts: Intl.DateTimeFormatOptions = {
  day: '2-digit', month: 'long', year: 'numeric',
}): string {
  return new Intl.DateTimeFormat('pt-BR', { ...opts, timeZone: 'UTC' }).format(dateForDisplay(iso));
}

export function friendlyWeekday(iso: string): string {
  return prettyDate(iso, { weekday: 'long' });
}

export function isWeekendIso(iso: string): boolean {
  const day = dateForDisplay(iso).getUTCDay();
  return day === 0 || day === 6;
}

export function monthLabel(year: number, monthIndex: number): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, monthIndex, 1, 12)));
}

export function isoDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function nextBusinessDay(today = localIsoAtClinic()): string {
  const date = dateForDisplay(today);
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6) date.setUTCDate(date.getUTCDate() + 1);
  return isoDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Usado apenas para apresentar ações de UI; o backend revalida o horário. */
export function clinicLocalNow(): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}` };
}
