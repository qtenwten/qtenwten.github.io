import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { preloadRoute } from '../routes/lazyPages'
import './Footer.css'

function Footer() {
  const { t, language } = useLanguage()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-brand">
          <span className="footer-brand__name">QSEN</span>
          <p className="footer-brand__tagline">{t('footer.tagline')}</p>
        </div>
        <div className="footer-feedback">
          <p className="feedback-text">{t('footer.feedback')}</p>
          <Link
            to={`/${language}/feedback`}
            className="feedback-button"
            onMouseEnter={() => preloadRoute('/feedback')}
            onFocus={() => preloadRoute('/feedback')}
            onTouchStart={() => preloadRoute('/feedback')}
          >
            {t('footer.writeUs')}
          </Link>
        </div>
        <nav className="footer-links" aria-label={t('breadcrumbs.navigation')}>
          <Link
            to={`/${language}/articles`}
            className="footer-link"
            onMouseEnter={() => preloadRoute('/articles')}
            onFocus={() => preloadRoute('/articles')}
            onTouchStart={() => preloadRoute('/articles')}
          >
            {t('nav.articles')}
          </Link>
        </nav>
        <p className="footer-copyright">{t('footer.copyright')}</p>
      </div>
    </footer>
  )
}

export default Footer
