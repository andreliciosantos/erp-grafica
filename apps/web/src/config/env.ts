export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_URL || '/api/v1',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
};
