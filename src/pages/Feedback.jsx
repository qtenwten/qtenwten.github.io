import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import './Feedback.css'

function Feedback() {
  const { t, language } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    message: ''
  })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus('')

    const TELEGRAM_BOT_TOKEN = '8609094298:AAGQEDJwuFpml6tqrStaD_rjtd1Tkp1KOQw'
    const TELEGRAM_CHAT_ID = '461685582'

    const text = `🔔 Новое сообщение с сайта QSEN.RU\n\n👤 Имя: ${formData.name}\n\n💬 Сообщение:\n${formData.message}`

    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: 'HTML'
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }
      )

      const data = await response.json()

      if (data.ok) {
        setStatus('success')
        setFormData({ name: '', message: '' })
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

      <div className="container">
        <div className="feedback-page">
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
        </div>

        <RelatedTools currentPath={`/${language}/feedback`} />
      </div>
    </>
  )
}

export default Feedback
