import { ArrowUpRight, CalendarDays, Clock3, MapPin, Stethoscope, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { type Appointment } from '../lib/api';
import { clinicLocalNow, friendlyWeekday, prettyDate } from '../lib/dates';

interface AppointmentListProps {
  appointments: Appointment[];
  limit?: number;
  onCancel?: (appointment: Appointment) => void;
  cancellingId?: string | null;
}

export function AppointmentList({ appointments, limit, onCancel, cancellingId }: AppointmentListProps) {
  const items = typeof limit === 'number' ? appointments.slice(0, limit) : appointments;
  if (!items.length) return <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-7 py-12 text-center">
    <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-sea-700 shadow-sm"><CalendarDays size={27}/></div>
    <h3 className="mb-2 text-base font-bold text-navy-900">Nenhuma consulta por aqui</h3>
    <p className="mb-5 max-w-sm text-sm text-slate-500">Quando você fizer seu primeiro agendamento, os detalhes aparecerão aqui.</p>
    <Link className="inline-flex items-center gap-1.5 text-sm font-bold text-sea-700 hover:underline" to="/agendar">Agendar uma consulta <ArrowUpRight size={15}/></Link>
  </div>;

  const now = clinicLocalNow();
  return <div className="divide-y divide-slate-100">
    {items.map(appointment => {
      const canCancel = appointment.date > now.date || (appointment.date === now.date && appointment.time > now.time);
      const isPast = !canCancel;
      return <div key={appointment.id} className="flex flex-col gap-3 py-5 first:pt-1 last:pb-1 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-2xl bg-sea-50 text-sea-700"><CalendarDays size={24}/></div>
          <div className="min-w-0"><p className="text-[15px] font-bold text-navy-900">{appointment.doctor?.name ?? 'Consulta agendada'}</p>
          {appointment.doctor?.specialty && <p className="mt-1 flex items-center gap-1 text-xs text-sea-700"><Stethoscope size={13}/>{appointment.doctor.specialty.name}</p>}
          <p className="mt-1 text-sm capitalize text-slate-500">{friendlyWeekday(appointment.date)} · {prettyDate(appointment.date)}</p>
          {appointment.location && <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13}/>{appointment.location.name} · {appointment.location.neighborhood}, {appointment.location.city}</p>}</div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          <span className="flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-navy-900"><Clock3 size={15} className="text-sea-700" />{appointment.time}</span>
          <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${isPast ? 'bg-slate-100 text-slate-500' : 'bg-sea-50 text-sea-700'}`}>{isPast ? 'Data passada' : 'Confirmada'}</span>
          {onCancel && canCancel && <button type="button" onClick={() => onCancel(appointment)} disabled={Boolean(cancellingId)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50" aria-label={`Cancelar consulta de ${prettyDate(appointment.date)} às ${appointment.time}`}><XCircle size={15} />Cancelar</button>}
        </div>
      </div>;
    })}
  </div>;
}
