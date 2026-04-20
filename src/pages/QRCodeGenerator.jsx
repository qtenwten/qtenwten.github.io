import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect, useRef } from 'react'
import { jsPDF } from 'jspdf'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import Icon from '../components/Icon'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import { useAsyncRequest } from '../hooks/useAsyncRequest'
import { ResultActions, ResultMetric, ResultMetrics, ResultNotice, ResultSection, ResultSummary } from '../components/ResultSection'
import ToolPageShell, { ToolControls, ToolHelp, ToolPageHero, ToolPageLayout, ToolRelated, ToolResult, ToolSectionHeading } from '../components/ToolPageShell'
import { CustomSelect } from '../components/CustomSelect'
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
  const [downloadFormat, setDownloadFormat] = useState('png')
  const [showFormatDropdown, setShowFormatDropdown] = useState(false)
  const [transparentExport, setTransparentExport] = useState(false)
  const qrDataRef = useRef(null)
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
        qrDataRef.current = qrData

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

  const triggerDownload = (blob, filename) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const triggerDataURLDownload = (dataUrl, filename) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    link.click()
  }

  // Creates an opaque copy of the canvas with white background
  const getOpaqueCanvas = (canvas) => {
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const ctx = tempCanvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    ctx.drawImage(canvas, 0, 0)
    return tempCanvas
  }

  // Creates a transparent copy by removing background color pixels
  const getTransparentCanvas = (canvas, bgColor) => {
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const ctx = tempCanvas.getContext('2d')
    ctx.drawImage(canvas, 0, 0)

    const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
    const data = imageData.data

    // Parse background color to RGB
    const parseColor = (color) => {
      if (!color) return { r: 255, g: 255, b: 255 }
      if (color.startsWith('#')) {
        const hex = color.slice(1)
        if (hex.length === 3) {
          return {
            r: parseInt(hex[0] + hex[0], 16),
            g: parseInt(hex[1] + hex[1], 16),
            b: parseInt(hex[2] + hex[2], 16),
          }
        }
        if (hex.length === 6) {
          return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
          }
        }
      }
      return { r: 255, g: 255, b: 255 }
    }

    const bgRGB = parseColor(bgColor)

    // Tolerance for matching background color (to handle anti-aliasing)
    const tolerance = 30

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      if (
        Math.abs(r - bgRGB.r) <= tolerance &&
        Math.abs(g - bgRGB.g) <= tolerance &&
        Math.abs(b - bgRGB.b) <= tolerance
      ) {
        data[i + 3] = 0 // Set alpha to 0 (transparent)
      }
    }

    ctx.putImageData(imageData, 0, 0)
    return tempCanvas
  }

  const downloadPNG = (canvas) => {
    if (transparentExport) {
      const exportCanvas = getTransparentCanvas(canvas, qrBgColor)
      exportCanvas.toBlob((blob) => {
        triggerDownload(blob, 'qrcode-transparent.png')
      }, 'image/png')
    } else {
      const exportCanvas = getOpaqueCanvas(canvas)
      exportCanvas.toBlob((blob) => {
        triggerDownload(blob, 'qrcode.png')
      }, 'image/png')
    }
  }

  const downloadJPG = (canvas) => {
    const exportCanvas = getOpaqueCanvas(canvas)
    const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.95)
    triggerDataURLDownload(dataUrl, 'qrcode.jpg')
  }

  const downloadWEBP = (canvas) => {
    const exportCanvas = getOpaqueCanvas(canvas)
    const dataUrl = exportCanvas.toDataURL('image/webp', 0.92)
    triggerDataURLDownload(dataUrl, 'qrcode.webp')
  }

  const downloadGIF = (canvas) => {
    const exportCanvas = getOpaqueCanvas(canvas)
    exportCanvas.toBlob((blob) => {
      triggerDownload(blob, 'qrcode.gif')
    }, 'image/gif')
  }

  const downloadSVG = () => {
    const qrData = qrDataRef.current
    if (!qrData) return

    const moduleCount = qrData.modules.size
    const marginModules = 4
    const totalModules = moduleCount + marginModules * 2
    const moduleSize = 10
    const size = totalModules * moduleSize
    const contentOffset = marginModules * moduleSize
    const moduleData = qrData.modules.data
    const darkColor = qrColor || '#111111'
    const lightColor = qrBgColor || '#ffffff'

    // Build data module rects
    let dataModules = ''
    for (let y = 0; y < moduleCount; y += 1) {
      for (let x = 0; x < moduleCount; x += 1) {
        const moduleValue = moduleData[y * moduleCount + x]
        if (!moduleValue) continue
        if (isFinderArea(x, y, moduleCount)) continue
        const px = contentOffset + x * moduleSize
        const py = contentOffset + y * moduleSize
        dataModules += `    <rect x="${px}" y="${py}" width="${moduleSize}" height="${moduleSize}" fill="${darkColor}"/>\n`
      }
    }

    // Build finder pattern rects (three corners)
    const finderSize = moduleSize * 7
    const finderMiddleSize = moduleSize * 5
    const finderInnerSize = moduleSize * 3
    const finderMiddleOffset = moduleSize
    const finderInnerOffset = moduleSize * 2

    const finderPositions = [
      [contentOffset, contentOffset],
      [contentOffset + (moduleCount - 7) * moduleSize, contentOffset],
      [contentOffset, contentOffset + (moduleCount - 7) * moduleSize],
    ]

    let finderRects = ''
    finderPositions.forEach(([fx, fy]) => {
      // Outer dark square
      finderRects += `    <rect x="${fx}" y="${fy}" width="${finderSize}" height="${finderSize}" fill="${darkColor}"/>\n`
      // Middle white square
      finderRects += `    <rect x="${fx + finderMiddleOffset}" y="${fy + finderMiddleOffset}" width="${finderMiddleSize}" height="${finderMiddleSize}" fill="${lightColor}"/>\n`
      // Inner dark square
      finderRects += `    <rect x="${fx + finderInnerOffset}" y="${fy + finderInnerOffset}" width="${finderInnerSize}" height="${finderInnerSize}" fill="${darkColor}"/>\n`
    })

    const bgRect = transparentExport
      ? `  <rect x="0" y="0" width="${size}" height="${size}" fill="none"/>\n`
      : `  <rect x="0" y="0" width="${size}" height="${size}" fill="${lightColor}"/>\n`

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
${bgRect}  <g>
    ${dataModules}
    ${finderRects}
  </g>
</svg>`

    const blob = new Blob([svg], { type: 'image/svg+xml' })
    triggerDownload(blob, 'qrcode.svg')
  }

  const downloadPDF = (canvas) => {
    const size = canvas.width / (window.devicePixelRatio || 1)
    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [size, size],
    })

    pdf.addImage(imgData, 'PNG', 0, 0, size, size)
    pdf.save('qrcode.pdf')
  }

  const handleDownload = () => {
    const canvas = canvasRef.current

    if (!shouldShowQR || !canvas) {
      return
    }

    setShowFormatDropdown(false)

    switch (downloadFormat) {
      case 'svg':
        downloadSVG()
        break
      case 'pdf':
        downloadPDF(canvas)
        break
      case 'jpg':
        downloadJPG(canvas)
        break
      case 'webp':
        downloadWEBP(canvas)
        break
      case 'gif':
        downloadGIF(canvas)
        break
      case 'png':
      default:
        downloadPNG(canvas)
        break
    }
  }

  const handleFormatSelect = (format) => {
    setDownloadFormat(format)
    setShowFormatDropdown(false)
  }

  const toggleFormatDropdown = () => {
    setShowFormatDropdown((prev) => !prev)
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
                      <CustomSelect
                        id="qrWifiSecurity"
                        value={qrForm.wifiSecurity}
                        onChange={(event) => updateQrForm('wifiSecurity', event.target.value)}
                        options={[
                          { value: 'WPA', label: t('qrCodeGenerator.wifiSecurity.WPA') },
                          { value: 'WEP', label: t('qrCodeGenerator.wifiSecurity.WEP') },
                          { value: 'nopass', label: t('qrCodeGenerator.wifiSecurity.nopass') },
                        ]}
                      />
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
                <CustomSelect
                  id="themePreset"
                  value={themePreset}
                  onChange={(event) => {
                    if (event.target.value === 'custom') {
                      return
                    }
                    applyThemePreset(event.target.value)
                  }}
                  options={[
                    { value: 'classic', label: t('qrCodeGenerator.themes.classic') },
                    { value: 'soft', label: t('qrCodeGenerator.themes.soft') },
                    { value: 'custom', label: t('qrCodeGenerator.themes.custom') },
                  ]}
                />
              </div>

              <div className="qr-style-grid">
                <div className="field">
                  <label htmlFor="moduleStyle">{t('qrCodeGenerator.moduleStyleLabel')}</label>
                  <CustomSelect
                    id="moduleStyle"
                    value={moduleStyle}
                    onChange={(event) => {
                      setThemePreset('custom')
                      setModuleStyle(event.target.value)
                    }}
                    options={[
                      { value: 'square', label: t('qrCodeGenerator.moduleStyles.square') },
                      { value: 'rounded', label: t('qrCodeGenerator.moduleStyles.rounded') },
                      { value: 'dots', label: t('qrCodeGenerator.moduleStyles.dots') },
                    ]}
                  />
                </div>

                <div className="field">
                  <label htmlFor="markerStyle">{t('qrCodeGenerator.markerStyleLabel')}</label>
                  <CustomSelect
                    id="markerStyle"
                    value={markerStyle}
                    onChange={(event) => {
                      setThemePreset('custom')
                      setMarkerStyle(event.target.value)
                    }}
                    options={[
                      { value: 'square', label: t('qrCodeGenerator.markerStyles.square') },
                      { value: 'rounded', label: t('qrCodeGenerator.markerStyles.rounded') },
                    ]}
                  />
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
                <div className="qr-file-input-wrapper">
                  <input
                    id="logoUpload"
                    type="file"
                    accept="image/png,.png,image/jpeg,.jpg,.jpeg,image/webp,.webp,image/svg+xml,.svg"
                    onChange={handleLogoUpload}
                  />
                  <label htmlFor="logoUpload" className="qr-file-input-label">
                    {logoFileName || t('qrCodeGenerator.chooseFile')}
                  </label>
                </div>
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
                <div className="qr-download-group">
                  <button type="button" onClick={handleDownload} className="qr-download-button" disabled={!shouldShowQR}>
                    <span>{t(`qrCodeGenerator.formats.${downloadFormat}`)}</span>
                  </button>
                  <button
                    type="button"
                    className={`qr-format-dropdown-toggle ${showFormatDropdown ? 'is-open' : ''}`}
                    onClick={toggleFormatDropdown}
                    disabled={!shouldShowQR}
                    aria-label="Select format"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {showFormatDropdown && (
                    <div className="qr-format-dropdown">
                      {['png', 'svg', 'pdf', 'jpg', 'webp', 'gif'].map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          className={`qr-format-option ${downloadFormat === fmt ? 'is-active' : ''}`}
                          onClick={() => handleFormatSelect(fmt)}
                        >
                          {t(`qrCodeGenerator.formats.${fmt}`)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="qr-export-row">
                  {(downloadFormat === 'png' || downloadFormat === 'svg') && (
                    <label className="qr-transparent-toggle">
                      <input
                        type="checkbox"
                        checked={transparentExport}
                        onChange={(e) => setTransparentExport(e.target.checked)}
                        disabled={!shouldShowQR}
                      />
                      <span>{t('qrCodeGenerator.transparentBg')}</span>
                    </label>
                  )}
                </div>
                <div className="qr-secondary-actions">
                  <button type="button" className="secondary" onClick={handleClearCurrentData} disabled={!hasActiveTypeContent}>
                    {t('qrCodeGenerator.clearCurrentButton')}
                  </button>
                  <button type="button" className="secondary" onClick={handleResetAppearance}>
                    {t('qrCodeGenerator.resetStyleButton')}
                  </button>
                </div>
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
