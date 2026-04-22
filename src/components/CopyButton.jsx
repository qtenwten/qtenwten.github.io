import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import Icon from './Icon'

function CopyButton({ text, className = '', analytics: analyticsContext = null }) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  const handleCopy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      setCopyError(true)
      setTimeout(() => setCopyError(false), 2000)
      return
    }

    setCopied(true)
    setCopyError(false)
    setTimeout(() => setCopied(false), 2000)

    if (analyticsContext) {
      try {
        const { trackLinkCopied } = await import('../utils/analytics')
        trackLinkCopied(analyticsContext.toolSlug, analyticsContext.linkType)
      } catch {
      }
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`copy-btn ${copyError ? 'copy-btn--error' : ''} ${className}`}
      disabled={!text}
    >
      {copyError ? (
        <>
          <Icon name="close" size={14} />
          {t('common.copyFailed') || 'Не вышло'}
        </>
      ) : copied ? (
        <>
          <Icon name="check" size={14} />
          {t('common.copied')}
        </>
      ) : (
        <>
          <Icon name="content_copy" size={14} />
          {t('common.copy')}
        </>
      )}
    </button>
  )
}

export default CopyButton
