import { createContext, useContext, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [language, setLanguage] = useState('ru')

  // Определение языка из URL
  useEffect(() => {
    try {
      const pathLang = location.pathname.split('/')[1]
        if (pathLang === 'ru' || pathLang === 'en') {
          setLanguage(pathLang)
          safeSetItem('language', pathLang)
        } else {
          // Если язык не указан в URL, определяем из localStorage или браузера
          const savedLang = safeGetItem('language')

        if (savedLang && (savedLang === 'ru' || savedLang === 'en')) {
          setLanguage(savedLang)
        } else {
          // Определяем по языку браузера
          const browserLang = navigator.language.toLowerCase()
          const detectedLang = browserLang.startsWith('ru') ? 'ru' : 'en'
          setLanguage(detectedLang)
          safeSetItem('language', detectedLang)
        }
      }
    } catch (error) {
      console.error('Error in language detection:', error)
      // Fallback to Russian
      setLanguage('ru')
    }
  }, [location.pathname])

  // Функция для получения перевода по ключу
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
        return key // Возвращаем ключ, если перевод не найден
      }
    }

    return value || key
  }

  // Функция смены языка
  const changeLanguage = (newLang) => {
    try {
      if (newLang !== 'ru' && newLang !== 'en') return

      const currentPath = location.pathname
      const currentLang = currentPath.split('/')[1]

      if (currentLang === newLang) return

      const nextUrlState = {
        localeSwitch: true,
        scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
      }

      // Если текущий путь начинается с языка, заменяем его
      if (currentLang === 'ru' || currentLang === 'en') {
        const newPath = currentPath.replace(`/${currentLang}`, `/${newLang}`)
        navigate(`${newPath}${location.search}${location.hash}`, { state: nextUrlState })
      } else {
        // Если языка нет в пути, добавляем новый язык
        navigate(`/${newLang}${currentPath}${location.search}${location.hash}`, { state: nextUrlState })
      }

      safeSetItem('language', newLang)
    } catch (error) {
      console.error('Error changing language:', error)
    }
  }

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
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
