export interface Patient {
  id: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'ADMIN';
  createdAt?: string;
}

export interface Specialty { id: string; name: string }
export interface ClinicLocation { id: string; name: string; city: string; neighborhood: string; address: string | null }
export interface DoctorClinicLocation extends ClinicLocation { weekdays: number[] }
export interface Doctor { id: string; name: string; specialty: Specialty; locations: DoctorClinicLocation[] }

export interface Appointment {
  id: string;
  date: string; // AAAA-MM-DD no fuso da clínica
  time: string; // HH:mm
  createdAt: string;
  doctor: Pick<Doctor, "id" | "name" | "specialty"> | null;
  location: ClinicLocation | null;
}

export interface Availability {
  date: string;
  timeZone: string;
  hours: { opening: string; closing: string; durationMinutes: number };
  availableTimes: string[];
  reason: 'WEEKEND' | 'HOLIDAY' | 'PAST_DATE' | 'DOCTOR_OFF' | null;
  holidayName?: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const baseUrl = (import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '/api' : 'http://localhost:3333')).replace(/\/$/, '');

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      credentials: 'include', // cookie HttpOnly gerenciado exclusivamente pelo navegador
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'Não foi possível conectar à API. Verifique se o backend está ligado na porta 3333.');
  }

  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const body = (data && typeof data === 'object') ? data as { error?: unknown } : null;
    throw new ApiError(response.status, typeof body?.error === 'string' ? body.error : `Erro HTTP ${response.status}.`);
  }
  return data as T;
}

export const authApi = {
  me: () => api<{ user: Patient }>('/auth/me'),
  register: (name: string, email: string, password: string) =>
    api<{ user: Patient }>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  login: (email: string, password: string) =>
    api<{ user: Patient }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => api<void>('/auth/logout', { method: 'POST' }),
};

export const catalogApi = {
  specialties: () => api<{ specialties: Specialty[] }>('/specialties'),
  locations: () => api<{ locations: ClinicLocation[] }>('/locations'),
  doctors: () => api<{ doctors: Doctor[] }>('/doctors'),
};

export const bookingApi = {
  available: (date: string, doctorId: string, locationId: string, signal?: AbortSignal) =>
    api<Availability>(`/available?${new URLSearchParams({ date, doctorId, locationId })}`, { signal }),
  list: () => api<{ appointments: Appointment[] }>('/appointments'),
  create: (date: string, time: string, doctorId: string, locationId: string) =>
    api<{ message: string; appointment: Appointment }>('/appointments', {
      method: 'POST', body: JSON.stringify({ date, time, doctorId, locationId }),
    }),
  cancel: (id: string) => api<void>(`/appointments/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
