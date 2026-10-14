import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarCheck2, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Info, LoaderCircle, MapPin, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError, bookingApi, catalogApi, type Availability, type ClinicLocation, type Doctor, type Specialty } from '../lib/api';
import { dateForDisplay, friendlyWeekday, isoDate, isWeekendIso, localIsoAtClinic, monthLabel, nextBusinessDay, prettyDate } from '../lib/dates';

const weekDays = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
const names = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function nextOnSchedule(days: number[]): string {
  const candidate = dateForDisplay(nextBusinessDay());
  for (let offset = 0; offset < 21; offset++) {
    const wd = candidate.getUTCDay();
    if (days.includes(wd)) return isoDate(candidate.getUTCFullYear(), candidate.getUTCMonth(), candidate.getUTCDate());
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }
  return nextBusinessDay();
}

function CalendarPicker({ value, onChange, allowedDays }: { value: string; onChange: (date: string) => void; allowedDays: number[] }) {
  const [year, monthString] = value.split('-');
  const [view, setView] = useState({ year: Number(year), month: Number(monthString) - 1 });
  useEffect(() => setView({ year: Number(value.slice(0, 4)), month: Number(value.slice(5, 7)) - 1 }), [value.slice(0, 7)]);
  const pad = (new Date(Date.UTC(view.year, view.month, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const today = localIsoAtClinic();
  const slots: (number | null)[] = [...Array<null>(pad).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (slots.length % 7 !== 0) slots.push(null);
  const viewingPast = `${view.year}-${String(view.month + 1).padStart(2, '0')}` < today.slice(0, 7);
  function monthStep(offset: number) {
    const next = new Date(Date.UTC(view.year, view.month + offset, 1));
    setView({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
  }

  return <div>
    <div className="mb-7 flex items-center justify-between"><h3 className="text-[17px] font-extrabold capitalize text-navy-900">{monthLabel(view.year, view.month)}</h3>
      <div className="flex gap-2"><button type="button" onClick={() => monthStep(-1)} disabled={viewingPast} className="calendar-arrow" aria-label="Mês anterior"><ChevronLeft size={19}/></button><button type="button" onClick={() => monthStep(1)} className="calendar-arrow" aria-label="Próximo mês"><ChevronRight size={19}/></button></div>
    </div>
    <div className="grid grid-cols-7 gap-1.5 text-center">{weekDays.map(d => <span key={d} className="pb-3 text-[11px] font-bold uppercase text-slate-400">{d}</span>)}
      {slots.map((day, i) => {
        if (day === null) return <span key={`pad-${i}`} className="h-[43px]"/>;
        const iso = isoDate(view.year, view.month, day);
        const disabled = iso < today || isWeekendIso(iso) || !allowedDays.includes(dateForDisplay(iso).getUTCDay());
        const active = iso === value;
        return <button key={iso} type="button" disabled={disabled} onClick={() => onChange(iso)} aria-pressed={active} aria-label={prettyDate(iso)} title={disabled ? 'Médico não atende nesta data' : undefined}
          className={`h-[43px] rounded-xl text-sm font-semibold transition ${active ? 'bg-sea-600 text-white shadow-md shadow-sea-500/20' : disabled ? 'cursor-not-allowed text-slate-300' : iso === today ? 'border border-sea-300 text-sea-700 hover:bg-sea-50' : 'text-navy-800 hover:bg-slate-100'}`}>{day}</button>;
      })}
    </div>
    <p className="mt-6 flex items-center gap-2 text-xs text-slate-400"><Info size={15}/> Datas sem expediente do médico ficam indisponíveis.</p>
  </div>;
}

function availabilityMessage(data: Availability | null): string | null {
  if (!data) return null;
  if (data.reason === 'HOLIDAY') return `Não há atendimento nesta data: ${data.holidayName ?? 'feriado nacional'}.`;
  if (data.reason === 'WEEKEND') return 'Não atendemos aos finais de semana.';
  if (data.reason === 'PAST_DATE') return 'Selecione uma data futura.';
  if (data.reason === 'DOCTOR_OFF') return 'Este médico não atende nesta unidade na data selecionada.';
  if (!data.availableTimes.length) return 'Não há horários livres nessa data. Experimente outro dia.';
  return null;
}

export function BookingPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [locations, setLocations] = useState<ClinicLocation[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [specialtyId, setSpecialtyId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(nextBusinessDay);
  const [time, setTime] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ date: string; time: string; id: string; doctor: string; location: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([catalogApi.specialties(), catalogApi.locations(), catalogApi.doctors()])
      .then(([a, b, c]) => { if (mounted) { setSpecialties(a.specialties); setLocations(b.locations); setDoctors(c.doctors); } })
      .catch((e: unknown) => { if (mounted) setCatalogError(e instanceof Error ? e.message : 'Falha ao carregar catálogo.'); })
      .finally(() => { if (mounted) setCatalogLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filteredDoctors = useMemo(() => doctors.filter(d => d.specialty.id === specialtyId && d.locations.some(l => l.id === locationId)), [doctors, specialtyId, locationId]);
  const doctor = doctors.find(d => d.id === doctorId);
  const location = locations.find(l => l.id === locationId);
  const days = doctor?.locations.find(l => l.id === locationId)?.weekdays ?? [];

  // Recarrega horários sempre que médico, unidade ou data mudar.
  useEffect(() => {
    if (!doctorId || !locationId) { setAvailability(null); setTime(null); setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true); setAvailability(null); setTime(null); setError(null); setSuccess(null);
    bookingApi.available(date, doctorId, locationId, controller.signal)
      .then(result => { if (!controller.signal.aborted) setAvailability(result); })
      .catch((e: unknown) => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Falha ao consultar horários.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [date, doctorId, locationId]);

  function chooseDoctor(id: string) {
    setDoctorId(id); setTime(null); setSuccess(null);
    const item = filteredDoctors.find(d => d.id === id);
    const workdays = item?.locations.find(l => l.id === locationId)?.weekdays ?? [];
    if (workdays.length) setDate(nextOnSchedule(workdays));
  }

  async function onBooking() {
    if (!time || !doctorId || !locationId || booking) return;
    const bookedTime = time;
    setBooking(true); setError(null);
    try {
      const { appointment } = await bookingApi.create(date, bookedTime, doctorId, locationId);
      setSuccess({ date: appointment.date, time: appointment.time, id: appointment.id, doctor: doctor?.name ?? '', location: location?.name ?? '' });
      setTime(null);
      try { setAvailability(await bookingApi.available(date, doctorId, locationId)); }
      catch { setAvailability(current => current ? { ...current, availableTimes: current.availableTimes.filter(slot => slot !== bookedTime) } : current); }
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('Este horário acabou de ficar indisponível. Escolha outro horário.'); setTime(null);
        try { setAvailability(await bookingApi.available(date, doctorId, locationId)); } catch { /* preservar erro */ }
      } else setError(e instanceof Error ? e.message : 'Não foi possível confirmar a consulta.');
    } finally { setBooking(false); }
  }

  return <div className="space-y-8">
    <div><span className="eyebrow">Agendamento online</span><h1 className="page-title">Agendar consulta</h1><p className="page-description">Escolha sua especialidade, a unidade e o médico. Depois, selecione uma data e horário.</p></div>
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800"><Info size={15} className="mr-2 inline"/> Profissionais e unidades fictícios para demonstração. Os nomes não representam médicos ou clínicas reais.</p>
    {catalogLoading && <div className="panel flex items-center gap-3"><LoaderCircle className="animate-spin text-sea-600"/> Carregando especialidades e unidades...</div>}
    {catalogError && <div role="alert" className="panel text-red-700">{catalogError} <button type="button" onClick={() => window.location.reload()} className="ml-3 font-bold underline">Tentar novamente</button></div>}
    {!catalogLoading && !catalogError && <>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel"><div className="mb-5 flex items-center gap-3"><span className="step-number">1</span><div><h2 className="panel-title">Especialidade</h2><p className="text-sm text-slate-500">Que tipo de consulta você precisa?</p></div></div>
          <label htmlFor="specialty" className="mb-2 block text-xs font-bold text-navy-900">Escolha a especialidade</label>
          <div className="relative"><Stethoscope className="pointer-events-none absolute left-4 top-3.5 text-sea-700" size={20}/><select id="specialty" className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-5 text-sm font-semibold text-navy-900 outline-none focus:border-sea-500" value={specialtyId} onChange={e => { setSpecialtyId(e.target.value); setDoctorId(''); setSuccess(null); }}><option value="">Selecione...</option>{specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        </section>
        <section className="panel"><div className="mb-5 flex items-center gap-3"><span className="step-number">2</span><div><h2 className="panel-title">Unidade de atendimento</h2><p className="text-sm text-slate-500">Onde você prefere ser atendido?</p></div></div>
          <div className="space-y-2.5">{locations.map(loc => <button key={loc.id} type="button" aria-pressed={locationId === loc.id} onClick={() => { setLocationId(loc.id); setDoctorId(''); setSuccess(null); }} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${locationId === loc.id ? 'border-sea-600 bg-sea-50' : 'border-slate-200 hover:border-sea-300 hover:bg-slate-50'}`}><MapPin size={19} className="shrink-0 text-sea-700"/><span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-navy-900">{loc.name}</span><span className="text-xs text-slate-500">{loc.neighborhood} · {loc.city}</span></span>{locationId === loc.id && <CheckCircle2 size={18} className="text-sea-700"/>}</button>)}</div>
        </section>
      </div>
      {specialtyId && locationId && <section className="panel"><div className="mb-5 flex items-center gap-3"><span className="step-number">3</span><div><h2 className="panel-title">Selecione seu médico</h2><p className="text-sm text-slate-500">Profissionais de {specialties.find(s => s.id === specialtyId)?.name} em {location?.name}</p></div></div>
        {!filteredDoctors.length ? <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">Não há médicos desta especialidade nesta unidade. Experimente outra localização.</p> : <div className="grid gap-3 sm:grid-cols-2">{filteredDoctors.map(d => {
          const workdays = d.locations.find(l => l.id === locationId)?.weekdays ?? [];
          return <button key={d.id} type="button" aria-pressed={doctorId === d.id} onClick={() => chooseDoctor(d.id)} className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition ${doctorId === d.id ? 'border-sea-600 bg-sea-50 shadow-sm' : 'border-slate-200 bg-white hover:border-sea-300'}`}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sea-100 text-sea-700"><UserRound size={22}/></span><span className="min-w-0 flex-1"><span className="block text-base font-extrabold text-navy-900">{d.name}</span><span className="block text-xs text-slate-500">{d.specialty.name}</span><span className="mt-2 block text-xs text-sea-700">Atende: {workdays.map(i => names[i]).join(' · ')}</span></span>{doctorId === d.id && <CheckCircle2 className="shrink-0 text-sea-700" size={19}/>}</button>;
        })}</div>}
      </section>}
      {doctor && location && <>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,.82fr)]">
          <section className="panel"><div className="mb-7 flex items-center gap-3"><span className="step-number">4</span><div><h2 className="panel-title">Selecione uma data</h2><p className="text-sm text-slate-500">Conforme os dias de atendimento do médico.</p></div></div><CalendarPicker value={date} onChange={setDate} allowedDays={days}/></section>
          <section className="panel"><div className="mb-6 flex items-center gap-3"><span className="step-number">5</span><div><h2 className="panel-title">Escolha um horário</h2><p className="text-sm text-slate-500 capitalize">{friendlyWeekday(date)}, {prettyDate(date)}</p></div></div>
            {loading ? <div className="flex min-h-[230px] items-center justify-center gap-3 text-sm text-slate-500"><LoaderCircle className="animate-spin text-sea-600" size={20}/> Buscando horários...</div>
            : error && !availability ? <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
            : availabilityMessage(availability) ? <div className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl bg-slate-50 p-5 text-center"><CalendarDays className="mb-3 text-slate-400" size={30}/><p className="max-w-xs text-sm leading-relaxed text-slate-600">{availabilityMessage(availability)}</p></div>
            : <div><p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{availability?.availableTimes.length ?? 0} horários disponíveis</p><div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-3">{availability?.availableTimes.map(slot => <button key={slot} type="button" aria-pressed={time === slot} onClick={() => { setTime(slot); setSuccess(null); setError(null); }} className={`rounded-xl border px-3 py-3.5 text-sm font-bold transition ${time === slot ? 'border-sea-600 bg-sea-600 text-white' : 'border-slate-200 bg-white text-navy-900 hover:border-sea-500 hover:bg-sea-50'}`}>{slot}</button>)}</div></div>}
            <div className="mt-7 flex items-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-500"><Clock3 size={16} className="text-sea-700"/> Cada consulta tem duração de 1 hora.</div>
          </section>
        </div>
        <section className="panel flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sea-50 text-sea-700"><CalendarCheck2 size={22}/></span><div><h2 className="text-base font-extrabold text-navy-900">Confirmar agendamento</h2><p className="mt-1 text-sm text-slate-500">{doctor.name} · {location.name}, {location.city}</p><p className="mt-1 text-sm text-slate-500">{time ? `${prettyDate(date)} às ${time} · 1 hora` : 'Escolha um horário para continuar.'}</p></div></div>
          <button type="button" onClick={onBooking} disabled={!time || loading || booking} className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-40">{booking ? 'Confirmando...' : 'Confirmar consulta'} {booking ? <LoaderCircle size={18} className="animate-spin"/> : <ArrowRight size={18}/>}</button>
        </section>
      </>}
    </>}
    {success && <div role="status" className="flex flex-wrap items-start gap-4 rounded-2xl border border-sea-100 bg-sea-50 p-5"><CheckCircle2 className="mt-0.5 shrink-0 text-sea-700" size={24}/><div className="min-w-0 flex-1"><p className="font-extrabold text-sea-800">Consulta confirmada!</p><p className="mt-1 text-sm text-sea-800">{success.doctor} · {success.location} · {prettyDate(success.date)} às {success.time}</p><p className="mt-1 text-xs text-sea-700">Protocolo: {success.id.slice(0, 8)}</p></div><Link to="/minhas-consultas" className="inline-flex items-center gap-1 text-sm font-bold text-sea-800 hover:underline">Ver consultas <ArrowRight size={16}/></Link></div>}
    {error && availability && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</p>}
    <p className="flex items-center gap-2 text-xs text-slate-400"><ShieldCheck size={16} className="text-sea-600"/> Disponibilidade verificada pelo backend, inclusive feriados e conflitos de horário.</p>
  </div>;
}
