import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import './CookieConsent.css'

const STORAGE_KEY = 'qsen_cookie_consent'

function CookieConsent() {
  const { t, language } = useLanguage()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      setVisible(true)
      return
    }
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
    const isExpired = Date.now() - Number(stored) > thirtyDaysMs
    if (isExpired) {
      localStorage.removeItem(STORAGE_KEY)
      setVisible(true)
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('has-cookie-consent', visible)

    return () => {
      document.body.classList.remove('has-cookie-consent')
    }
  }, [visible])

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    setVisible(false)
  }

  if (!visible) {
    return null
  }

  return (
    <div className="cookie-consent" role="dialog" aria-labelledby="cookie-consent-title" aria-describedby="cookie-consent-message">
      <div className="cookie-consent__container">
        <div className="cookie-consent__content">
          <h2 className="cookie-consent__title" id="cookie-consent-title">
            {t('cookie.title')}
          </h2>
          <p className="cookie-consent__text" id="cookie-consent-message">
            {t('cookie.message')}
          </p>
        </div>
        <div className="cookie-consent__actions">
          <Link to={`/${language}/privacy/`} className="cookie-consent__link" target="_blank" rel="noopener">
            {t('cookie.privacy')}
          </Link>
          <button className="cookie-consent__button" onClick={handleAccept}>
            {t('cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent
