import axios, { AxiosHeaders } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';
import { Appointment } from '../types';

const normalizeToken = (token: string) => {
  const trimmed = token.trim();
  const hasBearerPrefix = /^Bearer\s+/i.test(trimmed);

  if (!trimmed) {
    return { headerToken: '', bearerToken: '' };
  }

  const bearerToken = hasBearerPrefix ? trimmed : `Bearer ${trimmed}`;

  return { headerToken: trimmed, bearerToken };
};

export const buildAuthHeaders = (token: string | null): Record<string, string> => {
  if (!token) {
    return {};
  }

  const { headerToken, bearerToken } = normalizeToken(token);

  const headers: Record<string, string> = {};

  if (headerToken) {
    headers['x-token'] = headerToken;
  }

  if (bearerToken) {
    headers.Authorization = bearerToken;
  }

  return headers;
};

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const storedToken =
      localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
      localStorage.getItem('exora_token');

    const authHeaders = buildAuthHeaders(storedToken);

    if (Object.keys(authHeaders).length > 0) {
      const headers = AxiosHeaders.from(config.headers ?? {});
      Object.entries(authHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      config.headers = headers;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      window.location.href = '/login';
    }
    
    return Promise.reject({
      message: error.response?.data?.message || error.message || 'Error de conexión',
      status: error.response?.status
    });
  }
);

export const apiService = {
  async getAppointments(date: string, empresa: string, professional?: string): Promise<Appointment[]> {
    const requestBody: any = {
      fecha: date,
      empresa: empresa
    };

    if (professional) {
      requestBody.profesional = professional;
    }

    const response = await apiClient.post('/citas/dia/profesional', requestBody);
    return response.data;
  }
};