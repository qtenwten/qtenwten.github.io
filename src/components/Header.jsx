import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'
import Icon from './Icon'
import { preloadRoute } from '../routes/lazyPages'
import './Header.css'

function Header({ searchValue, onSearchChange }) {
  const { language, t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const pathnameLang = location.pathname.split('/')[1]
  const routeLanguage = pathnameLang === 'ru' || pathnameLang === 'en' ? pathnameLang : language
  const cleanPath = location.pathname.replace(/^\/(ru|en)(?=\/|$)/, '') || '/'
  const isHomePage = cleanPath === '/'

  const handleLogoClick = () => {
    if (isHomePage && onSearchChange) {
      onSearchChange('')
    }
  }

  const handleHomeSearchSubmit = (event) => {
    if (event.key === 'Enter') {
      const query = (searchValue || '').trim()
      if (!query) return
      navigate(`/${routeLanguage}/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <header className="header">
      <div className={`container header-content ${isHomePage ? 'is-home-search' : 'is-compact'}`}>
        <Link
          to={`/${routeLanguage}/`}
          className="logo"
          onClick={handleLogoClick}
          onMouseEnter={() => preloadRoute('/')}
          onFocus={() => preloadRoute('/')}
          onTouchStart={() => preloadRoute('/')}
        >
          <Icon name="construction" className="logo-icon" />
          <div className="logo-wrapper">
            <span className="logo-text">Utility Tools</span>
            <span className="logo-subtitle">{t('home.title')}</span>
          </div>
        </Link>

        {isHomePage && (
          <div className="header-search-box">
            <label htmlFor="header-search" className="sr-only">{t('common.search')}</label>
            <input
              id="header-search"
              type="search"
              placeholder={t('common.search')}
              aria-label={t('common.search')}
              value={searchValue || ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              onKeyDown={handleHomeSearchSubmit}
            />
          </div>
        )}

        <div className="header-actions">
          <Link
            to={`/${routeLanguage}/articles`}
            className="header-nav-link"
            onMouseEnter={() => preloadRoute('/articles')}
            onFocus={() => preloadRoute('/articles')}
            onTouchStart={() => preloadRoute('/articles')}
          >
            <Icon name="article" size={16} />
            <span>{t('nav.articles')}</span>
          </Link>

          {!isHomePage && (
            <Link
              to={`/${routeLanguage}/search`}
              className="header-search-link"
              onMouseEnter={() => preloadRoute('/search')}
              onFocus={() => preloadRoute('/search')}
              onTouchStart={() => preloadRoute('/search')}
            >
              <Icon name="search" size={16} />
              <span>{t('common.search')}</span>
            </Link>
          )}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}

export default Header
