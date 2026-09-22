import { create } from 'zustand';
import { Role } from '../types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  login: (accessToken, refreshToken, user) => {
    localStorage.setItem('erp_access_token', accessToken);
    localStorage.setItem('erp_refresh_token', refreshToken);
    localStorage.setItem('erp_user', JSON.stringify(user));
    set({
      accessToken,
      user,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem('erp_access_token');
    localStorage.removeItem('erp_refresh_token');
    localStorage.removeItem('erp_user');
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    });
  },

  initialize: () => {
    const token = localStorage.getItem('erp_access_token');
    const userJson = localStorage.getItem('erp_user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as AuthUser;
        set({
          accessToken: token,
          user,
          isAuthenticated: true,
        });
      } catch {
        localStorage.removeItem('erp_access_token');
        localStorage.removeItem('erp_user');
      }
    }
  },
}));
