import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import './index.css';

// Initialize persistent auth session & theme before render
useAuthStore.getState().initialize();
useThemeStore.getState().initialize();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element to mount application.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register PWA Service Worker in supporting environments
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registrado com escopo:', registration.scope);
      })
      .catch((error) => {
        console.warn('[PWA] Falha ao registrar Service Worker:', error);
      });
  });
}

