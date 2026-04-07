import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import RelatedTools from '../components/RelatedTools'
import './Feedback.css'

function Feedback() {
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

    console.log('Sending payload:', payload)

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
      console.log('Telegram response:', data)

      if (data.ok) {
        setStatus('success')
        setFormData({ name: '', message: '' })
      } else {
        console.error('Telegram error:', data)
        setStatus('error')
      }
    } catch (error) {
      console.error('Fetch error:', error)
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
      <Helmet>
        <title>Обратная связь - QSEN.RU</title>
        <meta name="description" content="Свяжитесь с нами! Оставьте свои пожелания, предложения или сообщите о проблемах на сайте QSEN.RU" />
        <link rel="canonical" href="https://qsen.ru/feedback" />
      </Helmet>

      <div className="container">
        <div className="feedback-page">
          <div className="feedback-header">
            <h1>Обратная связь</h1>
            <p className="feedback-subtitle">
              Мы ценим ваше мнение! Напишите нам свои пожелания, предложения по улучшению сайта или сообщите о проблемах.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="form-group">
              <label htmlFor="name">Ваше имя</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Как к вам обращаться?"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Сообщение</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="6"
                placeholder="Опишите ваше предложение или проблему..."
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Отправка...' : 'Отправить сообщение'}
            </button>

            {status === 'success' && (
              <div className="alert alert-success">
                ✅ Спасибо! Ваше сообщение успешно отправлено.
              </div>
            )}

            {status === 'error' && (
              <div className="alert alert-error">
                ❌ Ошибка отправки. Попробуйте позже.
              </div>
            )}
          </form>
        </div>

        <RelatedTools currentPath="/feedback" />
      </div>
    </>
  )
}

export default Feedback
