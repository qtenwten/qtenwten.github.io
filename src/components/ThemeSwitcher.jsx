import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import { useEffect, useState } from 'react'
import './ThemeSwitcher.css'

function ThemeSwitcher() {
  const { t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <button
      type="button"
      className={`theme-switcher${isDark ? ' is-dark' : ''}`}
      onClick={toggleTheme}
      aria-label={t('common.switchTheme')}
      {...(isMounted ? { 'aria-pressed': isDark } : {})}
      title={t('common.switchTheme')}
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
