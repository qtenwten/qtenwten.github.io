import { createContext, useContext, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import ruTranslations from '../locales/ru.json'
import enTranslations from '../locales/en.json'
import { safeGetItem, safeSetItem } from '../utils/storage'

const translations = {
  ru: ruTranslations,
  en: enTranslations
}

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const location = useLocation()
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined' && (window.__QSEN_INITIAL_LANGUAGE__ === 'ru' || window.__QSEN_INITIAL_LANGUAGE__ === 'en')) {
      return window.__QSEN_INITIAL_LANGUAGE__
    }
    return 'ru'
  })

  useEffect(() => {
    try {
      const pathLang = location.pathname.split('/')[1]
      if (pathLang === 'ru' || pathLang === 'en') {
        setLanguage(pathLang)
        safeSetItem('language', pathLang)
      } else {
        const savedLang = safeGetItem('language')
        if (savedLang && (savedLang === 'ru' || savedLang === 'en')) {
          setLanguage(savedLang)
        } else {
          const browserLang = navigator.language.toLowerCase()
          const detectedLang = browserLang.startsWith('ru') ? 'ru' : 'en'
          setLanguage(detectedLang)
          safeSetItem('language', detectedLang)
        }
      }
    } catch (error) {
      console.error('Error in language detection:', error)
      setLanguage('ru')
    }
  }, [location.pathname])

  const t = (key) => {
    if (typeof key !== 'string' || key.length === 0) {
      if (import.meta.env.DEV) {
        console.warn('t() called with invalid key:', key)
      }
      return ''
    }

    const keys = key.split('.')
    let value = translations[language]

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        return key
      }
    }

    return value || key
  }

  return (
    <LanguageContext.Provider value={{ language, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
