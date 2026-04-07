import { useState, useEffect, useRef } from 'react'
import QRCodeStyling from 'qr-code-styling'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'

function QRCodeGenerator() {
  const [qrType, setQrType] = useState('text')
  const [qrValue, setQrValue] = useState('')
  const [qrSize, setQrSize] = useState(256)
  const [qrStyle, setQrStyle] = useState('squares')
  const [qrColor, setQrColor] = useState('#000000')
  const [qrBgColor, setQrBgColor] = useState('#ffffff')
  const qrRef = useRef(null)
  const qrCodeRef = useRef(null)

  const qrTypes = [
    { id: 'text', label: 'Текст', placeholder: 'Введите текст' },
    { id: 'url', label: 'Ссылка', placeholder: 'https://example.com' },
    { id: 'email', label: 'Email', placeholder: 'example@mail.com' },
    { id: 'phone', label: 'Телефон', placeholder: '+7 (999) 123-45-67' },
    { id: 'sms', label: 'SMS', placeholder: '+7 (999) 123-45-67' },
    { id: 'wifi', label: 'WiFi', placeholder: 'SSID:password:WPA' }
  ]

  const qrStyles = [
    { id: 'squares', label: '⬛ Квадраты', icon: '⬛' },
    { id: 'dots', label: '⚫ Точки', icon: '⚫' },
    { id: 'rounded', label: '🔘 Скругленные', icon: '🔘' }
  ]

  const qrPresets = [
    { name: 'Классический', fg: '#000000', bg: '#ffffff' },
    { name: 'Синий', fg: '#2196F3', bg: '#E3F2FD' },
    { name: 'Зеленый', fg: '#4CAF50', bg: '#E8F5E9' },
    { name: 'Красный', fg: '#F44336', bg: '#FFEBEE' },
    { name: 'Фиолетовый', fg: '#9C27B0', bg: '#F3E5F5' },
    { name: 'Оранжевый', fg: '#FF9800', bg: '#FFF3E0' }
  ]

  useEffect(() => {
    if (!qrValue.trim()) return

    const dotsType = qrStyle === 'dots' ? 'dots' : qrStyle === 'rounded' ? 'rounded' : 'square'
    const cornersType = qrStyle === 'rounded' ? 'extra-rounded' : 'square'

    qrCodeRef.current = new QRCodeStyling({
      width: qrSize,
      height: qrSize,
      data: formatValue(),
      margin: 10,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: 'H'
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.4,
        margin: 0
      },
      dotsOptions: {
        color: qrColor,
        type: dotsType
      },
      backgroundOptions: {
        color: qrBgColor
      },
      cornersSquareOptions: {
        color: qrColor,
        type: cornersType
      },
      cornersDotOptions: {
        color: qrColor,
        type: dotsType
      }
    })

    if (qrRef.current) {
      qrRef.current.innerHTML = ''
      qrCodeRef.current.append(qrRef.current)
    }
  }, [qrValue, qrSize, qrStyle, qrColor, qrBgColor, qrType])

  // Показываем QR в реальном времени
  const shouldShowQR = qrValue.trim() !== ''

  const handleDownload = () => {
    if (qrCodeRef.current) {
      qrCodeRef.current.download({
        name: 'qrcode',
        extension: 'png'
      })
    }
  }

  const formatValue = () => {
    switch (qrType) {
      case 'email':
        return `mailto:${qrValue}`
      case 'phone':
        return `tel:${qrValue}`
      case 'sms':
        return `sms:${qrValue}`
      case 'wifi':
        const [ssid, password, security] = qrValue.split(':')
        return `WIFI:T:${security || 'WPA'};S:${ssid};P:${password};;`
      case 'text':
        // Для кириллицы используем data URI с явным UTF-8
        // Это гарантирует правильное отображение на всех устройствах
        const hasNonLatin = /[^\x00-\x7F]/.test(qrValue)
        if (hasNonLatin) {
          // Кодируем в base64 для надежности
          const encoded = btoa(unescape(encodeURIComponent(qrValue)))
          return `data:text/plain;charset=utf-8;base64,${encoded}`
        }
        return qrValue
      case 'url':
        return qrValue
      default:
        return qrValue
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
              <label>Стиль QR-кода</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {qrStyles.map(style => (
                  <button
                    key={style.id}
                    className={qrStyle === style.id ? '' : 'secondary'}
                    style={{ padding: '0.75rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}
                    onClick={() => setQrStyle(style.id)}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{style.icon}</span>
                    <span>{style.label.split(' ')[1]}</span>
                  </button>
                ))}
              </div>
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
