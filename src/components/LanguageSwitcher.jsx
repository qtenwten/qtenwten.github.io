import { useLanguage } from '../contexts/LanguageContext'
import './LanguageSwitcher.css'

function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage()
  const nextLanguage = language === 'ru' ? 'en' : 'ru'
  const ariaLabel = language === 'ru'
    ? 'Switch language to English'
    : 'Переключить язык на русский'

  return (
    <button
      type="button"
      className={`language-switcher ${language === 'en' ? 'is-en' : 'is-ru'}`}
      onClick={() => changeLanguage(nextLanguage)}
      aria-label={ariaLabel}
      aria-pressed={language === 'en'}
      title={ariaLabel}
      suppressHydrationWarning
    >
      <span className="language-switcher__thumb" aria-hidden="true" />
      <span className="language-switcher__labels" aria-hidden="true">
        <span suppressHydrationWarning className={`language-switcher__label ${language === 'ru' ? 'is-active' : ''}`}>RU</span>
        <span suppressHydrationWarning className={`language-switcher__label ${language === 'en' ? 'is-active' : ''}`}>EN</span>
      </span>
    </button>
  )
}

export default LanguageSwitcher
