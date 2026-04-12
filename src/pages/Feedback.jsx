import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import InlineSpinner from '../components/InlineSpinner'
import { useAsyncRequest } from '../hooks/useAsyncRequest'
import './Feedback.css'

const FEEDBACK_WORKER_URL = 'https://apifeedback.qten.workers.dev/'
const FEEDBACK_REQUEST_TIMEOUT_MS = 12000
const FEEDBACK_AMBIGUOUS_DELAY_MS = 3500

async function readWorkerResponse(response) {
  const responseText = await response.text()

  if (!responseText.trim()) {
    return response.ok ? { ok: true } : {}
  }

  try {
    return responseText ? JSON.parse(responseText) : {}
  } catch {
    const error = new Error('Invalid JSON response')
    error.code = 'INVALID_JSON'
    error.status = response.status
    throw error
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function Feedback() {
  const { t, language } = useLanguage()
  const { runRequest } = useAsyncRequest()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    website: ''
  })
  const [status, setStatus] = useState('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const loading = status === 'sending'

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (loading) {
      return
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      message: formData.message.trim(),
      source: window.location.href,
      website: formData.website || ''
    }

    if (!payload.message) {
      setStatus('error')
      setStatusMessage(t('feedback.emptyMessage'))
      return
    }

    if (payload.email && !isValidEmail(payload.email)) {
      setStatus('error')
      setStatusMessage(t('feedback.invalidEmail'))
      return
    }

    setStatus('sending')
    setStatusMessage('')

    const startedAt = Date.now()

    const outcome = await runRequest(async ({ signal, abort, isCurrent }) => {
      const timeoutId = window.setTimeout(() => {
        abort()
      }, FEEDBACK_REQUEST_TIMEOUT_MS)

      try {
        const response = await fetch(FEEDBACK_WORKER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal,
          keepalive: true,
        })

        const data = await readWorkerResponse(response)

        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Failed to send message')
        }

        if (!isCurrent()) {
          return null
        }

        return data
      } finally {
        window.clearTimeout(timeoutId)
      }
    })

    if (outcome.status === 'success') {
      setStatus('success')
      setStatusMessage(t('feedback.successMessage'))
      setFormData({ name: '', email: '', message: '', website: '' })
      return
    }

    const error = outcome.error
    const elapsed = Date.now() - startedAt
    const normalizedMessage = (error?.message || '').toLowerCase()
    const isTimeout = error?.name === 'AbortError' || error === 'timeout' || normalizedMessage.includes('abort')
    const isNetworkFailure =
      error?.name === 'TypeError' ||
      normalizedMessage.includes('load failed') ||
      normalizedMessage.includes('failed to fetch') ||
      normalizedMessage.includes('network')

    if (isTimeout || (isNetworkFailure && elapsed >= FEEDBACK_AMBIGUOUS_DELAY_MS)) {
      setStatus('pending')
      setStatusMessage(t('feedback.pendingMessage'))
    } else {
      setStatus('error')
      setStatusMessage(
        error?.code === 'INVALID_JSON' || isNetworkFailure
          ? t('feedback.errorMessage')
          : (error?.message || t('feedback.errorMessage'))
      )
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <>
      <SEO
        title={t('feedback.title')}
        description={t('feedback.subtitle')}
        path={`/${language}/feedback`}
      />

      <div className="tool-container feedback-page">
        <div className="feedback-shell">
          <div className="feedback-intro">
            <div className="feedback-eyebrow">{language === 'en' ? 'Get in touch' : 'Свяжитесь с нами'}</div>
            <h1>{t('feedback.title')}</h1>
            <p className="feedback-subtitle">
              {t('feedback.subtitle')}
            </p>
          </div>

          <div className="feedback-panel">
            <h2 className="feedback-panel-title">
              {language === 'en' ? 'Send a message' : 'Форма сообщения'}
            </h2>
            <form onSubmit={handleSubmit} className="feedback-form">
              <div className="feedback-form-row">
                <div className="form-group feedback-field-card">
                  <label htmlFor="name">{t('feedback.nameLabel')}</label>
                  <input
                    className="feedback-input"
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder={t('feedback.namePlaceholder')}
                  />
                </div>

                <div className="form-group feedback-field-card">
                  <label htmlFor="email">{t('feedback.emailLabel')}</label>
                  <input
                    className="feedback-input"
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder={t('feedback.emailPlaceholder')}
                  />
                </div>
              </div>

              <div className="form-group feedback-field-card feedback-field-card--textarea">
                <label htmlFor="message">{t('feedback.messageLabel')}</label>
                <textarea
                  className="feedback-input feedback-input--textarea"
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder={t('feedback.messagePlaceholder')}
                />
                <small className="feedback-helper-text">
                  {language === 'en'
                    ? 'Describe your idea, issue, or suggestion in a few sentences.'
                    : 'Коротко опишите идею, проблему или предложение, чтобы мы быстрее разобрались.'}
                </small>
              </div>

              <div className="feedback-honeypot" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  tabIndex="-1"
                  autoComplete="off"
                />
              </div>

              <button type="submit" className="btn-primary feedback-submit" disabled={loading}>
                {loading ? (
                  <span className="button-spinner">
                    <InlineSpinner label={t('feedback.sending')} />
                  </span>
                ) : t('feedback.submitButton')}
              </button>

              {status === 'success' && (
                <div className="alert alert-success" role="status" aria-live="polite">
                  {statusMessage || t('feedback.successMessage')}
                </div>
              )}

              {status === 'pending' && (
                <div className="alert alert-pending" role="status" aria-live="polite">
                  {statusMessage || t('feedback.pendingMessage')}
                </div>
              )}

              {status === 'error' && (
                <div className="alert alert-error" role="alert" aria-live="assertive">
                  {statusMessage || t('feedback.errorMessage')}
                </div>
              )}
            </form>
          </div>

        </div>

      </div>
    </>
  )
}

export default Feedback
