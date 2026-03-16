import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { ReactQueryProvider } from './lib/react-query'
import { applyTheme, type Theme } from './utils/theme'

// Aplicar tema guardado antes de renderizar (evita flash)
applyTheme((localStorage.getItem('lh_theme') as Theme) || 'system')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReactQueryProvider>
      <App />
    </ReactQueryProvider>
  </StrictMode>,
)
