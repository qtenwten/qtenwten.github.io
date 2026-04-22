import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import * as Sentry from '@sentry/react'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { analytics } from './utils/analytics'
import App from './App'
import './styles/index.css'

const rootElement = document.getElementById('root')

Sentry.init({
  dsn: window.__ENV__?.VITE_SENTRY_DSN || '',
  environment: window.__ENV__?.VITE_APP_ENV || 'production',
  enabled: Boolean(window.__ENV__?.VITE_SENTRY_DSN),
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 0.5,
})

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
    <Sentry.ErrorBoundary fallback={null}>
      <HelmetProvider>
        <BrowserRouter>
          <LanguageProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </LanguageProvider>
        </BrowserRouter>
      </HelmetProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
)

// Always capture prerender payloads before any rendering/hydration
capturePrerenderJsonPayloads()

// Initialize analytics — must be after prerender capture, before render
analytics.init()

if (rootElement?.dataset.noHydrate === 'true') {
  createRoot(rootElement).render(app)
} else if (rootElement?.hasChildNodes()) {
  hydrateRoot(rootElement, app)
} else if (rootElement) {
  createRoot(rootElement).render(app)
}
