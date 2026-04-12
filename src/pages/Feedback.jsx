import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import './Feedback.css'

const FEEDBACK_WORKER_URL = 'https://apifeedback.qten.workers.dev/'

async function readWorkerResponse(response) {
  const responseText = await response.text()

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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    website: ''
  })
  const [status, setStatus] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [loading, setLoading] = useState(false)

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

    setLoading(true)
    setStatus('')
    setStatusMessage('')

    try {
      const response = await fetch(FEEDBACK_WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const data = await readWorkerResponse(response)

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      setStatus('success')
      setStatusMessage(t('feedback.successMessage'))
      setFormData({ name: '', email: '', message: '', website: '' })
    } catch (error) {
      setStatus('error')
      setStatusMessage(
        error.code === 'INVALID_JSON'
          ? t('feedback.errorMessage')
          : (error.message || t('feedback.errorMessage'))
      )
    } finally {
      setLoading(false)
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

      <div className="tool-container">
        <div className="feedback-header">
          <h1>{t('feedback.title')}</h1>
          <p className="feedback-subtitle">
            {t('feedback.subtitle')}
          </p>
        </div>

          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="form-group">
              <label htmlFor="name">{t('feedback.nameLabel')}</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder={t('feedback.namePlaceholder')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('feedback.emailLabel')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder={t('feedback.emailPlaceholder')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">{t('feedback.messageLabel')}</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="6"
                placeholder={t('feedback.messagePlaceholder')}
              />
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

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t('feedback.sending') : t('feedback.submitButton')}
            </button>

            {status === 'success' && (
              <div className="alert alert-success">
                {statusMessage || t('feedback.successMessage')}
              </div>
            )}

            {status === 'error' && (
              <div className="alert alert-error">
                {statusMessage || t('feedback.errorMessage')}
              </div>
            )}
          </form>

          <RelatedTools currentPath={`/${language}/feedback`} />
        </div>
    </>
  )
}

export default Feedback
