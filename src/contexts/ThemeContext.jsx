import { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react'
import { safeGetItem, safeSetItem } from '../utils/storage'

const ThemeContext = createContext()

const THEME_STORAGE_KEY = 'theme'

function getInitialTheme() {
  // Read from the global set by the blocking inline script to ensure consistency
  if (typeof window !== 'undefined' && window.__QSEN_INITIAL_THEME__ === 'dark') {
    return 'dark'
  }
  if (typeof window !== 'undefined' && window.__QSEN_INITIAL_THEME__ === 'light') {
    return 'light'
  }

  // Fallback: read from localStorage
  const savedTheme = safeGetItem(THEME_STORAGE_KEY)
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  return 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.body?.setAttribute('data-theme', theme)
    safeSetItem(THEME_STORAGE_KEY, theme)
    // Remove theme-init flag synchronously before first paint to prevent transition flicker
    document.documentElement.removeAttribute('data-theme-init')
  }, [theme])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'))
  }

  const value = useMemo(() => ({ theme, toggleTheme }), [theme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
