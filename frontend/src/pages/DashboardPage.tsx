import { useEffect, useState } from 'react';
import { ArrowRight, CalendarCheck2, CalendarDays, CalendarPlus2, Check, Clock3, HeartPulse } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppointmentList } from '../components/AppointmentList';
import { useAuth } from '../contexts/AuthContext';
import { bookingApi, type Appointment } from '../lib/api';
import { localIsoAtClinic, prettyDate } from '../lib/dates';

export function DashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = localIsoAtClinic();
  useEffect(() => {
    let active = true;
    bookingApi.list().then(({ appointments }) => { if (active) setAppointments(appointments); })
      .catch((error: unknown) => { if (active) setError(error instanceof Error ? error.message : 'Não foi possível carregar as consultas.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const upcoming = appointments.filter(a => a.date >= today);
  const next = upcoming[0];

  return <div className="space-y-8">
    <div><span className="eyebrow">Visão geral</span><h1 className="page-title">Seu espaço de cuidado <span className="text-sea-600">✳</span></h1><p className="page-description">Que bom ter você por aqui, {user?.name.split(' ')[0]}. Vamos cuidar da sua agenda?</p></div>
    <section className="relative overflow-hidden rounded-[26px] bg-navy-900 px-7 py-9 text-white sm:px-10 sm:py-11">
      <div className="absolute -right-24 -top-24 h-[350px] w-[350px] rounded-full border-[55px] border-white/[.045]" />
      <div className="absolute bottom-[-140px] right-16 h-[320px] w-[320px] rounded-full bg-sea-500/20 blur-3xl" />
      <div className="relative z-10 max-w-[720px]">
        <div className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-sea-200"><HeartPulse size={16}/> Sua agenda de saúde</div>
        <h2 className="max-w-xl text-[31px] font-bold leading-tight tracking-[-.04em] sm:text-[40px]">{loading ? 'Verificando suas consultas...' : next ? 'Sua próxima consulta está marcada!' : 'Sua saúde, no seu tempo.'}</h2>
        <p className="mt-4 max-w-xl text-[15px] leading-[1.8] text-white/80">{next ? `${next.doctor?.name ?? "Consulta"} · ${next.location?.name ?? "Unidade"} · ${prettyDate(next.date)} às ${next.time}` : 'Selecione o dia e o horário que combinam com você. Tudo em poucos cliques.'}</p>
        <Link to="/agendar" className="mt-7 inline-flex items-center gap-3 rounded-xl bg-sea-400 px-5 py-3.5 text-sm font-extrabold text-navy-950 transition hover:bg-sea-200">{next ? 'Agendar outra consulta' : 'Agendar consulta'} <ArrowRight size={17}/></Link>
      </div>
    </section>
    <section className="grid gap-4 sm:grid-cols-3">
      <div className="stat-card"><span className="stat-icon bg-sea-50 text-sea-700"><CalendarCheck2 size={21}/></span><p className="stat-label">Próximas consultas</p><p className="stat-number">{loading ? '—' : upcoming.length}</p></div>
      <div className="stat-card"><span className="stat-icon bg-blue-50 text-blue-600"><CalendarDays size={21}/></span><p className="stat-label">Consultas registradas</p><p className="stat-number">{loading ? '—' : appointments.length}</p></div>
      <div className="stat-card"><span className="stat-icon bg-amber-50 text-amber-600"><Clock3 size={21}/></span><p className="stat-label">Próximo horário</p><p className="stat-number text-[26px]">{loading ? '—' : next ? `${next.time}` : '—'}</p><p className="mt-1 text-xs text-slate-400">{next ? prettyDate(next.date) : 'Nenhum agendamento futuro'}</p></div>
    </section>
    <section className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <div className="panel"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h2 className="panel-title">Próximas consultas</h2><p className="mt-1 text-sm text-slate-500">Acompanhe seus compromissos de saúde.</p></div><Link to="/minhas-consultas" className="inline-flex items-center gap-1 text-sm font-bold text-sea-700 hover:underline">Ver todas <ArrowRight size={15}/></Link></div>
        {loading ? <p className="py-8 text-sm text-slate-500">Carregando consultas...</p> : error ? <p role="alert" className="py-5 text-sm text-red-600">{error}</p> : <AppointmentList appointments={upcoming} limit={3}/>}
      </div>
      <div className="rounded-[23px] border border-sea-100 bg-sea-50 p-7"><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-white text-sea-700"><CalendarPlus2 size={23}/></div>
        <h3 className="text-[19px] font-bold tracking-tight text-navy-900">Sua agenda, do seu jeito.</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">Confira horários livres em dias úteis e confirme sua consulta em poucos cliques.</p>
        <div className="mt-6 flex items-center gap-2 text-[12px] font-semibold text-sea-800"><Check size={17}/> Sem agendamentos em feriados</div>
        <div className="mt-2 flex items-center gap-2 text-[12px] font-semibold text-sea-800"><Check size={17}/> Horários atualizados</div>
        <Link to="/agendar" className="mt-7 inline-flex items-center gap-1 text-sm font-bold text-sea-700 hover:underline">Escolher horário <ArrowRight size={16}/></Link>
      </div>
    </section>
  </div>;
}
