import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import './ThemeSwitcher.css'

function ThemeSwitcher() {
  const { language } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const neutralAriaLabel = language === 'ru' ? 'Переключить тему' : 'Toggle theme'

  return (
    <button
      type="button"
      className={`theme-switcher${isDark ? ' is-dark' : ''}`}
      onClick={toggleTheme}
      aria-label={neutralAriaLabel}
      title={neutralAriaLabel}
      suppressHydrationWarning
    >
      <span className="theme-switcher__thumb" aria-hidden="true" />
      <span className="theme-switcher__labels" aria-hidden="true">
        <span suppressHydrationWarning className="theme-switcher__label">☀</span>
        <span suppressHydrationWarning className="theme-switcher__label">☾</span>
      </span>
    </button>
  )
}

export default ThemeSwitcher
