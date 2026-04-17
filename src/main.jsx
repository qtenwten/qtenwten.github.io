import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'
import App from './App'
import './styles/index.css'
import { errorMonitor } from './utils/errorMonitor'

// Initialize error monitoring
errorMonitor.init()

const rootElement = document.getElementById('root')

function capturePrerenderJsonPayloads() {
  if (typeof window === 'undefined') {
    return
  }

  // Always capture scripts from the document (they may be outside root div)
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

// Diagnostic: log hydration recoverable errors
function logHydrationError(error, componentStack) {
  const msg = [
    '💧 [HYDRATION ERROR]',
    `Message: ${error?.message || error}`,
    `Location: ${window.location.href}`,
  ]

  if (error?.digest) {
    msg.push(`Digest: ${error.digest}`)
  }

  if (componentStack) {
    msg.push(`Component stack: ${componentStack}`)
  }

  if (error?._target) {
    const target = error._target
    msg.push(`Target tag: <${target?.nodeName?.toLowerCase() || 'unknown'}>`)
    msg.push(`Target class: ${target?.className || 'none'}`)
    msg.push(`Target id: ${target?.id || 'none'}`)
    if (target?.outerHTML) {
      msg.push(`Target outerHTML: ${target?.outerHTML?.slice(0, 200)}...`)
    }
  }

  console.error(msg.join('\n'))
}

// Diagnostic: track DOM mutations after hydration
const __QSEN_DOM_MUTATIONS = []
let __QSEN_HYDRATION_COMPLETE = false
let __QSEN_MUTATION_OBSERVER = null

function startDomMutationObserver() {
  if (typeof window === 'undefined' || __QSEN_MUTATION_OBSERVER) {
    return
  }

  try {
    __QSEN_MUTATION_OBSERVER = new MutationObserver((records) => {
      if (!__QSEN_HYDRATION_COMPLETE) {
        return // Ignore mutations during initial hydration
      }

      records.forEach((record) => {
        if (record.type === 'childList') {
          record.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const info = {
                ts: Date.now(),
                tag: node.tagName?.toLowerCase(),
                class: node.className || '',
                id: node.id || '',
                outerHTML: node.outerHTML?.slice(0, 300),
              }
              __QSEN_DOM_MUTATIONS.push({ type: 'ADDED', record: info })
              console.log('🌱 [DOM MUTATION] ADDED:', info)
            }
          })
          record.removedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const info = {
                ts: Date.now(),
                tag: node.tagName?.toLowerCase(),
                class: node.className || '',
                id: node.id || '',
                outerHTML: node.outerHTML?.slice(0, 300),
              }
              __QSEN_DOM_MUTATIONS.push({ type: 'REMOVED', record: info })
              console.log('🌱 [DOM MUTATION] REMOVED:', info)
            }
          })
        } else if (record.type === 'attributes') {
          const info = {
            ts: Date.now(),
            tag: record.target?.tagName?.toLowerCase(),
            class: record.target?.className || '',
            id: record.target?.id || '',
            attrName: record.attributeName,
            oldValue: record.oldValue,
            newValue: record.target?.getAttribute?.(record.attributeName),
          }
          __QSEN_DOM_MUTATIONS.push({ type: 'ATTR_CHANGE', record: info })
          console.log('🌱 [DOM MUTATION] ATTR_CHANGE:', info)
        }
      })
    })

    __QSEN_MUTATION_OBSERVER.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
    })

    console.log('[DIAG] MutationObserver started')
  } catch (e) {
    console.warn('[DIAG] MutationObserver failed:', e)
  }
}

function stopDomMutationObserver() {
  if (__QSEN_MUTATION_OBSERVER) {
    __QSEN_MUTATION_OBSERVER.disconnect()
    __QSEN_MUTATION_OBSERVER = null
  }
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

const logoImg = document.querySelector('.logo-image')
const headerSearch = document.getElementById('header-search')
const themeSwitcher = document.querySelector('.theme-switcher')
const langSwitcher = document.querySelector('.language-switcher')
const heroH1 = document.querySelector('.home-hero h1')
const heroP = document.querySelector('.home-hero > p')

console.log('🔍 [BEFORE HYDRATION] URL:', window.location.href)
console.log('🔍 [BEFORE HYDRATION] logo src:', logoImg?.src)
console.log('🔍 [BEFORE HYDRATION] html[data-theme]:', document.documentElement.getAttribute('data-theme'))
console.log('🔍 [BEFORE HYDRATION] body[data-theme]:', document.body?.getAttribute('data-theme'))
console.log('🔍 [BEFORE HYDRATION] header-search value:', headerSearch?.value)
console.log('🔍 [BEFORE HYDRATION] header-search defaultValue:', headerSearch?.defaultValue)
console.log('🔍 [BEFORE HYDRATION] theme-switcher outerHTML:', themeSwitcher?.outerHTML?.slice(0, 500))
console.log('🔍 [BEFORE HYDRATION] lang-switcher outerHTML:', langSwitcher?.outerHTML?.slice(0, 500))
console.log('🔍 [BEFORE HYDRATION] footer outerHTML:', document.querySelector('.footer')?.outerHTML?.slice(0, 300))
console.log('🔍 [BEFORE HYDRATION] hero h1 text:', heroH1?.textContent?.slice(0, 80))
console.log('🔍 [BEFORE HYDRATION] hero p text:', heroP?.textContent?.slice(0, 80))
console.log('🔍 [BEFORE HYDRATION] root has childNodes:', rootElement?.hasChildNodes())

if (rootElement?.dataset.noHydrate === 'true') {
  console.log('[DIAG] Skipping hydration - data-no-hydrate=true')
  createRoot(rootElement).render(app)
} else if (rootElement?.hasChildNodes()) {
  console.log('[DIAG] Starting hydrateRoot...')
  startDomMutationObserver()

  hydrateRoot(rootElement, app, {
    onRecoverableError: (error, errorInfo) => {
      logHydrationError(error, errorInfo?.componentStack)
    },
  })
  // hydrateRoot is synchronous - initial render completes before it returns
  __QSEN_HYDRATION_COMPLETE = true
  console.log('[DIAG] Hydration complete - MutationObserver now tracking')
  console.log('[DIAG] Mutations so far:', __QSEN_DOM_MUTATIONS.length)
} else if (rootElement) {
  console.log('[DIAG] No child nodes - using createRoot')
  createRoot(rootElement).render(app)
}
