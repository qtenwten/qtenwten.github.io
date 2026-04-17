import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import { useEffect } from 'react'
import './ThemeSwitcher.css'

function ThemeSwitcher() {
  const { language } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const ariaLabel = language === 'ru'
    ? (isDark ? 'Переключить на светлую тему' : 'Переключить на темную тему')
    : (isDark ? 'Switch to light theme' : 'Switch to dark theme')

  useEffect(() => {
    console.log('🎨 [ThemeSwitcher] MOUNT', { theme, isDark, language })
    return () => {
      console.log('🎨 [ThemeSwitcher] UNMOUNT', { theme, isDark, language })
    }
  }, [])

  useEffect(() => {
    console.log('🎨 [ThemeSwitcher] RENDER', { theme, isDark, language })
  })

  return (
    <button
      type="button"
      className={`theme-switcher ${isDark ? 'is-dark' : 'is-light'}`}
      onClick={toggleTheme}
      aria-label={ariaLabel}
      aria-pressed={isDark}
      title={ariaLabel}
      suppressHydrationWarning
    >
      <span className="theme-switcher__thumb" aria-hidden="true" />
      <span className="theme-switcher__labels" aria-hidden="true">
        <span suppressHydrationWarning className={`theme-switcher__label ${theme === 'light' ? 'is-active' : ''}`}>☀</span>
        <span suppressHydrationWarning className={`theme-switcher__label ${isDark ? 'is-active' : ''}`}>☾</span>
      </span>
    </button>
  )
}

export default ThemeSwitcher
