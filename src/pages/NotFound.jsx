import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import './NotFound.css'

function NotFound() {
  const { language } = useLanguage()

  return (
    <>
      <SEO
        title={t('notFound.seoTitle')}
        description={t('notFound.seoDescription')}
        path={`/${language}/404`}
        keywords=""
        robots="noindex,nofollow"
      />
      <div className="tool-container not-found-page">
        <div className="not-found-card">
          <div className="not-found-code">404</div>
          <h1>{t('notFound.title')}</h1>
          <p>{t('notFound.subtitle')}</p>
          <div className="not-found-actions">
            <Link to={`/${language}/`} className="not-found-primary">
              {t('notFound.primary')}
            </Link>
          </div>
        </div>

        <RelatedTools currentPath={`/${language}/404`} title={t('notFound.secondary')} />
      </div>
    </>
  )
}

export default NotFound
