/// <reference types="vite-plugin-pwa/client" />
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { ReactQueryProvider } from './lib/react-query'
import { registerSW } from 'virtual:pwa-register'
import { applyTheme, type Theme } from './utils/theme'

// Register Service Worker for PWA and Push Notifications
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.debug('[PWA] Service Worker registered:', r?.scope)
    },
    onRegisterError(error: any) {
      console.error('[PWA] Service Worker registration failed:', error)
    }
  })
}

// Aplicar tema guardado antes de renderizar (evita flash)
applyTheme((localStorage.getItem('lh_theme') as Theme) || 'system')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReactQueryProvider>
      <App />
    </ReactQueryProvider>
  </StrictMode>,
)
