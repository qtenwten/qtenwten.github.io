import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect, useRef } from 'react'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import Icon from '../components/Icon'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import { useAsyncRequest } from '../hooks/useAsyncRequest'
import { ResultActions, ResultMetric, ResultMetrics, ResultNotice, ResultSection, ResultSummary } from '../components/ResultSection'
import ToolPageShell, { ToolControls, ToolHelp, ToolPageHero, ToolPageLayout, ToolRelated, ToolResult, ToolSectionHeading } from '../components/ToolPageShell'
import './QRCodeGenerator.css'

const QR_THEME_PRESETS = {
  classic: {
    qrColor: '#111111',
    qrBgColor: '#ffffff',
    moduleStyle: 'square',
    markerStyle: 'square',
  },
  soft: {
    qrColor: '#312e81',
    qrBgColor: '#ffffff',
    moduleStyle: 'rounded',
    markerStyle: 'rounded',
  },
}

const QR_SIZE_DEFAULT = 256
const QR_SIZE_MIN = 160
const QR_SIZE_MAX = 400
const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_NUMBER_PATTERN = /^\+?[\d\s().-]+$/

const INITIAL_QR_FORM = {
  text: '',
  url: '',
  emailAddress: '',
  emailSubject: '',
  emailBody: '',
  phone: '',
  smsNumber: '',
  smsMessage: '',
  wifiSsid: '',
  wifiPassword: '',
  wifiSecurity: 'WPA',
}

