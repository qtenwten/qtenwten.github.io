import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import Icon from './Icon'

function CopyButton({ text, className = '' }) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Silently fail - clipboard API might not be available
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`copy-btn ${className}`}
      disabled={!text}
    >
      {copied ? (
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
