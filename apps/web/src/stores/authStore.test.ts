import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import { Role } from '../types';

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  it('should initialize with default unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('should login user and persist tokens into localStorage', () => {
    const mockUser = {
      id: 'usr-1',
      name: 'Diretor Grafica',
      email: 'admin@grafica.com',
      role: Role.ADMIN,
    };

    useAuthStore.getState().login('mock-access-token', 'mock-refresh-token', mockUser);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('mock-access-token');

    expect(localStorage.getItem('erp_access_token')).toBe('mock-access-token');
    expect(localStorage.getItem('erp_refresh_token')).toBe('mock-refresh-token');
    expect(JSON.parse(localStorage.getItem('erp_user')!)).toEqual(mockUser);
  });

  it('should logout user and clear localStorage', () => {
    const mockUser = {
      id: 'usr-2',
      name: 'Operador Heidel',
      email: 'operador@grafica.com',
      role: Role.OPERATOR,
    };

    useAuthStore.getState().login('token-123', 'refresh-123', mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(localStorage.getItem('erp_access_token')).toBeNull();
    expect(localStorage.getItem('erp_user')).toBeNull();
  });

  it('should restore authenticated session on initialize when valid localStorage exists', () => {
    const mockUser = {
      id: 'usr-3',
      name: 'Vendedor Comercial',
      email: 'comercial@grafica.com',
      role: Role.COMMERCIAL,
    };

    localStorage.setItem('erp_access_token', 'stored-token-abc');
    localStorage.setItem('erp_user', JSON.stringify(mockUser));

    useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('stored-token-abc');
  });

  it('should handle corrupted json in localStorage during initialize gracefully', () => {
    localStorage.setItem('erp_access_token', 'stored-token-abc');
    localStorage.setItem('erp_user', '{bad-json}');

    useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(localStorage.getItem('erp_access_token')).toBeNull();
  });
});
