import { useState, type FormEvent } from 'react';
import { ArrowRight, CalendarCheck2, CheckCircle2, Eye, EyeOff, Heart, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brand } from '../components/Brand';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!isLogin && password !== confirmPassword) return setError('As senhas informadas não coincidem.');
    if (!isLogin && password.length < 8) return setError('A senha precisa ter pelo menos 8 caracteres.');
    setLoading(true);
    try {
      if (isLogin) await login(email, password);
      else await register(name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível continuar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout bg-white lg:grid lg:grid-cols-[minmax(380px,48%)_1fr]">
      <aside className="auth-aside relative hidden overflow-hidden bg-navy-900 px-10 py-7 text-white lg:flex lg:flex-col xl:px-16">
        <div className="pointer-events-none absolute -left-40 top-[42%] h-[460px] w-[460px] rounded-full border border-sea-400/15" />
        <div className="pointer-events-none absolute -left-20 top-[38%] h-[460px] w-[460px] rounded-full border border-sea-400/15" />
        <div className="pointer-events-none absolute right-[-170px] top-32 h-[450px] w-[450px] rounded-full bg-sea-500/10 blur-[90px]" />

        <div className="relative z-10 shrink-0"><Brand light /></div>
        <div className="relative z-10 my-auto min-h-0 py-4">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-sea-200">
            <Heart size={15} fill="currentColor" /> Cuidar começa por aqui
          </div>
          <h1 className="max-w-[540px] text-[clamp(34px,3.8vw,58px)] font-bold leading-[1.1] tracking-[-0.055em]">
            Seu bem-estar merece <span className="text-sea-400">mais facilidade.</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-[1.6] text-white/70">
            Agende suas consultas em poucos passos, com liberdade para escolher o melhor horário para você.
          </p>
          <div className="auth-showcase relative mt-7 max-w-[390px] rounded-[22px] border border-white/15 bg-white/10 p-4 shadow-float backdrop-blur-md">
            <div className="flex items-center justify-between"><span className="text-sm font-bold">Sua próxima consulta</span><CalendarCheck2 className="text-sea-400" size={22} /></div>
            <div className="mt-3 rounded-2xl bg-white p-3.5 text-navy-900">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sea-50 text-sea-700"><CalendarCheck2 size={21} /></div>
                <div><p className="text-sm font-extrabold">Agende com tranquilidade</p><p className="mt-1 text-xs text-slate-400">No dia e horário que funcionar para você.</p></div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-semibold text-sea-700"><CheckCircle2 size={16} /> Simples, rápido e seguro</div>
            </div>
          </div>
        </div>
        <p className="relative z-10 shrink-0 flex items-center gap-2 text-xs text-white/50"><ShieldCheck size={15} /> Seus dados são tratados com segurança.</p>
      </aside>

      <main className="auth-main flex items-center justify-center px-5 py-7 sm:px-8 lg:px-8 lg:py-4 xl:px-12">
        <div className="auth-form w-full max-w-[440px]">
          <div className="mb-6 lg:hidden"><Brand /></div>
          <div className="auth-heading mb-6">
            <div className="mb-3 inline-flex rounded-full bg-sea-50 px-3 py-1.5 text-xs font-bold text-sea-700">Portal do paciente</div>
            <h2 className="text-[31px] font-extrabold leading-tight tracking-[-0.045em] text-navy-900 sm:text-[35px]">
              {isLogin ? 'Boas-vindas de volta!' : 'Vamos começar?'}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
              {isLogin ? 'Acesse sua conta para cuidar da sua agenda de saúde.' : 'Crie sua conta e agende sua primeira consulta.'}
            </p>
          </div>
          <form onSubmit={onSubmit} className="auth-fields space-y-4">
            {!isLogin && <div>
              <label htmlFor="name" className="input-label">Nome completo</label>
              <div className="input-wrap"><UserRound size={18} className="shrink-0 text-slate-400" />
                <input id="name" name="name" className="input-base" autoComplete="name" placeholder="Seu nome completo" minLength={2} maxLength={100} required value={name} onChange={e => setName(e.target.value)} />
              </div>
            </div>}
            <div>
              <label htmlFor="email" className="input-label">E-mail</label>
              <div className="input-wrap"><Mail size={18} className="shrink-0 text-slate-400" />
                <input id="email" name="email" className="input-base" type="email" autoComplete="email" placeholder="seuemail@exemplo.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="input-label">Senha</label>
              <div className="input-wrap"><LockKeyhole size={18} className="shrink-0 text-slate-400" />
                <input id="password" name="password" className="input-base" type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder={isLogin ? 'Sua senha' : 'Mínimo de 8 caracteres'} minLength={isLogin ? 1 : 8} required value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" className="p-1 text-slate-400 hover:text-navy-900" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
              </div>
            </div>
            {!isLogin && <div>
              <label htmlFor="confirmPassword" className="input-label">Confirmar senha</label>
              <div className="input-wrap"><LockKeyhole size={18} className="shrink-0 text-slate-400" />
                <input id="confirmPassword" name="confirmPassword" className="input-base" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Digite sua senha novamente" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
            </div>}
            {error && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
            <button className="btn-primary mt-1 w-full justify-center py-3.5" type="submit" disabled={loading}>
              {loading ? 'Aguarde...' : isLogin ? 'Entrar na minha conta' : 'Criar minha conta'} <ArrowRight size={18} />
            </button>
          </form>
          <p className="auth-switch mt-5 text-center text-sm text-slate-500">
            {isLogin ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}{' '}
            <Link className="font-extrabold text-sea-700 hover:underline" to={isLogin ? '/cadastro' : '/login'}>
              {isLogin ? 'Cadastre-se' : 'Fazer login'}
            </Link>
          </p>
          <p className="auth-footer mt-6 text-center text-xs text-slate-400">Vida Clínica · Portal de agendamentos</p>
        </div>
      </main>
    </div>
  );
}
