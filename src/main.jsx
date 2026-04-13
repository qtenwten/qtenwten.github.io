import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { LanguageProvider } from './contexts/LanguageContext'
import App from './App'
import './styles/index.css'
import { errorMonitor } from './utils/errorMonitor'

// Initialize error monitoring
errorMonitor.init()

const rootElement = document.getElementById('root')

const app = (
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
)

if (rootElement?.dataset.noHydrate === 'true') {
  rootElement.innerHTML = ''
  createRoot(rootElement).render(app)
} else if (rootElement?.hasChildNodes()) {
  hydrateRoot(rootElement, app)
} else if (rootElement) {
  createRoot(rootElement).render(app)
}