const QR_TYPE_EMPTY_VALUES = {
  text: {
    text: '',
  },
  url: {
    url: '',
  },
  email: {
    emailAddress: '',
    emailSubject: '',
    emailBody: '',
  },
  phone: {
    phone: '',
  },
  sms: {
    smsNumber: '',
    smsMessage: '',
  },
  wifi: {
    wifiSsid: '',
    wifiPassword: '',
    wifiSecurity: 'WPA',
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

function isValidEmailAddress(value) {
  return EMAIL_ADDRESS_PATTERN.test(value.trim())
}

function isValidPhoneNumber(value) {
  const trimmedValue = value.trim()
  const digitsOnly = trimmedValue.replace(/\D/g, '')

  return digitsOnly.length >= 5 && PHONE_NUMBER_PATTERN.test(trimmedValue)
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function getContainedSize(sourceWidth, sourceHeight, maxWidth, maxHeight) {
  if (!sourceWidth || !sourceHeight) {
    return {
      width: maxWidth,
      height: maxHeight,
      offsetX: 0,
      offsetY: 0,
    }
  }

  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale

  return {
    width,
    height,
    offsetX: (maxWidth - width) / 2,
    offsetY: (maxHeight - height) / 2,
  }
}

function clearCanvas(canvas) {
  const ctx = canvas?.getContext('2d')
  if (!ctx || !canvas) {
    return
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function buildQrPayload(qrType, qrForm) {
  switch (qrType) {
    case 'url':
      return normalizeUrlValue(qrForm.url || '')
    case 'email': {
      const emailAddress = qrForm.emailAddress.trim()
      if (!emailAddress) {
        return ''
      }

      const params = new URLSearchParams()

      if (qrForm.emailSubject.trim()) {
        params.set('subject', qrForm.emailSubject.trim())
      }

      if (qrForm.emailBody.trim()) {
        params.set('body', qrForm.emailBody.trim())
      }

      const query = params.toString()
      return `mailto:${emailAddress}${query ? `?${query}` : ''}`
    }
    case 'phone': {
      const phone = qrForm.phone.trim()
      return phone ? `tel:${phone}` : ''
    }
    case 'sms': {
      const smsNumber = qrForm.smsNumber.trim()
      const smsMessage = qrForm.smsMessage.trim()

      if (!smsNumber) {
        return ''
      }

      return `SMSTO:${smsNumber}${smsMessage ? `:${smsMessage}` : ''}`
    }
    case 'wifi': {
      const wifiSsid = qrForm.wifiSsid.trim()
      if (!wifiSsid) {
        return ''
      }

      const wifiSecurity = qrForm.wifiSecurity || 'WPA'
      const wifiPassword = qrForm.wifiPassword.trim()
      const segments = [
        `T:${escapeWifiValue(wifiSecurity)};`,
        `S:${escapeWifiValue(wifiSsid)};`,
      ]

      if (wifiSecurity !== 'nopass') {
        segments.push(`P:${escapeWifiValue(wifiPassword)};`)
      }

      return `WIFI:${segments.join('')};`
    }
    default:
      return qrForm.text.trim()
  }
}

function getQrValidationState(qrType, qrForm) {
  const fieldErrors = {}

  switch (qrType) {
    case 'email': {
      const emailAddress = qrForm.emailAddress.trim()
      const hasEmailDetails = qrForm.emailSubject.trim() !== '' || qrForm.emailBody.trim() !== ''

      if (!emailAddress && hasEmailDetails) {
        fieldErrors.emailAddress = 'qrCodeGenerator.validation.emailAddressRequired'
      } else if (emailAddress && !isValidEmailAddress(emailAddress)) {
        fieldErrors.emailAddress = 'qrCodeGenerator.validation.invalidEmailAddress'
      }
      break
    }
    case 'phone': {
      const phone = qrForm.phone.trim()

      if (phone && !isValidPhoneNumber(phone)) {
        fieldErrors.phone = 'qrCodeGenerator.validation.invalidPhoneNumber'
      }
      break
    }
    case 'sms': {
      const smsNumber = qrForm.smsNumber.trim()
      const smsMessage = qrForm.smsMessage.trim()

      if (!smsNumber && smsMessage) {
        fieldErrors.smsNumber = 'qrCodeGenerator.validation.smsNumberRequired'
      } else if (smsNumber && !isValidPhoneNumber(smsNumber)) {
        fieldErrors.smsNumber = 'qrCodeGenerator.validation.invalidPhoneNumber'
      }
      break
    }
    case 'wifi': {
      const wifiSsid = qrForm.wifiSsid.trim()
      const wifiPassword = qrForm.wifiPassword.trim()
      const wifiSecurity = qrForm.wifiSecurity || 'WPA'
      const hasAdditionalWifiDetails = wifiPassword !== '' || wifiSecurity !== 'WPA'

      if (!wifiSsid && hasAdditionalWifiDetails) {
        fieldErrors.wifiSsid = 'qrCodeGenerator.validation.wifiSsidRequired'
      }

      if (wifiSsid && wifiSecurity !== 'nopass' && !wifiPassword) {
        fieldErrors.wifiPassword = 'qrCodeGenerator.validation.wifiPasswordRequired'
      }
      break
    }
    default:
      break
  }

  const firstErrorKey = Object.values(fieldErrors)[0] || ''

  return {
    fieldErrors,
    firstErrorKey,
    isValid: firstErrorKey === '',
  }
}

function hasQrTypeContent(qrType, qrForm) {
  switch (qrType) {
    case 'url':
      return qrForm.url.trim() !== ''
    case 'email':
      return qrForm.emailAddress.trim() !== '' || qrForm.emailSubject.trim() !== '' || qrForm.emailBody.trim() !== ''
    case 'phone':
      return qrForm.phone.trim() !== ''
    case 'sms':
      return qrForm.smsNumber.trim() !== '' || qrForm.smsMessage.trim() !== ''
    case 'wifi':
      return qrForm.wifiSsid.trim() !== '' || qrForm.wifiPassword.trim() !== '' || qrForm.wifiSecurity !== 'WPA'
    default:
      return qrForm.text.trim() !== ''
  }
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
  isCurrent,
}) {
  const marginModules = 4
  const moduleCount = qrData.modules.size
  const totalModules = moduleCount + marginModules * 2
  const moduleSize = size / totalModules
  const contentOffset = marginModules * moduleSize
  const dpr = window.devicePixelRatio || 1

  canvas.width = Math.round(size * dpr)
  canvas.height = Math.round(size * dpr)

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
    if (!isCurrent?.()) {
      return
    }

    const sourceWidth = logoImage.naturalWidth || logoImage.width
    const sourceHeight = logoImage.naturalHeight || logoImage.height
    const {
      width: drawWidth,
      height: drawHeight,
      offsetX,
      offsetY,
    } = getContainedSize(sourceWidth, sourceHeight, logoSize, logoSize)

    ctx.drawImage(
      logoImage,
      logoX + logoPadding + offsetX,
      logoY + logoPadding + offsetY,
      drawWidth,
      drawHeight
    )
  }
}

function QRCodeGenerator() {
  const { t, language } = useLanguage()
  const { markTask } = useAsyncRequest()
  const [qrType, setQrType] = useState('text')
  const [qrForm, setQrForm] = useState(INITIAL_QR_FORM)
  const [qrSize, setQrSize] = useState(QR_SIZE_DEFAULT)
  const [qrColor, setQrColor] = useState(QR_THEME_PRESETS.classic.qrColor)
  const [qrBgColor, setQrBgColor] = useState(QR_THEME_PRESETS.classic.qrBgColor)
  const [moduleStyle, setModuleStyle] = useState(QR_THEME_PRESETS.classic.moduleStyle)
  const [markerStyle, setMarkerStyle] = useState(QR_THEME_PRESETS.classic.markerStyle)
  const [themePreset, setThemePreset] = useState('classic')
  const [logoDataUrl, setLogoDataUrl] = useState('')
  const [logoFileName, setLogoFileName] = useState('')
  const [qrCodeLib, setQrCodeLib] = useState(null)
  const [generationError, setGenerationError] = useState('')
  const canvasRef = useRef(null)

  useEffect(() => {
    let mounted = true

    import('qrcode')
      .then((module) => {
        if (mounted) {
          setQrCodeLib(module.default || module)
          setGenerationError('')
        }
      })
      .catch(() => {
        if (mounted) {
          setGenerationError(t('qrCodeGenerator.errorGenerate'))
        }
      })

    return () => {
      mounted = false
    }
  }, [t])

  const qrTypes = [
    {
      id: 'text',
      label: t('qrCodeGenerator.types.text'),
      description: t('qrCodeGenerator.typeDescriptions.text'),
    },
    {
      id: 'url',
      label: t('qrCodeGenerator.types.url'),
      description: t('qrCodeGenerator.typeDescriptions.url'),
    },
    {
      id: 'email',
      label: t('qrCodeGenerator.types.email'),
      description: t('qrCodeGenerator.typeDescriptions.email'),
    },
    {
      id: 'phone',
      label: t('qrCodeGenerator.types.phone'),
      description: t('qrCodeGenerator.typeDescriptions.phone'),
    },
    {
      id: 'sms',
      label: t('qrCodeGenerator.types.sms'),
      description: t('qrCodeGenerator.typeDescriptions.sms'),
    },
    {
      id: 'wifi',
      label: t('qrCodeGenerator.types.wifi'),
      description: t('qrCodeGenerator.typeDescriptions.wifi'),
    },
  ]

  const activeType = qrTypes.find(type => type.id === qrType) || qrTypes[0]
  const validationState = getQrValidationState(qrType, qrForm)
  const hasActiveTypeContent = hasQrTypeContent(qrType, qrForm)
  const hasBlockingValidation = hasActiveTypeContent && !validationState.isValid
  const formattedValue = validationState.isValid ? buildQrPayload(qrType, qrForm) : ''
  const payloadLength = formattedValue.length
  const validationMessage = validationState.firstErrorKey ? t(validationState.firstErrorKey) : ''
  const shouldShowQR = formattedValue !== '' && !generationError
  const previewTone = shouldShowQR ? 'success' : generationError || hasBlockingValidation ? 'default' : 'accent'
  const previewTitle = generationError
    ? t('qrCodeGenerator.previewErrorTitle')
    : hasBlockingValidation
      ? t('qrCodeGenerator.previewInvalidTitle')
    : shouldShowQR
      ? t('qrCodeGenerator.previewReadyTitle')
      : t('qrCodeGenerator.previewEmptyTitle')
  const previewDescription = generationError
    ? generationError
    : hasBlockingValidation
      ? validationMessage
    : shouldShowQR
      ? `${activeType.label} · ${t('qrCodeGenerator.sizeLabel')}: ${qrSize}x${qrSize}px`
      : t('qrCodeGenerator.previewEmptyDescription')

  const getFieldError = (fieldName) => {
    const messageKey = validationState.fieldErrors[fieldName]
    return messageKey ? t(messageKey) : ''
  }

  const applyThemePreset = (presetId) => {
    const preset = QR_THEME_PRESETS[presetId]
    if (!preset) {
      return
    }

    setThemePreset(presetId)
    setQrColor(preset.qrColor)
    setQrBgColor(preset.qrBgColor)
    setModuleStyle(preset.moduleStyle)
    setMarkerStyle(preset.markerStyle)
  }

  const updateQrForm = (field, value) => {
    setQrForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  useEffect(() => {
    const task = markTask()

    async function generate() {
      if (!formattedValue || !qrCodeLib || !canvasRef.current) {
        clearCanvas(canvasRef.current)
        if (task.isCurrent()) {
          setGenerationError('')
        }
        return
      }

      try {
        const qrData = qrCodeLib.create(
          [{ data: formattedValue, mode: 'byte' }],
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
          isCurrent: task.isCurrent,
        })

        if (task.isCurrent()) {
          setGenerationError('')
        }
      } catch (error) {
        console.error('QR Code generation error:', error)
        clearCanvas(canvasRef.current)
        if (task.isCurrent()) {
          setGenerationError(t('qrCodeGenerator.errorGenerate'))
        }
      }
    }

    generate()
  }, [formattedValue, qrCodeLib, qrSize, qrColor, qrBgColor, moduleStyle, markerStyle, logoDataUrl, language, markTask, t])

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoDataUrl(reader.result)
        setLogoFileName(file.name)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoDataUrl('')
    setLogoFileName('')
  }

  const handleClearCurrentData = () => {
    setQrForm((current) => ({
      ...current,
      ...QR_TYPE_EMPTY_VALUES[qrType],
    }))
  }

  const handleResetAppearance = () => {
    applyThemePreset('classic')
    setQrSize(QR_SIZE_DEFAULT)
    handleRemoveLogo()
  }

  const handleDownload = () => {
    const canvas = canvasRef.current

    if (!shouldShowQR || !canvas) {
      return
    }

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

      <ToolPageShell className="qr-tool-page">
        <ToolPageHero
          className="qr-hero"
          eyebrow={t('qrCodeGenerator.heroEyebrow')}
          title={t('qrCodeGenerator.title')}
          subtitle={t('qrCodeGenerator.subtitle')}
          note={t('qrCodeGenerator.heroNote')}
        />

        <ToolPageLayout className="qr-generator-layout tool-page-layout--split">
          <ToolControls className="qr-controls-panel">
            <section className="qr-section">
              <ToolSectionHeading
                title={t('qrCodeGenerator.sections.typeTitle')}
                subtitle={t('qrCodeGenerator.sections.typeDescription')}
              />

              <div className="qr-types-grid">
                {qrTypes.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    className={[
                      'qr-type-button',
                      qrType === type.id ? 'is-active' : 'secondary',
                    ].join(' ')}
                    onClick={() => setQrType(type.id)}
                  >
                    <span className="qr-type-button__label">{type.label}</span>
                    <span className="qr-type-button__description">{type.description}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="qr-section">
              <ToolSectionHeading
                title={t('qrCodeGenerator.sections.contentTitle')}
                subtitle={t('qrCodeGenerator.sections.contentDescription')}
              />

              {qrType === 'text' && (
                <div className="field">
                  <label htmlFor="qrText">{t('qrCodeGenerator.fields.text')}</label>
                  <textarea
                    id="qrText"
                    value={qrForm.text}
                    onChange={(event) => updateQrForm('text', event.target.value)}
                    placeholder={t('qrCodeGenerator.placeholders.text')}
                    rows={6}
                  />
                  <small className="qr-helper-text">{t('qrCodeGenerator.unicodeHint')}</small>
                </div>
              )}

              {qrType === 'url' && (
                <div className="field">
                  <label htmlFor="qrUrl">{t('qrCodeGenerator.fields.url')}</label>
                  <input
                    id="qrUrl"
                    type="url"
                    value={qrForm.url}
                    onChange={(event) => updateQrForm('url', event.target.value)}
                    placeholder={t('qrCodeGenerator.placeholders.url')}
                  />
                  <small className="qr-helper-text">{t('qrCodeGenerator.contentHints.url')}</small>
                </div>
              )}

              {qrType === 'email' && (
                <>
                  <div className="qr-field-grid">
                    <div className="field">
                      <label htmlFor="qrEmailAddress">{t('qrCodeGenerator.fields.emailAddress')}</label>
                      <input
                        id="qrEmailAddress"
                        type="email"
                        value={qrForm.emailAddress}
                        onChange={(event) => updateQrForm('emailAddress', event.target.value)}
                        placeholder={t('qrCodeGenerator.placeholders.emailAddress')}
                        aria-invalid={getFieldError('emailAddress') ? 'true' : 'false'}
                        aria-describedby={getFieldError('emailAddress') ? 'qrEmailAddressError' : undefined}
                      />
                      {getFieldError('emailAddress') && (
                        <div id="qrEmailAddressError" className="qr-inline-error">{getFieldError('emailAddress')}</div>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="qrEmailSubject">{t('qrCodeGenerator.fields.emailSubject')}</label>
                      <input
                        id="qrEmailSubject"
                        type="text"
                        value={qrForm.emailSubject}
                        onChange={(event) => updateQrForm('emailSubject', event.target.value)}
                        placeholder={t('qrCodeGenerator.placeholders.emailSubject')}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="qrEmailBody">{t('qrCodeGenerator.fields.emailBody')}</label>
                    <textarea
                      id="qrEmailBody"
                      value={qrForm.emailBody}
                      onChange={(event) => updateQrForm('emailBody', event.target.value)}
                      placeholder={t('qrCodeGenerator.placeholders.emailBody')}
                      rows={4}
                    />
                  </div>

                  <small className="qr-helper-text">{t('qrCodeGenerator.contentHints.email')}</small>
                </>
              )}

              {qrType === 'phone' && (
                <div className="field">
                  <label htmlFor="qrPhone">{t('qrCodeGenerator.fields.phone')}</label>
                  <input
                    id="qrPhone"
                    type="tel"
                    value={qrForm.phone}
                    onChange={(event) => updateQrForm('phone', event.target.value)}
                    placeholder={t('qrCodeGenerator.placeholders.phone')}
                    aria-invalid={getFieldError('phone') ? 'true' : 'false'}
                    aria-describedby={getFieldError('phone') ? 'qrPhoneError' : undefined}
                  />
                  {getFieldError('phone') && (
                    <div id="qrPhoneError" className="qr-inline-error">{getFieldError('phone')}</div>
                  )}
                  <small className="qr-helper-text">{t('qrCodeGenerator.contentHints.phone')}</small>
                </div>
              )}

              {qrType === 'sms' && (
                <>
                  <div className="qr-field-grid">
                    <div className="field">
                      <label htmlFor="qrSmsNumber">{t('qrCodeGenerator.fields.smsNumber')}</label>
                      <input
                        id="qrSmsNumber"
                        type="tel"
                        value={qrForm.smsNumber}
                        onChange={(event) => updateQrForm('smsNumber', event.target.value)}
                        placeholder={t('qrCodeGenerator.placeholders.smsNumber')}
                        aria-invalid={getFieldError('smsNumber') ? 'true' : 'false'}
                        aria-describedby={getFieldError('smsNumber') ? 'qrSmsNumberError' : undefined}
                      />
                      {getFieldError('smsNumber') && (
                        <div id="qrSmsNumberError" className="qr-inline-error">{getFieldError('smsNumber')}</div>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="qrSmsMessage">{t('qrCodeGenerator.fields.smsMessage')}</label>
                      <input
                        id="qrSmsMessage"
                        type="text"
                        value={qrForm.smsMessage}
                        onChange={(event) => updateQrForm('smsMessage', event.target.value)}
                        placeholder={t('qrCodeGenerator.placeholders.smsMessage')}
                      />
                    </div>
                  </div>

                  <small className="qr-helper-text">{t('qrCodeGenerator.contentHints.sms')}</small>
                </>
              )}

              {qrType === 'wifi' && (
                <>
                  <div className="qr-field-grid">
                    <div className="field">
                      <label htmlFor="qrWifiSsid">{t('qrCodeGenerator.fields.wifiSsid')}</label>
                      <input
                        id="qrWifiSsid"
                        type="text"
                        value={qrForm.wifiSsid}
                        onChange={(event) => updateQrForm('wifiSsid', event.target.value)}
                        placeholder={t('qrCodeGenerator.placeholders.wifiSsid')}
                        aria-invalid={getFieldError('wifiSsid') ? 'true' : 'false'}
                        aria-describedby={getFieldError('wifiSsid') ? 'qrWifiSsidError' : undefined}
                      />
                      {getFieldError('wifiSsid') && (
                        <div id="qrWifiSsidError" className="qr-inline-error">{getFieldError('wifiSsid')}</div>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="qrWifiSecurity">{t('qrCodeGenerator.fields.wifiSecurity')}</label>
                      <select
                        id="qrWifiSecurity"
                        value={qrForm.wifiSecurity}
                        onChange={(event) => updateQrForm('wifiSecurity', event.target.value)}
                      >
                        <option value="WPA">{t('qrCodeGenerator.wifiSecurity.WPA')}</option>
                        <option value="WEP">{t('qrCodeGenerator.wifiSecurity.WEP')}</option>
                        <option value="nopass">{t('qrCodeGenerator.wifiSecurity.nopass')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="qrWifiPassword">{t('qrCodeGenerator.fields.wifiPassword')}</label>
                    <input
                      id="qrWifiPassword"
                      type="text"
                      value={qrForm.wifiPassword}
                      onChange={(event) => updateQrForm('wifiPassword', event.target.value)}
                      placeholder={t('qrCodeGenerator.placeholders.wifiPassword')}
                      disabled={qrForm.wifiSecurity === 'nopass'}
                      aria-invalid={getFieldError('wifiPassword') ? 'true' : 'false'}
                      aria-describedby={getFieldError('wifiPassword') ? 'qrWifiPasswordError' : undefined}
                    />
                    {getFieldError('wifiPassword') && (
                      <div id="qrWifiPasswordError" className="qr-inline-error">{getFieldError('wifiPassword')}</div>
                    )}
                  </div>

                  <small className="qr-helper-text">{t('qrCodeGenerator.contentHints.wifi')}</small>
                </>
              )}
            </section>

            <section className="qr-section">
              <ToolSectionHeading
                title={t('qrCodeGenerator.sections.styleTitle')}
                subtitle={t('qrCodeGenerator.sections.styleDescription')}
              />

              <div className="field">
                <label htmlFor="themePreset">{t('qrCodeGenerator.themeLabel')}</label>
                <select
                  id="themePreset"
                  value={themePreset}
                  onChange={(event) => {
                    if (event.target.value === 'custom') {
                      return
                    }

                    applyThemePreset(event.target.value)
                  }}
                >
                  <option value="classic">{t('qrCodeGenerator.themes.classic')}</option>
                  <option value="soft">{t('qrCodeGenerator.themes.soft')}</option>
                  <option value="custom">{t('qrCodeGenerator.themes.custom')}</option>
                </select>
              </div>

              <div className="qr-style-grid">
                <div className="field">
                  <label htmlFor="moduleStyle">{t('qrCodeGenerator.moduleStyleLabel')}</label>
                  <select
                    id="moduleStyle"
                    value={moduleStyle}
                    onChange={(event) => {
                      setThemePreset('custom')
                      setModuleStyle(event.target.value)
                    }}
                  >
                    <option value="square">{t('qrCodeGenerator.moduleStyles.square')}</option>
                    <option value="rounded">{t('qrCodeGenerator.moduleStyles.rounded')}</option>
                    <option value="dots">{t('qrCodeGenerator.moduleStyles.dots')}</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="markerStyle">{t('qrCodeGenerator.markerStyleLabel')}</label>
                  <select
                    id="markerStyle"
                    value={markerStyle}
                    onChange={(event) => {
                      setThemePreset('custom')
                      setMarkerStyle(event.target.value)
                    }}
                  >
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
                  min={String(QR_SIZE_MIN)}
                  max={String(QR_SIZE_MAX)}
                  step="16"
                  value={qrSize}
                  onChange={(event) => setQrSize(Number(event.target.value))}
                />
                <small className="qr-helper-text">{t('qrCodeGenerator.sizeHint')}</small>
              </div>

              <div className="field">
                <label>{t('qrCodeGenerator.colorsLabel')}</label>
                <div className="qr-color-grid">
                  <div>
                    <label htmlFor="qrColor" className="qr-color-label">{t('qrCodeGenerator.qrColor')}</label>
                    <input
                      id="qrColor"
                      type="color"
                      value={qrColor}
                      onChange={(event) => {
                        setThemePreset('custom')
                        setQrColor(event.target.value)
                      }}
                      className="qr-color-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="qrBgColor" className="qr-color-label">{t('qrCodeGenerator.bgColor')}</label>
                    <input
                      id="qrBgColor"
                      type="color"
                      value={qrBgColor}
                      onChange={(event) => {
                        setThemePreset('custom')
                        setQrBgColor(event.target.value)
                      }}
                      className="qr-color-input"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="qr-section">
              <ToolSectionHeading
                title={t('qrCodeGenerator.sections.logoTitle')}
                subtitle={t('qrCodeGenerator.sections.logoDescription')}
              />

              <div className="field">
                <label htmlFor="logoUpload">{t('qrCodeGenerator.logoLabel')}</label>
                <input
                  id="logoUpload"
                  type="file"
                  accept="image/png,.png,image/jpeg,.jpg,.jpeg,image/webp,.webp,image/svg+xml,.svg"
                  onChange={handleLogoUpload}
                />
                <small className="qr-helper-text">{t('qrCodeGenerator.logoHint')}</small>
              </div>

              <div className={`qr-logo-preview-slot ${logoDataUrl ? 'is-filled' : 'is-empty'}`}>
                {logoDataUrl && (
                  <div className="qr-logo-preview-card">
                    <div className="qr-logo-preview-frame">
                      <img src={logoDataUrl} alt="" />
                    </div>

                    <div className="qr-logo-meta">
                      <strong>{t('qrCodeGenerator.logoLoadedLabel')}</strong>
                      <span>{logoFileName || t('qrCodeGenerator.previewMetrics.logoReady')}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className={`qr-logo-actions-slot ${logoDataUrl ? 'is-filled' : 'is-empty'}`}>
                {logoDataUrl && (
                  <button type="button" className="secondary qr-logo-remove" onClick={handleRemoveLogo}>
                    {t('qrCodeGenerator.removeLogo')}
                  </button>
                )}
              </div>
            </section>
          </ToolControls>

          <ToolResult className="qr-preview-panel">
            <ResultSection tone={previewTone} className="qr-preview-shell">
              <ResultSummary
                centered
                kicker={t('qrCodeGenerator.previewKicker')}
                title={previewTitle}
                description={previewDescription}
              />

              <div className="qr-preview-badges" aria-hidden="true">
                <span className="qr-preview-badge">{t('qrCodeGenerator.previewBadges.live')}</span>
                <span className="qr-preview-badge">{t('qrCodeGenerator.previewBadges.brand')}</span>
                <span className="qr-preview-badge">{t('qrCodeGenerator.previewBadges.export')}</span>
              </div>

              <div className="qr-preview-frame">
                <div className="qr-preview-stage" style={{ '--qr-preview-size': `${qrSize}px` }}>
                  <canvas ref={canvasRef} className={`qr-preview-canvas ${shouldShowQR ? 'is-visible' : 'is-hidden'}`} />

                  {!shouldShowQR && (
                    <div className={generationError || hasBlockingValidation ? 'qr-preview-placeholder' : 'qr-preview-empty'}>
                      <Icon name="qr_code" size={64} className="qr-preview-icon" />
                      <p>{generationError || validationMessage || t('qrCodeGenerator.emptyState')}</p>
                    </div>
                  )}
                </div>
              </div>

              <ResultMetrics columns={4} className="qr-preview-metrics">
                <ResultMetric
                  label={t('qrCodeGenerator.previewMetrics.type')}
                  value={activeType.label}
                />
                <ResultMetric
                  label={t('qrCodeGenerator.previewMetrics.size')}
                  value={String(qrSize)}
                  hint={`${qrSize}x${qrSize} px`}
                />
                <ResultMetric
                  label={t('qrCodeGenerator.previewMetrics.payload')}
                  value={String(payloadLength)}
                  hint={t('qrCodeGenerator.previewMetrics.payloadHint')}
                />
                <ResultMetric
                  label={t('qrCodeGenerator.previewMetrics.logo')}
                  value={logoDataUrl ? t('qrCodeGenerator.previewMetrics.logoPresent') : t('qrCodeGenerator.previewMetrics.logoEmpty')}
                  hint={logoDataUrl ? t('qrCodeGenerator.previewMetrics.logoAddedHint') : t('qrCodeGenerator.previewMetrics.logoHelp')}
                />
              </ResultMetrics>

              {generationError && (
                <ResultNotice title={t('qrCodeGenerator.previewErrorTitle')} tone="error">
                  <p>{generationError}</p>
                </ResultNotice>
              )}

              {hasBlockingValidation && !generationError && (
                <ResultNotice title={t('qrCodeGenerator.previewInvalidTitle')} tone="error">
                  <p>{validationMessage}</p>
                </ResultNotice>
              )}

              <ResultActions align="center" className="qr-preview-actions">
                <button type="button" onClick={handleDownload} className="qr-download-button" disabled={!shouldShowQR}>
                  {t('qrCodeGenerator.downloadButton')}
                </button>
                <button type="button" className="secondary" onClick={handleClearCurrentData} disabled={!hasActiveTypeContent}>
                  {t('qrCodeGenerator.clearCurrentButton')}
                </button>
                <button type="button" className="secondary" onClick={handleResetAppearance}>
                  {t('qrCodeGenerator.resetStyleButton')}
                </button>
              </ResultActions>

            </ResultSection>
          </ToolResult>
        </ToolPageLayout>

        <ToolHelp>
        <ToolDescriptionSection>
          <div className="tool-help-prose">
          <h2 className="tool-help-heading">{t('qrCodeGenerator.info.howToTitle')}</h2>
          <p>
            {t('qrCodeGenerator.info.howToDescription')}
          </p>
          <ol>
            <li>{t('qrCodeGenerator.info.howToSteps.step1')}</li>
            <li>{t('qrCodeGenerator.info.howToSteps.step2')}</li>
            <li>{t('qrCodeGenerator.info.howToSteps.step3')}</li>
          </ol>
          <p>
            {t('qrCodeGenerator.info.howToNote')}
          </p>

          <h2 className="tool-help-heading">{t('qrCodeGenerator.info.mainTitle')}</h2>
          <p>
            {t('qrCodeGenerator.info.mainDescription')}
          </p>

          <h3 className="tool-help-subheading">{t('qrCodeGenerator.info.purposesTitle')}</h3>
          <p>{t('qrCodeGenerator.info.purposesDescription')}</p>
          <ul>
            <li>{t('qrCodeGenerator.info.purposesList.text')}</li>
            <li>{t('qrCodeGenerator.info.purposesList.link')}</li>
            <li>{t('qrCodeGenerator.info.purposesList.email')}</li>
            <li>{t('qrCodeGenerator.info.purposesList.phone')}</li>
            <li>{t('qrCodeGenerator.info.purposesList.sms')}</li>
            <li>{t('qrCodeGenerator.info.purposesList.wifi')}</li>
          </ul>
          <p>
            {t('qrCodeGenerator.info.purposesNote')}
          </p>

          <h3 className="tool-help-subheading">{t('qrCodeGenerator.info.featuresTitle')}</h3>
          <ul>
            <li>{t('qrCodeGenerator.info.featuresList.free')}</li>
            <li>{t('qrCodeGenerator.info.featuresList.colors')}</li>
            <li>{t('qrCodeGenerator.info.featuresList.styles')}</li>
            <li>{t('qrCodeGenerator.info.featuresList.size')}</li>
            <li>{t('qrCodeGenerator.info.featuresList.download')}</li>
            <li>{t('qrCodeGenerator.info.featuresList.instant')}</li>
          </ul>

          <h3 className="tool-help-subheading">{t('qrCodeGenerator.info.stepsTitle')}</h3>
          <ol>
            <li>{t('qrCodeGenerator.info.stepsList.step1')}</li>
            <li>{t('qrCodeGenerator.info.stepsList.step2')}</li>
            <li>{t('qrCodeGenerator.info.stepsList.step3')}</li>
            <li>{t('qrCodeGenerator.info.stepsList.step4')}</li>
          </ol>

          <h3 className="tool-help-subheading">{t('qrCodeGenerator.info.useCasesTitle')}</h3>
          <p>
            <strong>{t('qrCodeGenerator.info.business')}</strong><br />
            {t('qrCodeGenerator.info.businessDescription')}
          </p>
          <p>
            <strong>{t('qrCodeGenerator.info.wifi')}</strong><br />
            {t('qrCodeGenerator.info.wifiDescription')}
          </p>
          <p>
            <strong>{t('qrCodeGenerator.info.events')}</strong><br />
            {t('qrCodeGenerator.info.eventsDescription')}
          </p>

          <ToolFaq title={t('qrCodeGenerator.info.faqTitle')} items={faqItems} />
          </div>
        </ToolDescriptionSection>

        </ToolHelp>

        <ToolRelated>
          <RelatedTools currentPath={`/${language}/qr-code-generator`} />
        </ToolRelated>
      </ToolPageShell>
    </>
  )
}

export default QRCodeGenerator
