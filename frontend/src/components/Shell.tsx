import { useState, type ReactNode } from 'react';
import { CalendarDays, ChevronDown, HeartPulse, LayoutGrid, LogOut, Menu, PlusCircle, ShieldCheck, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brand } from './Brand';

const nav = [
  { href: '/dashboard', label: 'Visão geral', icon: LayoutGrid },
  { href: '/agendar', label: 'Agendar consulta', icon: PlusCircle },
  { href: '/minhas-consultas', label: 'Minhas consultas', icon: CalendarDays },
];

export function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const firstName = user?.name.split(' ')[0] ?? 'Paciente';

  async function handleLogout() {
    setLogoutError(null);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      setLogoutError('Não foi possível encerrar sua sessão. Tente novamente.');
      setProfileOpen(true);
    }
  }

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      {menuOpen && <button className="fixed inset-0 z-30 bg-navy-950/40 lg:hidden" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[270px] transform bg-navy-900 px-6 py-8 text-white shadow-panel transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-12 flex items-center justify-between"><Brand light /><button className="lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X size={22}/></button></div>
        <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">Menu principal</div>
        <nav className="space-y-1.5" aria-label="Navegação principal">
          {nav.map(({ href, label, icon: Icon }) => (
            <NavLink key={href} to={href} onClick={() => setMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-3.5 text-[14px] font-semibold transition ${isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <Icon size={19} strokeWidth={2} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-7 left-6 right-6">
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/10 p-5 text-white">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10"><HeartPulse size={21} className="text-sea-400" /></div>
            <p className="mb-1 text-sm font-bold">Cuidado com você</p>
            <p className="text-xs leading-relaxed text-white/60">Acompanhe suas consultas de um jeito simples.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/60"><ShieldCheck size={15} className="text-sea-600" /> Área segura do paciente</div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[82px] items-center justify-between border-b border-slate-100 bg-white/95 px-5 backdrop-blur sm:px-8 lg:px-11">
          <div className="flex items-center gap-4">
            <button onClick={() => setMenuOpen(true)} className="rounded-xl p-2 text-navy-900 lg:hidden" aria-label="Abrir menu"><Menu size={23} /></button>
            <div><p className="text-[12px] text-slate-400">Portal do paciente</p><p className="text-[15px] font-bold text-navy-900">Olá, {firstName} <span aria-hidden>👋</span></p></div>
          </div>
          <div className="relative">
            <button onClick={() => setProfileOpen(prev => !prev)} aria-expanded={profileOpen} className="flex items-center gap-3 rounded-xl px-1 py-1.5 hover:bg-slate-50">
              <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-sea-100 text-sm font-extrabold uppercase text-sea-700">{firstName.slice(0, 1)}</span>
              <span className="hidden max-w-40 truncate text-left text-[13px] font-bold text-navy-900 sm:inline">{user?.name}</span>
              <ChevronDown className="hidden text-slate-400 sm:block" size={16} />
            </button>
            {profileOpen && <div className="absolute right-0 top-14 w-60 rounded-2xl border border-slate-100 bg-white p-2 shadow-float">
              <p className="truncate border-b border-slate-100 px-3 py-2 text-xs text-slate-500">{user?.email}</p>
              {logoutError && <p role="alert" className="px-3 py-2 text-xs text-red-600">{logoutError}</p>}
              <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut size={17}/> Sair da conta</button>
            </div>}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1250px] px-5 pb-14 pt-9 sm:px-8 lg:px-11 lg:pt-11">{children}</main>
      </div>
    </div>
  );
}
