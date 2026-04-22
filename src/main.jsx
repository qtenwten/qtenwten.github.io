import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'
import App from './App'
import './styles/index.css'

const rootElement = document.getElementById('root')

function capturePrerenderJsonPayloads() {
  if (typeof window === 'undefined') {
    return
  }

  const payloadScripts = document.querySelectorAll('script[type="application/json"][id^="__"]')
  if (!payloadScripts.length) {
    return
  }

  const payloadStore = window.__QSEN_PRERENDER_DATA__ || {}

  payloadScripts.forEach((script) => {
    if (!script.id) {
      return
    }

    payloadStore[script.id] = script.textContent || ''
  })

  window.__QSEN_PRERENDER_DATA__ = payloadStore
}

const app = (
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <LanguageProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </LanguageProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
)

// Always capture prerender payloads before any rendering/hydration
capturePrerenderJsonPayloads()

if (rootElement?.dataset.noHydrate === 'true') {
  createRoot(rootElement).render(app)
} else if (rootElement?.hasChildNodes()) {
  hydrateRoot(rootElement, app)
} else if (rootElement) {
  createRoot(rootElement).render(app)
}
