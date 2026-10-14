import { useEffect, useState } from 'react';
import { ArrowRight, CalendarCheck2, TriangleAlert, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppointmentList } from '../components/AppointmentList';
import { bookingApi, type Appointment } from '../lib/api';
import { prettyDate } from '../lib/dates';

export function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<Appointment | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    bookingApi.list().then(({ appointments }) => { if (active) setAppointments(appointments); })
      .catch((error: unknown) => { if (active) setError(error instanceof Error ? error.message : 'Não foi possível carregar as consultas.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!pending) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !cancellingId) setPending(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, cancellingId]);

  function requestCancel(appointment: Appointment) {
    setNotice(null);
    setCancelError(null);
    setPending(appointment);
  }

  async function confirmCancel() {
    if (!pending || cancellingId) return;
    setCancellingId(pending.id);
    setCancelError(null);
    try {
      await bookingApi.cancel(pending.id);
      setAppointments(current => current.filter(appointment => appointment.id !== pending.id));
      setPending(null);
      setNotice('Consulta cancelada com sucesso. O horário está disponível para outro agendamento.');
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : 'Não foi possível cancelar a consulta.');
    } finally {
      setCancellingId(null);
    }
  }

  return <div className="space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div><span className="eyebrow">Minha agenda</span><h1 className="page-title">Minhas consultas</h1><p className="page-description">Todos os seus agendamentos em um só lugar.</p></div>
      <Link to="/agendar" className="btn-primary">Nova consulta <ArrowRight size={18}/></Link>
    </div>
    {notice && <div role="status" className="rounded-xl border border-sea-200 bg-sea-50 px-5 py-4 text-sm font-semibold text-sea-800">{notice}</div>}
    <div className="panel">
      <div className="mb-7 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-sea-50 text-sea-700"><CalendarCheck2 size={22}/></span>
        <div><h2 className="panel-title">Agendamentos registrados</h2><p className="text-xs text-slate-500">{loading ? 'Carregando...' : `${appointments.length} consulta(s) encontrada(s)`}</p></div>
      </div>
      {loading ? <p className="py-12 text-sm text-slate-500">Carregando consultas...</p>
        : error ? <p role="alert" className="py-12 text-sm text-red-600">{error}</p>
        : <AppointmentList appointments={appointments} onCancel={requestCancel} cancellingId={cancellingId} />}
    </div>

    {pending && <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 px-4 py-6" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !cancellingId) setPending(null); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="cancel-title" aria-describedby="cancel-description" className="w-full max-w-md rounded-[23px] bg-white p-6 shadow-float sm:p-8">
        <div className="mb-5 flex items-start justify-between gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600"><TriangleAlert size={24}/></span>
          <button type="button" aria-label="Fechar confirmação" onClick={() => setPending(null)} disabled={Boolean(cancellingId)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X size={20}/></button>
        </div>
        <h2 id="cancel-title" className="text-[22px] font-extrabold text-navy-900">Cancelar esta consulta?</h2>
        <p id="cancel-description" className="mt-3 text-sm leading-relaxed text-slate-600">Você está prestes a cancelar o agendamento de <strong>{pending.doctor?.name ?? "consulta"}, {prettyDate(pending.date)}, às {pending.time}, em {pending.location?.name ?? "nossa clínica"}</strong>. O horário ficará livre para outro paciente e esta ação não poderá ser desfeita.</p>
        {cancelError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{cancelError}</p>}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => setPending(null)} disabled={Boolean(cancellingId)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-navy-900 hover:bg-slate-50 disabled:opacity-50">Manter consulta</button>
          <button type="button" onClick={confirmCancel} disabled={Boolean(cancellingId)} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60">{cancellingId ? 'Cancelando...' : 'Sim, cancelar consulta'}</button>
        </div>
      </div>
    </div>}
  </div>;
}
