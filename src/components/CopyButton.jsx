import { useState } from 'react'

function CopyButton({ text, className = '' }) {
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
      {copied ? '✓ Скопировано' : '📋 Копировать'}
    </button>
  )
}

export default CopyButton
