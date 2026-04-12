import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import Icon from './Icon'
import { preloadRoute } from '../routes/lazyPages'
import './RelatedTools.css'

function RelatedTools({ currentPath }) {
  const { t, language } = useLanguage()
  const location = useLocation()

  // Убираем языковой префикс из currentPath
  const cleanCurrentPath = currentPath?.replace(/^\/(ru|en)/, '') || location.pathname.replace(/^\/(ru|en)/, '')

  const tools = [
    {
      path: '/number-to-words',
      icon: 'text_fields',
      titleKey: 'tools.numberToWords.title',
      descriptionKey: 'tools.numberToWords.description'
    },
    {
      path: '/vat-calculator',
      icon: 'payments',
      titleKey: 'tools.vatCalculator.title',
      descriptionKey: 'tools.vatCalculator.description'
    },
    {
      path: '/compound-interest',
      icon: 'trending_up',
      titleKey: 'tools.compoundInterest.title',
      descriptionKey: 'tools.compoundInterest.description'
    },
    {
      path: '/seo-audit-pro',
      icon: 'rocket_launch',
      titleKey: 'tools.seoAuditPro.title',
      descriptionKey: 'tools.seoAuditPro.description'
    },
    {
      path: '/qr-code-generator',
      icon: 'qr_code',
      titleKey: 'tools.qrCodeGenerator.title',
      descriptionKey: 'tools.qrCodeGenerator.description'
    },
    {
      path: '/url-shortener',
      icon: 'link',
      titleKey: 'tools.urlShortener.title',
      descriptionKey: 'tools.urlShortener.description'
    },
    {
      path: '/password-generator',
      icon: 'lock',
      titleKey: 'tools.passwordGenerator.title',
      descriptionKey: 'tools.passwordGenerator.description'
    },
    {
      path: '/meta-tags-generator',
      icon: 'label',
      titleKey: 'tools.metaTagsGenerator.title',
      descriptionKey: 'tools.metaTagsGenerator.description'
    },
    {
      path: '/random-number',
      icon: 'casino',
      titleKey: 'tools.randomNumber.title',
      descriptionKey: 'tools.randomNumber.description'
    },
    {
      path: '/calculator',
      icon: 'calculate',
      titleKey: 'tools.calculator.title',
      descriptionKey: 'tools.calculator.description'
    },
    {
      path: '/date-difference',
      icon: 'schedule',
      titleKey: 'tools.dateDifference.title',
      descriptionKey: 'tools.dateDifference.description'
    }
  ]

  const otherTools = tools.filter(tool => tool.path !== cleanCurrentPath)

  return (
    <div className="related-tools">
      <h2>{t('home.relatedTools')}</h2>
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
