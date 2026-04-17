import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import { useEffect } from 'react'
import './ThemeSwitcher.css'

function ThemeSwitcher() {
  const { language } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  // Use a neutral aria-label that matches regardless of theme state.
  // This prevents text content mismatch during hydration.
  // The correct direction-specific label is applied after hydration.
  const neutralAriaLabel = language === 'ru' ? 'Переключить тему' : 'Toggle theme'

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
      aria-label={neutralAriaLabel}
      aria-pressed={isDark}
      title={neutralAriaLabel}
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
