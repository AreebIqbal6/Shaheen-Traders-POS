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
  onNeedRefresh() {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span className="font-semibold text-gray-800">New App Update Available</span>
        <span className="text-sm text-gray-600">A new version has been downloaded in the background.</span>
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              updateSW(true);
            }}
            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
          >
            Update & Refresh
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded text-sm font-medium hover:bg-gray-300"
          >
            Ignore
          </button>
        </div>
      </div>
    ), { duration: Infinity, position: 'bottom-right' });
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
});

// Capture PWA install prompt globally before React lazy loads views
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
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
