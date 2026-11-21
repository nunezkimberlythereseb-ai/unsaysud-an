import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register the VitePWA Workbox Service Worker so the app works reliably offline
registerSW({
  immediate: true,
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent('pwa:offline-ready'));
  },
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('pwa:need-refresh'));
  },
  onRegisterError(err) {
    console.warn('Service worker registration error:', err);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
