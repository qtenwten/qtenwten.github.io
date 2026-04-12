import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import './NotFound.css'

function NotFound() {
  const { language } = useLanguage()

  const copy = language === 'en'
    ? {
        title: 'Page not found',
        subtitle: 'The page may have moved, the address may be incorrect, or the route may no longer exist.',
        primary: 'Go to homepage',
        secondary: 'Popular tools',
        seoTitle: 'Page not found | QSEN.RU',
        seoDescription: 'This page could not be found. Return to the homepage and continue with the most popular online tools.',
      }
    : {
        title: 'Страница не найдена',
        subtitle: 'Возможно, адрес введён неверно, страница была перенесена или такой маршрут больше не существует.',
        primary: 'На главную',
        secondary: 'Популярные инструменты',
        seoTitle: 'Страница не найдена | QSEN.RU',
        seoDescription: 'Эта страница не найдена. Вернитесь на главную и продолжайте работу с основными онлайн-инструментами сайта.',
      }

  return (
    <>
      <SEO
        title={copy.seoTitle}
        description={copy.seoDescription}
        path={`/${language}/404`}
        keywords=""
        robots="noindex,nofollow"
      />
      <div className="tool-container not-found-page">
        <div className="not-found-card">
          <div className="not-found-code">404</div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
          <div className="not-found-actions">
            <Link to={`/${language}/`} className="not-found-primary">
              {copy.primary}
            </Link>
          </div>
        </div>

        <RelatedTools currentPath={`/${language}/404`} title={copy.secondary} />
      </div>
    </>
  )
}

export default NotFound
