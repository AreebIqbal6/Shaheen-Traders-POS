import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { registerSW } from 'virtual:pwa-register'
import toast from 'react-hot-toast';

// Register PWA service worker with auto-update
const updateSW = registerSW({
  onOfflineReady() {
    console.log("App ready to work offline");
  },
});

// Capture PWA install prompt globally before React lazy loads views
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
});

// Track when app is successfully installed
window.addEventListener('appinstalled', () => {
  localStorage.setItem('shaheen_pwa_installed', 'true');
  console.log('PWA was installed');
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
