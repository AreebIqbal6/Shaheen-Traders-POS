import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { registerSW } from 'virtual:pwa-register'
import toast from 'react-hot-toast';

// Register PWA service worker with manual prompt
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    toast(
      (t) => (
        <div 
          onClick={() => updateSW(true)} 
          style={{ cursor: 'pointer', fontWeight: 'bold' }}
        >
          🚀 New update available! Click here to reload.
        </div>
      ),
      {
        duration: Infinity,
        position: 'top-center',
        style: {
          background: '#3b82f6',
          color: '#fff',
        }
      }
    );
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
});

// Check for updates every 15 minutes
setInterval(() => {
  updateSW(false);
}, 15 * 60 * 1000);

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

// If the app is currently running in standalone mode, it must be installed
if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
  localStorage.setItem('shaheen_pwa_installed', 'true');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
