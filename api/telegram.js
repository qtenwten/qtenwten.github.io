export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, message } = req.body || {}

  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required' })
  }

  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
  const telegramChatId = process.env.TELEGRAM_CHAT_ID

  if (!telegramBotToken || !telegramChatId) {
    return res.status(500).json({ error: 'Telegram integration is not configured' })
  }

  const text = `🔔 Новое сообщение с сайта QSEN.RU\n\n` +
    `👤 Имя: ${name}\n` +
    `📧 Email: ${email || 'не указан'}\n\n` +
    `💬 Сообщение:\n${message}`

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: text
        })
      }
    )

    const data = await response.json()

      if (data.ok) {
        return res.status(200).json({ success: true, ok: true })
      } else {
        return res.status(500).json({ error: 'Telegram API error', details: data })
      }
  } catch (error) {
    return res.status(500).json({ error: 'Server error', details: error.message })
  }
}
