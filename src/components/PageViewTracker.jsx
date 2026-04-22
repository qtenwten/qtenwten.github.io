import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { analytics } from '../utils/analytics'
import { useLanguage } from '../contexts/LanguageContext'

function PageViewTracker() {
  const location = useLocation()
  const { language } = useLanguage()

  useEffect(() => {
    analytics.emit('page_view', {
      path: location.pathname,
      language,
      referrer: document.referrer || '',
    })
  }, [location.pathname, location.search, language])

  return null
}

export default PageViewTracker
