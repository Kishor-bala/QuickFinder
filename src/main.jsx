import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.addEventListener('error', (event) => {
  console.error('[Global Startup Error]', event.error || event.message);
  const root = document.getElementById('root');
  if (root && (!root.children || root.children.length === 0)) {
    root.innerHTML = `<div style="padding: 32px; font-family: system-ui; text-align: center; max-width: 500px; margin: 40px auto; background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
      <h2 style="color: #e11d48; margin-bottom: 8px;">Application Startup Error</h2>
      <p style="color: #475569; font-size: 14px; margin-bottom: 16px;">${event.message || 'Error loading application'}</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; background: #1e3a8a; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">Reload Page</button>
    </div>`;
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
