export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  empresa?: string;
}

export interface Usuario {
  _id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  deleted: boolean;
  saldoMonedero: number;
  delayType: string;
  delay: string;
  comentarios: (string | any)[];
}

export interface Sucursal {
  _id: string;
  nombre: string;
  direccion: string;
  poblacion: string;
  horarioTxt: string[];
  deleted: boolean;
}

export interface Profesional {
  _id: string;
  nombre: string;
  color: string;
  deleted: boolean;
  delayType: string;
  delay: string;
  valoracion: string;
}

export interface Servicio {
  _id: string;
  nombre: string;
  duracion: string;
  precio: number;
  deleted: boolean;
  variantes: string[];
}

export interface Variante {
  _id: string;
  nombre: string;
  precio?: number; // Precio adicional en centavos (opcional)
  // Campos adicionales para facturación (opcional para retrocompatibilidad)
  empresa?: string;
  descripcion?: string;
  tiempo?: number;
  valor?: number;
  valorType?: string;
  servicios?: string[];
  productos?: any[];
  deleted?: boolean;
}

export interface Recordatorios {
  m1: boolean;
  m2: boolean;
  m3: boolean;
  m4: boolean;
  m5: boolean;
  m6: boolean;
}

export interface Appointment {
  recordatorios: Recordatorios;
  _id: string;
  usuario: Usuario;
  usuarioDelayType: string;
  usuarioDelay: string;
  empresa: string;
  sucursal: Sucursal;
  profesional: Profesional;
  profesionalDelayType: string;
  profesionalDelay: string;
  fecha: string;
  importe: number;
  descuentos: any[];
  promocion: any[];
  servicios: Servicio[];
  comentarios: (string | any)[];
  tieneHijas: boolean;
  duracion: string;
  pagada: boolean;
  prepago: boolean;
  variantes: Variante[];
  complementarios: any[];
  isProfesionalRandom: boolean;
  estado: string;
  deleted: boolean;
  metodoPago: string;
  creacion: string;
  modificacion: string;
  venta?: string;
  // Campo para caché de emergencia
  _cached_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export interface AppointmentState {
  appointments: Appointment[];
  filteredAppointments: Appointment[];
  currentDate: string;
  currentIndex: number;
  showPaidOnly: boolean;
  viewMode: ViewMode;
  isLoading: boolean;
  error: string | null;
  fetchAppointments: (date: string) => Promise<void>;
  setCurrentIndex: (index: number) => void;
  setCurrentDate: (date: string) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleShowPaid: () => void;
  clearError: () => void;
  clearCache: () => void;
  refreshCurrentData: () => Promise<void> | undefined;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  status?: number;
}

export enum ViewMode {
  CARDS = 'cards',
  DAY = 'day',
  WEEK = 'week'
}