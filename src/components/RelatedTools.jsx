import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import Icon from './Icon'
import { getHomeRouteEntries } from '../config/routeRegistry'
import { preloadRoute } from '../routes/lazyPages'
import './RelatedTools.css'

function RelatedTools({ currentPath, title }) {
  const { t, language } = useLanguage()
  const location = useLocation()

  // Убираем языковой префикс из currentPath
  const cleanCurrentPath = currentPath?.replace(/^\/(ru|en)/, '') || location.pathname.replace(/^\/(ru|en)/, '')

  const tools = getHomeRouteEntries().map((entry) => ({
    path: entry.path,
    icon: entry.icon,
    titleKey: entry.titleKey,
    descriptionKey: entry.descriptionKey,
  }))

  const otherTools = tools.filter(tool => tool.path !== cleanCurrentPath)

  return (
    <div className="related-tools">
      <h2>{title || t('home.relatedTools')}</h2>
      <div className="tools-grid">
        {otherTools.map(tool => (
          <Link
            key={tool.path}
            to={`/${language}${tool.path}`}
            className="tool-card"
            onMouseEnter={() => preloadRoute(tool.path)}
            onFocus={() => preloadRoute(tool.path)}
            onTouchStart={() => preloadRoute(tool.path)}
          >
            <Icon name={tool.icon} className="tool-icon" />
            <h3>{t(tool.titleKey)}</h3>
            <p>{t(tool.descriptionKey)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default RelatedTools
