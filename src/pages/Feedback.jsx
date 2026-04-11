import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import './Feedback.css'

function Feedback() {
  const { t, language } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok && (data.success || data.ok)) {
        setStatus('success')
        setFormData({ name: '', email: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch (error) {
      setStatus('error')
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

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t('feedback.sending') : t('feedback.submitButton')}
            </button>

            {status === 'success' && (
              <div className="alert alert-success">
                {t('feedback.successMessage')}
              </div>
            )}

            {status === 'error' && (
              <div className="alert alert-error">
                {t('feedback.errorMessage')}
              </div>
            )}
          </form>

          <RelatedTools currentPath={`/${language}/feedback`} />
        </div>
    </>
  )
}

export default Feedback
