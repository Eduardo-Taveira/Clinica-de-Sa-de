import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, authApi, type Patient } from '../lib/api';

type AuthContextValue = {
  user: Patient | null;
  checking: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Patient | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    authApi.me().then(({ user: current }) => {
      if (active) setUser(current);
    }).catch((error: unknown) => {
      if (active && !(error instanceof ApiError && error.status === 401)) {
        console.warn('Não foi possível verificar a sessão:', error);
      }
    }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: current } = await authApi.login(email, password);
    setUser(current);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { user: current } = await authApi.register(name, email, password);
    setUser(current);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, checking, login, register, logout }), [user, checking, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return value;
}
