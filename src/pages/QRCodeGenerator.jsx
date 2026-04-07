import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'

function QRCodeGenerator() {
  const [qrType, setQrType] = useState('text')
  const [qrValue, setQrValue] = useState('')
  const [qrSize, setQrSize] = useState(256)
  const [qrColor, setQrColor] = useState('#000000')
  const [qrBgColor, setQrBgColor] = useState('#ffffff')
  const [useTranslit, setUseTranslit] = useState(false)
  const qrRef = useRef(null)

  const qrTypes = [
    { id: 'text', label: 'Текст', placeholder: 'Введите текст' },
    { id: 'url', label: 'Ссылка', placeholder: 'https://example.com' },
    { id: 'email', label: 'Email', placeholder: 'example@mail.com' },
    { id: 'phone', label: 'Телефон', placeholder: '+7 (999) 123-45-67' },
    { id: 'sms', label: 'SMS', placeholder: '+7 (999) 123-45-67' },
    { id: 'wifi', label: 'WiFi', placeholder: 'SSID:password:WPA' }
  ]

  useEffect(() => {
    if (!qrValue.trim()) return

    const canvas = document.createElement('canvas')

    const options = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 1,
      margin: 1,
      width: qrSize,
      color: {
        dark: qrColor,
        light: qrBgColor
      }
    }

    QRCode.toCanvas(canvas, formatValue(), options, (error) => {
      if (error) {
        console.error('QR Code generation error:', error)
        return
      }

      if (qrRef.current) {
        qrRef.current.innerHTML = ''
        qrRef.current.appendChild(canvas)
      }
    })
  }, [qrValue, qrSize, qrColor, qrBgColor, qrType, useTranslit])

  // Показываем QR в реальном времени
  const shouldShowQR = qrValue.trim() !== ''

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (canvas) {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'qrcode.png'
        link.click()
        URL.revokeObjectURL(url)
      })
    }
  }

  const transliterate = (text) => {
    const map = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
      'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
      'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
      'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
      'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    }
    return text.split('').map(char => map[char] || char).join('')
  }

  const formatValue = () => {
    let value = qrValue

    // Транслитерация для текста если включена
    if (qrType === 'text' && useTranslit) {
      value = transliterate(value)
    }

    switch (qrType) {
      case 'email':
        return `mailto:${value}`
      case 'phone':
        return `tel:${value}`
      case 'sms':
        return `sms:${value}`
      case 'wifi':
        const [ssid, password, security] = value.split(':')
        return `WIFI:T:${security || 'WPA'};S:${ssid};P:${password};;`
      default:
        return value
    }
  }

  return (
    <>
      <SEO
        title="Генератор QR-кодов онлайн бесплатно - Создать QR код"
        description="Бесплатный генератор QR-кодов онлайн. Создайте QR-код для ссылки, текста, email, телефона, WiFi. Настройка цвета и стиля. Скачать в PNG."
        path="/qr-code-generator"
        keywords="генератор qr кода, создать qr код онлайн, qr код генератор бесплатно, qr code generator, генератор qr кодов"
      />

      <div className="tool-container">
        <h1>Генератор QR-кодов онлайн</h1>
        <p>Создайте и настройте QR-код бесплатно</p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(400px, 1fr) minmax(450px, 1fr)',
          gap: '2rem',
          marginBottom: '2rem',
          '@media (max-width: 968px)': {
            gridTemplateColumns: '1fr'
          }
        }}>
          {/* Левая колонка - настройки */}
          <div>
            <div className="field">
              <label>Тип QR-кода</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {qrTypes.map(type => (
                  <button
                    key={type.id}
                    className={qrType === type.id ? '' : 'secondary'}
                    style={{ padding: '0.75rem', fontSize: '0.85rem' }}
                    onClick={() => {
                      setQrType(type.id)
                      setQrValue('')
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="qrValue">Данные для QR-кода</label>
              <textarea
                id="qrValue"
                value={qrValue}
                onChange={(e) => setQrValue(e.target.value)}
                placeholder={qrTypes.find(t => t.id === qrType)?.placeholder}
                rows={qrType === 'text' ? 4 : 2}
                autoFocus
              />
              {qrType === 'wifi' && (
                <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                  Формат: SSID:пароль:тип (WPA/WEP/nopass)
                </small>
              )}
            </div>

            <div className="field">
              <label htmlFor="qrSize">Размер: {qrSize}x{qrSize} px</label>
              <input
                id="qrSize"
                type="range"
                min="128"
                max="400"
                step="16"
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
              />
            </div>

            <div className="field">
              <label>Цвета QR-кода</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label htmlFor="qrColor" style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block', fontWeight: 'normal' }}>Цвет QR</label>
                  <input
                    id="qrColor"
                    type="color"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    style={{ width: '100%', height: '50px', cursor: 'pointer', border: '2px solid var(--border)', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label htmlFor="qrBgColor" style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block', fontWeight: 'normal' }}>Цвет фона</label>
                  <input
                    id="qrBgColor"
                    type="color"
                    value={qrBgColor}
                    onChange={(e) => setQrBgColor(e.target.value)}
                    style={{ width: '100%', height: '50px', cursor: 'pointer', border: '2px solid var(--border)', borderRadius: '8px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Правая колонка - результат */}
          <div>
            {shouldShowQR ? (
              <div className="result-box success" style={{
                textAlign: 'center',
                height: '520px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
              }}>
                <div ref={qrRef} style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  height: '420px',
                  width: '100%'
                }}></div>
                <button onClick={handleDownload} style={{ width: '100%', maxWidth: '300px' }}>
                  📥 Скачать PNG
                </button>
                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 0 }}>
                  Отсканируйте камерой телефона
                </p>
              </div>
            ) : (
              <div style={{
                background: 'var(--bg-secondary)',
                border: '2px dashed var(--border)',
                borderRadius: '8px',
                padding: '3rem 2rem',
                textAlign: 'center',
                height: '520px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }}>📱</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>
                  Введите данные слева,<br />чтобы создать QR-код
                </p>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Как создать QR-код онлайн</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            Бесплатный генератор QR-кодов позволяет создать QR-код для любых данных за несколько секунд.
            Выберите тип данных, введите информацию, настройте внешний вид и скачайте готовый QR-код в PNG формате.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Типы QR-кодов:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li><strong>Текст</strong> - любой текст или сообщение</li>
            <li><strong>Ссылка</strong> - URL сайта или веб-страницы</li>
            <li><strong>Email</strong> - адрес электронной почты</li>
            <li><strong>Телефон</strong> - номер телефона для быстрого звонка</li>
            <li><strong>SMS</strong> - номер для отправки SMS</li>
            <li><strong>WiFi</strong> - данные для подключения к WiFi сети</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Возможности генератора:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Создание QR-кода онлайн бесплатно без регистрации</li>
            <li>Настройка цвета QR-кода и фона</li>
            <li>Выбор стиля: квадраты, точки или скругленные углы</li>
            <li>Регулировка размера от 128x128 до 400x400 пикселей</li>
            <li>Скачивание в PNG формате высокого качества</li>
            <li>Мгновенная генерация без задержек</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Популярные запросы:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Генератор QR кодов онлайн бесплатно</li>
            <li>Создать QR код для ссылки</li>
            <li>QR код генератор с логотипом</li>
            <li>Генератор QR кода для WiFi</li>
            <li>Как создать QR код бесплатно</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Примеры использования:</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            <strong>Для бизнеса:</strong> Создайте QR-код со ссылкой на ваш сайт, меню ресторана,
            прайс-лист или контактную информацию. Разместите на визитках, флаерах или вывесках.
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>Для WiFi:</strong> Сгенерируйте QR-код с данными WiFi сети. Гости смогут
            подключиться к интернету, просто отсканировав код камерой телефона.
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>Для мероприятий:</strong> Создайте QR-коды для регистрации участников,
            ссылок на программу мероприятия или контактов организаторов.
          </p>
        </div>

        <RelatedTools currentPath="/qr-code-generator" />
      </div>
    </>
  )
}

export default QRCodeGenerator
