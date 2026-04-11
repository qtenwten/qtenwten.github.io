import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'
import './Header.css'

function Header({ searchValue, onSearchChange }) {
  const { language, t } = useLanguage()
  const location = useLocation()
  const isHomePage = location.pathname === `/${language}` || location.pathname === `/${language}/`

  const handleLogoClick = () => {
    if (isHomePage && onSearchChange) {
      onSearchChange('')
    }
  }

  return (
    <header className="header">
      <div className="container header-content">
        <Link to={`/${language}/`} className="logo" onClick={handleLogoClick}>
          <span className="material-symbols-outlined logo-icon">construction</span>
          <div className="logo-wrapper">
            <span className="logo-text">Utility Tools</span>
            <span className="logo-subtitle">{t('home.title')}</span>
          </div>
        </Link>

        <div className="header-search-box">
          <span className="material-symbols-outlined header-search-icon" aria-hidden="true">search</span>
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchValue || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>

        <LanguageSwitcher />
      </div>
    </header>
  )
}

export default Header
