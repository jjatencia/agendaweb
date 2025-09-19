import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';
import { Appointment } from '../types';

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
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      if (!config.headers) {
        config.headers = {} as any;
      }
      (config.headers as Record<string, string>)['x-token'] = token;
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
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