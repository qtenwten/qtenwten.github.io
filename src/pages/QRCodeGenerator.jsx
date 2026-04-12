import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect, useRef } from 'react'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import Icon from '../components/Icon'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import './QRCodeGenerator.css'

const QR_THEME_PRESETS = {
  classic: {
    qrColor: '#111111',
    qrBgColor: '#ffffff',
    moduleStyle: 'square',
    markerStyle: 'square',
    decorative: false,
  },
  soft: {
    qrColor: '#312e81',
    qrBgColor: '#ffffff',
    moduleStyle: 'rounded',
    markerStyle: 'rounded',
    decorative: false,
  },
  panda: {
    qrColor: '#111111',
    qrBgColor: '#fffdf8',
    moduleStyle: 'dots',
    markerStyle: 'rounded',
    decorative: true,
  },
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + safeRadius, y)
  ctx.lineTo(x + width - safeRadius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  ctx.lineTo(x + width, y + height - safeRadius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
  ctx.lineTo(x + safeRadius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  ctx.lineTo(x, y + safeRadius)
  ctx.quadraticCurveTo(x, y, x + safeRadius, y)
  ctx.closePath()
}

function drawModule(ctx, x, y, size, style) {
  if (style === 'dots') {
    ctx.beginPath()
    ctx.arc(x + size / 2, y + size / 2, size * 0.34, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  if (style === 'rounded') {
    drawRoundedRect(ctx, x, y, size, size, size * 0.28)
    ctx.fill()
    return
  }

  ctx.fillRect(x, y, size, size)
}

function drawFinderPattern(ctx, originX, originY, moduleSize, darkColor, lightColor, markerStyle) {
  const outerSize = moduleSize * 7
  const middleOffset = moduleSize
  const middleSize = moduleSize * 5
  const innerOffset = moduleSize * 2
  const innerSize = moduleSize * 3
  const radius = markerStyle === 'rounded' ? moduleSize * 1.15 : moduleSize * 0.25

  ctx.fillStyle = darkColor
  if (markerStyle === 'rounded') {
    drawRoundedRect(ctx, originX, originY, outerSize, outerSize, radius)
    ctx.fill()
  } else {
    ctx.fillRect(originX, originY, outerSize, outerSize)
  }

  ctx.fillStyle = lightColor
  if (markerStyle === 'rounded') {
    drawRoundedRect(ctx, originX + middleOffset, originY + middleOffset, middleSize, middleSize, radius * 0.7)
    ctx.fill()
  } else {
    ctx.fillRect(originX + middleOffset, originY + middleOffset, middleSize, middleSize)
  }

  ctx.fillStyle = darkColor
  if (markerStyle === 'rounded') {
    drawRoundedRect(ctx, originX + innerOffset, originY + innerOffset, innerSize, innerSize, radius * 0.55)
    ctx.fill()
  } else {
    ctx.fillRect(originX + innerOffset, originY + innerOffset, innerSize, innerSize)
  }
}

function isFinderArea(x, y, moduleCount) {
  const inTopLeft = x <= 6 && y <= 6
  const inTopRight = x >= moduleCount - 7 && y <= 6
  const inBottomLeft = x <= 6 && y >= moduleCount - 7

  return inTopLeft || inTopRight || inBottomLeft
}

function escapeWifiValue(value = '') {
  return value.replace(/([\\;,:\"])/g, '\\$1')
}

function normalizeUrlValue(value) {
  if (!value.trim()) {
    return ''
  }

  return /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

async function renderQRCodeToCanvas({
  canvas,
  qrData,
  size,
  moduleStyle,
  markerStyle,
  darkColor,
  lightColor,
  logoDataUrl,
}) {
  const marginModules = 4
  const moduleCount = qrData.modules.size
  const totalModules = moduleCount + marginModules * 2
  const moduleSize = size / totalModules
  const contentOffset = marginModules * moduleSize
  const dpr = window.devicePixelRatio || 1

  canvas.width = Math.round(size * dpr)
  canvas.height = Math.round(size * dpr)
  canvas.style.width = `${size}px`
  canvas.style.height = `${size}px`

  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = lightColor
  ctx.fillRect(0, 0, size, size)

  const moduleData = qrData.modules.data
  ctx.fillStyle = darkColor

  for (let y = 0; y < moduleCount; y += 1) {
    for (let x = 0; x < moduleCount; x += 1) {
      if (!moduleData[y * moduleCount + x]) {
        continue
      }

      if (isFinderArea(x, y, moduleCount)) {
        continue
      }

      drawModule(
        ctx,
        contentOffset + x * moduleSize,
        contentOffset + y * moduleSize,
        moduleSize,
        moduleStyle
      )
    }
  }

  const finderOrigins = [
    [contentOffset, contentOffset],
    [contentOffset + (moduleCount - 7) * moduleSize, contentOffset],
    [contentOffset, contentOffset + (moduleCount - 7) * moduleSize],
  ]

  finderOrigins.forEach(([x, y]) => {
    drawFinderPattern(ctx, x, y, moduleSize, darkColor, lightColor, markerStyle)
  })

  if (logoDataUrl) {
    const logoSize = Math.min(size * 0.18, 72)
    const logoPadding = logoSize * 0.24
    const logoBoxSize = logoSize + logoPadding * 2
    const logoX = (size - logoBoxSize) / 2
    const logoY = (size - logoBoxSize) / 2

    ctx.fillStyle = lightColor
    drawRoundedRect(ctx, logoX, logoY, logoBoxSize, logoBoxSize, 14)
    ctx.fill()

    const logoImage = await loadImage(logoDataUrl)
    ctx.drawImage(logoImage, logoX + logoPadding, logoY + logoPadding, logoSize, logoSize)
  }
}

function QRCodeGenerator() {
  const { t, language } = useLanguage()
  const [qrType, setQrType] = useState('text')
  const [qrValue, setQrValue] = useState('')
  const [qrSize, setQrSize] = useState(256)
  const [qrColor, setQrColor] = useState(QR_THEME_PRESETS.classic.qrColor)
  const [qrBgColor, setQrBgColor] = useState(QR_THEME_PRESETS.classic.qrBgColor)
  const [moduleStyle, setModuleStyle] = useState(QR_THEME_PRESETS.classic.moduleStyle)
  const [markerStyle, setMarkerStyle] = useState(QR_THEME_PRESETS.classic.markerStyle)
  const [themePreset, setThemePreset] = useState('classic')
  const [logoDataUrl, setLogoDataUrl] = useState('')
  const [qrCodeLib, setQrCodeLib] = useState(null)
  const [generationError, setGenerationError] = useState('')
  const canvasRef = useRef(null)

  useEffect(() => {
    let mounted = true

    import('qrcode').then((module) => {
      if (mounted) {
        setQrCodeLib(module.default || module)
      }
    })

    return () => {
      mounted = false
    }
  }, [])

  const qrTypes = [
    { id: 'text', label: t('qrCodeGenerator.types.text'), placeholder: t('qrCodeGenerator.placeholders.text') },
    { id: 'url', label: t('qrCodeGenerator.types.url'), placeholder: t('qrCodeGenerator.placeholders.url') },
    { id: 'email', label: t('qrCodeGenerator.types.email'), placeholder: t('qrCodeGenerator.placeholders.email') },
    { id: 'phone', label: t('qrCodeGenerator.types.phone'), placeholder: t('qrCodeGenerator.placeholders.phone') },
    { id: 'sms', label: t('qrCodeGenerator.types.sms'), placeholder: t('qrCodeGenerator.placeholders.sms') },
    { id: 'wifi', label: t('qrCodeGenerator.types.wifi'), placeholder: t('qrCodeGenerator.placeholders.wifi') }
  ]

  const applyThemePreset = (presetId) => {
    const preset = QR_THEME_PRESETS[presetId]
    if (!preset) return

    setThemePreset(presetId)
    setQrColor(preset.qrColor)
    setQrBgColor(preset.qrBgColor)
    setModuleStyle(preset.moduleStyle)
    setMarkerStyle(preset.markerStyle)
  }

  const formatValue = () => {
    const value = qrValue.trim()

    switch (qrType) {
      case 'url':
        return normalizeUrlValue(value)
      case 'email':
        return `mailto:${value}`
      case 'phone':
        return `tel:${value}`
      case 'sms':
        return `SMSTO:${value}`
      case 'wifi': {
        const [ssid = '', password = '', security = 'WPA'] = value.split(':')
        return `WIFI:T:${escapeWifiValue(security || 'WPA')};S:${escapeWifiValue(ssid)};P:${escapeWifiValue(password)};;`
      }
      default:
        return value
    }
  }

  useEffect(() => {
    let cancelled = false

    async function generate() {
      if (!qrValue.trim() || !qrCodeLib || !canvasRef.current) {
        setGenerationError('')
        return
      }

      try {
        const qrData = qrCodeLib.create(
          [{ data: formatValue(), mode: 'byte' }],
          { errorCorrectionLevel: 'H' }
        )

        await renderQRCodeToCanvas({
          canvas: canvasRef.current,
          qrData,
          size: qrSize,
          moduleStyle,
          markerStyle,
          darkColor: qrColor,
          lightColor: qrBgColor,
          logoDataUrl,
        })

        if (!cancelled) {
          setGenerationError('')
        }
      } catch (error) {
        console.error('QR Code generation error:', error)
        if (!cancelled) {
          setGenerationError(t('qrCodeGenerator.errorGenerate'))
        }
      }
    }

    generate()

    return () => {
      cancelled = true
    }
  }, [qrCodeLib, qrValue, qrSize, qrColor, qrBgColor, qrType, moduleStyle, markerStyle, logoDataUrl, language])

  const shouldShowQR = qrValue.trim() !== '' && !generationError
  const presetIsDecorative = QR_THEME_PRESETS[themePreset]?.decorative

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoDataUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDownload = () => {
    const canvas = canvasRef.current

    if (canvas) {
      canvas.toBlob((blob) => {
        if (!blob) return

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'qrcode.png'
        link.click()
        URL.revokeObjectURL(url)
      })
    }
  }

  const faqItems = t('qrCodeGenerator.info.faqTitle')
    ? [
        { q: t('qrCodeGenerator.info.faqList.q1'), a: t('qrCodeGenerator.info.faqList.a1') },
        { q: t('qrCodeGenerator.info.faqList.q2'), a: t('qrCodeGenerator.info.faqList.a2') },
        { q: t('qrCodeGenerator.info.faqList.q3'), a: t('qrCodeGenerator.info.faqList.a3') },
        { q: t('qrCodeGenerator.info.faqList.q4'), a: t('qrCodeGenerator.info.faqList.a4') },
      ]
    : []

  return (
    <>
      <SEO
        title={t('seo.qrCodeGenerator.title')}
        description={t('seo.qrCodeGenerator.description')}
        path={`/${language}/qr-code-generator`}
        keywords={t('seo.qrCodeGenerator.keywords')}
      />

      <div className="tool-container">
        <h1>{t('qrCodeGenerator.title')}</h1>
        <p>{t('qrCodeGenerator.subtitle')}</p>

        <div className="qr-generator-layout">
          <div>
            <div className="field">
              <label>{t('qrCodeGenerator.typeLabel')}</label>
              <div className="qr-types-grid">
                {qrTypes.map(type => (
                  <button
                    key={type.id}
                    type="button"
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
              <label htmlFor="qrValue">{t('qrCodeGenerator.dataLabel')}</label>
              <textarea
                id="qrValue"
                value={qrValue}
                onChange={(e) => setQrValue(e.target.value)}
                placeholder={qrTypes.find(t => t.id === qrType)?.placeholder}
                rows={qrType === 'text' ? 4 : 2}
              />
              <small className="qr-helper-text">{t('qrCodeGenerator.unicodeHint')}</small>
              {qrType === 'wifi' && (
                <small className="qr-helper-text">{t('qrCodeGenerator.wifiFormat')}</small>
              )}
            </div>

            <div className="field">
              <label htmlFor="themePreset">{t('qrCodeGenerator.themeLabel')}</label>
              <select id="themePreset" value={themePreset} onChange={(e) => applyThemePreset(e.target.value)}>
                <option value="classic">{t('qrCodeGenerator.themes.classic')}</option>
                <option value="soft">{t('qrCodeGenerator.themes.soft')}</option>
                <option value="panda">{t('qrCodeGenerator.themes.panda')}</option>
              </select>
            </div>

            <div className="qr-custom-grid">
              <div className="field">
                <label htmlFor="moduleStyle">{t('qrCodeGenerator.moduleStyleLabel')}</label>
                <select id="moduleStyle" value={moduleStyle} onChange={(e) => setModuleStyle(e.target.value)}>
                  <option value="square">{t('qrCodeGenerator.moduleStyles.square')}</option>
                  <option value="rounded">{t('qrCodeGenerator.moduleStyles.rounded')}</option>
                  <option value="dots">{t('qrCodeGenerator.moduleStyles.dots')}</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="markerStyle">{t('qrCodeGenerator.markerStyleLabel')}</label>
                <select id="markerStyle" value={markerStyle} onChange={(e) => setMarkerStyle(e.target.value)}>
                  <option value="square">{t('qrCodeGenerator.markerStyles.square')}</option>
                  <option value="rounded">{t('qrCodeGenerator.markerStyles.rounded')}</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="qrSize">{t('qrCodeGenerator.sizeLabel')}: {qrSize}x{qrSize} px</label>
              <input
                id="qrSize"
                type="range"
                min="160"
                max="480"
                step="16"
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
              />
            </div>

            <div className="field">
              <label>{t('qrCodeGenerator.colorsLabel')}</label>
              <div className="qr-custom-grid">
                <div>
                  <label htmlFor="qrColor" className="qr-color-label">{t('qrCodeGenerator.qrColor')}</label>
                  <input
                    id="qrColor"
                    type="color"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="qr-color-input"
                  />
                </div>
                <div>
                  <label htmlFor="qrBgColor" className="qr-color-label">{t('qrCodeGenerator.bgColor')}</label>
                  <input
                    id="qrBgColor"
                    type="color"
                    value={qrBgColor}
                    onChange={(e) => setQrBgColor(e.target.value)}
                    className="qr-color-input"
                  />
                </div>
              </div>
            </div>

            <div className="field">
              <label htmlFor="logoUpload">{t('qrCodeGenerator.logoLabel')}</label>
              <input
                id="logoUpload"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
              />
              <small className="qr-helper-text">{t('qrCodeGenerator.logoHint')}</small>
              {logoDataUrl && (
                <button type="button" className="secondary qr-logo-remove" onClick={() => setLogoDataUrl('')}>
                  {t('qrCodeGenerator.removeLogo')}
                </button>
              )}
            </div>

            {(presetIsDecorative || logoDataUrl) && (
              <div className="qr-warning">
                <strong>{t('qrCodeGenerator.scanabilityTitle')}</strong>
                <p>{logoDataUrl ? t('qrCodeGenerator.logoWarning') : t('qrCodeGenerator.decorativeWarning')}</p>
              </div>
            )}
          </div>

          <div>
            {qrValue.trim() !== '' ? (
              <div className="result-box success qr-preview-shell">
                {generationError ? (
                  <div className="qr-preview-placeholder">
                    <Icon name="qr_code" size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p>{generationError}</p>
                  </div>
                ) : (
                  <>
                    <div className="qr-preview-frame">
                      <canvas ref={canvasRef} className="qr-preview-canvas" />
                    </div>
                    <button type="button" onClick={handleDownload} style={{ width: '100%', maxWidth: '320px' }}>
                      {t('qrCodeGenerator.downloadButton')}
                    </button>
                    <p className="qr-preview-note">{t('qrCodeGenerator.scanText')}</p>
                  </>
                )}
              </div>
            ) : (
              <div className="qr-preview-empty">
                <Icon name="qr_code" size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p>{t('qrCodeGenerator.emptyState')}</p>
              </div>
            )}
          </div>
        </div>

        <ToolDescriptionSection>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{t('qrCodeGenerator.info.howToTitle')}</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            {t('qrCodeGenerator.info.howToDescription')}
          </p>
          <ol style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8', marginBottom: '1rem' }}>
            <li>{t('qrCodeGenerator.info.howToSteps.step1')}</li>
            <li>{t('qrCodeGenerator.info.howToSteps.step2')}</li>
            <li>{t('qrCodeGenerator.info.howToSteps.step3')}</li>
          </ol>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>
            {t('qrCodeGenerator.info.howToNote')}
          </p>

          <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>{t('qrCodeGenerator.info.mainTitle')}</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>
            {t('qrCodeGenerator.info.mainDescription')}
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{t('qrCodeGenerator.info.purposesTitle')}</h3>
          <p style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>{t('qrCodeGenerator.info.purposesDescription')}</p>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>{t('qrCodeGenerator.info.purposesList.text')}</li>
            <li>{t('qrCodeGenerator.info.purposesList.link')}</li>
            <li>{t('qrCodeGenerator.info.purposesList.email')}</li>
            <li>{t('qrCodeGenerator.info.purposesList.phone')}</li>
            <li>{t('qrCodeGenerator.info.purposesList.sms')}</li>
            <li>{t('qrCodeGenerator.info.purposesList.wifi')}</li>
          </ul>
          <p style={{ marginTop: '1rem', marginBottom: '1.5rem', color: 'var(--text)' }}>
            {t('qrCodeGenerator.info.purposesNote')}
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{t('qrCodeGenerator.info.featuresTitle')}</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>{t('qrCodeGenerator.info.featuresList.free')}</li>
            <li>{t('qrCodeGenerator.info.featuresList.colors')}</li>
            <li>{t('qrCodeGenerator.info.featuresList.styles')}</li>
            <li>{t('qrCodeGenerator.info.featuresList.size')}</li>
            <li>{t('qrCodeGenerator.info.featuresList.download')}</li>
            <li>{t('qrCodeGenerator.info.featuresList.instant')}</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{t('qrCodeGenerator.info.stepsTitle')}</h3>
          <ol style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>{t('qrCodeGenerator.info.stepsList.step1')}</li>
            <li>{t('qrCodeGenerator.info.stepsList.step2')}</li>
            <li>{t('qrCodeGenerator.info.stepsList.step3')}</li>
            <li>{t('qrCodeGenerator.info.stepsList.step4')}</li>
          </ol>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{t('qrCodeGenerator.info.useCasesTitle')}</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            <strong>{t('qrCodeGenerator.info.business')}</strong><br />
            {t('qrCodeGenerator.info.businessDescription')}
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '1rem' }}>
            <strong>{t('qrCodeGenerator.info.wifi')}</strong><br />
            {t('qrCodeGenerator.info.wifiDescription')}
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '1rem' }}>
            <strong>{t('qrCodeGenerator.info.events')}</strong><br />
            {t('qrCodeGenerator.info.eventsDescription')}
          </p>

          <ToolFaq title={t('qrCodeGenerator.info.faqTitle')} items={faqItems} />
        </ToolDescriptionSection>

        <RelatedTools currentPath={`/${language}/qr-code-generator`} />
      </div>
    </>
  )
}

export default QRCodeGenerator
