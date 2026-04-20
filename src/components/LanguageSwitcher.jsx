import { useLanguage } from '../contexts/LanguageContext'
import { useEffect } from 'react'
import './LanguageSwitcher.css'

function LanguageSwitcher() {
  const { language, changeLanguage, t } = useLanguage()
  const nextLanguage = language === 'ru' ? 'en' : 'ru'
  const ariaLabel = nextLanguage === 'en' ? t('common.switchToEn') : t('common.switchToRu')

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
