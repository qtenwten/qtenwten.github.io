import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import Icon from './Icon'
import { preloadRoute } from '../routes/lazyPages'
import './Footer.css'

function Footer() {
  const { t, language } = useLanguage()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-feedback">
          <p className="feedback-text">
            <Icon name="lightbulb" size={18} className="feedback-icon" />
            {t('footer.feedback')}
          </p>
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
        <p className="footer-copyright">&copy; {new Date().getFullYear()} Utility Tools. {t('footer.copyright')}</p>
      </div>
    </footer>
  )
}

export default Footer
