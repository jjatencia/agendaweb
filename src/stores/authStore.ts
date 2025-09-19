import { create } from 'zustand';
import toast from 'react-hot-toast';
import { AuthState, User } from '../types';
import { STORAGE_KEYS } from '../utils/constants';
import { AuthService } from '../services/authService';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const response = await AuthService.login({ email, password });

      if (response.ok && response.token && response.user) {
        const normalizedUser: User = {
          id: response.user._id,
          name: response.user.nombre,
          email: response.user.email,
          role: 'profesional'
        };

        // Store session in localStorage
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
        localStorage.setItem('exora_token', response.token);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(normalizedUser));

        set({
          user: normalizedUser,
          token: response.token,
          isAuthenticated: true
        });

        toast.success(`Bienvenido, ${response.user.nombre}`);
      } else {
        throw new Error(response.msg || 'Error de autenticación');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Error de autenticación');
      throw error;
    }
  },

  logout: () => {
    AuthService.logout();
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem('exora_token');
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);

    set({
      user: null,
      token: null,
      isAuthenticated: false
    });

    toast.success('Sesión cerrada correctamente');
  },

  checkAuth: () => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const legacyToken = localStorage.getItem('exora_token');
    const token = storedToken || legacyToken;

    if (!storedToken && legacyToken) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, legacyToken);
    }
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    
    if (token && userData) {
      try {
        const user: User = JSON.parse(userData);

        if (user?.id && user?.email) {
          set({
            user,
            token,
            isAuthenticated: true
          });
          return;
        }
      } catch (error) {
        // Invalid stored data, clear it
      }
    }

    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }
}));
