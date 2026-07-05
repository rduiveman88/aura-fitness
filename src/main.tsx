import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Capacitor } from '@capacitor/core';

// Patch global fetch to support custom backend URLs for mobile devices
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  let url = typeof input === 'string' ? input : input.url;
  
  if (url.startsWith('/api/')) {
    let backendUrl = localStorage.getItem('aura_backend_url');
    if (!backendUrl) {
      if (Capacitor.isNativePlatform()) {
        // Fallback to live production server URL
        backendUrl = 'https://duiveman.onrender.com';
      } else {
        backendUrl = '';
      }
    }
    
    if (backendUrl) {
      const base = backendUrl.replace(/\/$/, '');
      url = `${base}${url}`;
      
      if (typeof input === 'string') {
        input = url;
      } else {
        input = new Request(url, input);
      }
    }
  }
  
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
