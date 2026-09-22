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
