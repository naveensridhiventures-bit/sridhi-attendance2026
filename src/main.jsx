import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import { ToastProvider } from './components/Toast.jsx'
import './index.css'

// Whenever a new build is deployed, the service worker downloads it in the
// background. Without this, people would keep seeing the OLD cached app
// forever (looking like "the update didn't apply") until they manually
// cleared site data. This makes new versions take effect automatically —
// no one has to touch local storage.
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (!registration) return
    // Check for a newer deployed build every 60s while the tab is open,
    // and immediately whenever the tab becomes visible again.
    setInterval(() => registration.update(), 60 * 1000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update()
    })
  },
  onNeedRefresh() {
    // A new version finished downloading — activate it and reload
    // automatically so the person always sees the latest deploy.
    updateSW(true)
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
)
