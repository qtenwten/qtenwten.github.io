import { useState, useEffect, useRef } from 'react'
import QRCodeStyling from 'qr-code-styling'
import SEO from '../components/SEO'
import './QRCodeGenerator.css'

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
      default:
        return qrValue
    }
  }

  return (
    <>
      <SEO
        title="Генератор QR-кодов онлайн - Бесплатно"
        description="Создайте QR-код для текста, ссылки, email, телефона или WiFi. Скачайте в PNG формате. Быстро и бесплатно."
        path="/qr-code-generator"
        keywords="генератор qr кода, создать qr код, qr код онлайн, qr code generator"
      />

      <div className="qr-generator">
        <div className="container">
          <h1>Генератор QR-кодов</h1>
          <p className="subtitle">Создайте QR-код для любых данных</p>

          <div className="qr-content">
            <div className="qr-form">
              <div className="form-group">
                <label>Тип QR-кода</label>
                <div className="qr-types">
                  {qrTypes.map(type => (
                    <button
                      key={type.id}
                      className={`type-btn ${qrType === type.id ? 'active' : ''}`}
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

              <div className="form-group">
                <label>Данные для QR-кода</label>
                <textarea
                  value={qrValue}
                  onChange={(e) => setQrValue(e.target.value)}
                  placeholder={qrTypes.find(t => t.id === qrType)?.placeholder}
                  rows={qrType === 'text' ? 4 : 2}
                />
                {qrType === 'wifi' && (
                  <small>Формат: SSID:пароль:тип_шифрования (WPA/WEP/nopass)</small>
                )}
              </div>

              <div className="form-group">
                <label>Размер: {qrSize}x{qrSize} px</label>
                <input
                  type="range"
                  min="128"
                  max="400"
                  step="16"
                  value={qrSize}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Стиль QR-кода</label>
                <div className="qr-style-buttons">
                  {qrStyles.map(style => (
                    <button
                      key={style.id}
                      className={`style-btn ${qrStyle === style.id ? 'active' : ''}`}
                      onClick={() => setQrStyle(style.id)}
                    >
                      <span className="style-icon">{style.icon}</span>
                      <span>{style.label.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Цветовая схема</label>
                <div className="color-presets">
                  {qrPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      className="preset-btn"
                      style={{ background: preset.bg, color: preset.fg, border: `2px solid ${preset.fg}` }}
                      onClick={() => {
                        setQrColor(preset.fg)
                        setQrBgColor(preset.bg)
                      }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
                <div className="color-pickers">
                  <div className="color-picker">
                    <label>Цвет QR</label>
                    <input
                      type="color"
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                    />
                  </div>
                  <div className="color-picker">
                    <label>Фон</label>
                    <input
                      type="color"
                      value={qrBgColor}
                      onChange={(e) => setQrBgColor(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {shouldShowQR && (
              <div className="qr-result">
                <div className="qr-preview">
                  <div ref={qrRef}></div>
                </div>
                <button className="btn-download" onClick={handleDownload}>
                  📥 Скачать PNG
                </button>
                <p className="qr-info">
                  Отсканируйте камерой телефона или скачайте изображение
                </p>
              </div>
            )}
          </div>

          <div className="qr-features">
            <h2>Возможности генератора</h2>
            <div className="features-grid">
              <div className="feature">
                <span className="feature-icon">🎨</span>
                <h3>Кастомизация</h3>
                <p>Выбирайте цвета и стили QR-кода</p>
              </div>
              <div className="feature">
                <span className="feature-icon">🔗</span>
                <h3>Любые данные</h3>
                <p>Текст, ссылки, контакты, WiFi пароли</p>
              </div>
              <div className="feature">
                <span className="feature-icon">📱</span>
                <h3>Высокое качество</h3>
                <p>Векторная графика, четкое изображение</p>
              </div>
              <div className="feature">
                <span className="feature-icon">⚡</span>
                <h3>Мгновенно</h3>
                <p>Генерация за секунду, без регистрации</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default QRCodeGenerator
