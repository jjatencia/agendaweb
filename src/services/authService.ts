import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';

export interface LoginCredentials {
  email: string;
  password: string;
}

interface RawLoginResponse {
  ok: boolean;
  token?: string;
  uid?: string;
  id?: string;
  nombre?: string;
  name?: string;
  email?: string;
  msg?: string;
  message?: string;
}

export interface LoginResponse {
  ok: boolean;
  token?: string;
  user?: {
    _id: string;
    nombre: string;
    email: string;
  };
  msg?: string;
}

const resolveUser = (
  response: RawLoginResponse,
  credentials: LoginCredentials
): LoginResponse['user'] | undefined => {
  if (!response.ok) {
    return undefined;
  }

  const id = response.uid || response.id;
  const name = response.nombre || response.name || credentials.email.split('@')[0];
  const email = response.email || credentials.email;

  if (!id || !name) {
    return undefined;
  }

  return {
    _id: id,
    nombre: name,
    email
  };
};

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/ext-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        let message = `Error HTTP ${response.status}`;

        try {
          const errorBody = await response.json();
          message = errorBody.msg || errorBody.message || message;
        } catch {
          // Mantener mensaje genérico si no se puede parsear
        }

        return {
          ok: false,
          msg: message
        };
      }

      const data: RawLoginResponse = await response.json();
      const user = resolveUser(data, credentials);

      if (data.ok && data.token) {
        this.setToken(data.token);
      }

      return {
        ok: data.ok,
        token: data.token,
        user,
        msg: data.msg || data.message
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        ok: false,
        msg: 'Error de conexión. Verifica tu internet.'
      };
    }
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem('exora_token', token);
  }

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
      localStorage.getItem('exora_token')
    );
  }

  static removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem('exora_token');
  }

  static isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  static logout(): void {
    this.removeToken();
  }
}
