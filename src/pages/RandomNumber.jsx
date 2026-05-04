import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect, useRef, useCallback } from 'react'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import Icon from '../components/Icon'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import {
  ToolHelp,
} from '../components/ToolPageShell'
import {
  generateRandomNumbers,
  calculateSpinResult,
  normalizeItems,
  getIndexAtPointer,
  getWheelSelectionState,
} from '../utils/randomGenerator'
import { createWheelAudioController } from '../utils/wheelAudio'
import { filterNumberInput, handleNumberKeyDown } from '../utils/numberInput'
import { safeGetItem, safeSetItem, safeRemoveItem, safeParseJSON } from '../utils/storage'
import './RandomNumber.css'

const SEGMENT_COLORS = [
  ['#6366f1', '#8b5cf6'],
  ['#8b5cf6', '#a855f7'],
  ['#a855f7', '#d946ef'],
  ['#d946ef', '#ec4899'],
  ['#ec4899', '#f43f5e'],
  ['#f43f5e', '#ef4444'],
  ['#ef4444', '#f97316'],
  ['#f97316', '#f59e0b'],
  ['#f59e0b', '#eab308'],
  ['#eab308', '#84cc16'],
  ['#84cc16', '#22c55e'],
  ['#22c55e', '#10b981'],
  ['#10b981', '#14b8a6'],
  ['#14b8a6', '#06b6d4'],
  ['#06b6d4', '#0ea5e9'],
  ['#0ea5e9', '#3b82f6'],
]

const DURATION_OPTIONS = [3, 5, 8, 10]

function smoothEase(t) {
  if (t < 0.1) {
    const p = t / 0.1
    return 0.5 * p * p
  } else if (t < 0.4) {
    const p = (t - 0.1) / 0.3
    return 0.5 + 0.5 * p
  } else if (t < 0.7) {
    const p = (t - 0.4) / 0.3
    return 1 - 0.25 * Math.pow(1 - p, 2)
  } else {
    const p = (t - 0.7) / 0.3
    return 0.75 + 0.25 * (1 - Math.pow(1 - p, 3))
  }
}

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4)
}

class ConfettiSystem {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.particles = []
    this.colors = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6']
    this.isRunning = false
    this.resize()
  }

  resize() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  emit(x, y, count = 70) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 20,
        vy: Math.random() * -18 - 6,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        size: Math.random() * 10 + 5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        life: 1,
        decay: 0.012 + Math.random() * 0.008,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      })
    }
    if (!this.isRunning) {
      this.isRunning = true
      this.animate()
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.5
      p.vx *= 0.99
      p.rotation += p.rotationSpeed
      p.life -= p.decay

      if (p.life <= 0 || p.y > this.canvas.height + 50) {
        this.particles.splice(i, 1)
        continue
      }

      this.ctx.save()
      this.ctx.translate(p.x, p.y)
      this.ctx.rotate((p.rotation * Math.PI) / 180)
      this.ctx.globalAlpha = p.life
      this.ctx.fillStyle = p.color

      if (p.shape === 'rect') {
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      } else {
        this.ctx.beginPath()
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        this.ctx.fill()
      }

      this.ctx.restore()
    }

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.animate())
    } else {
      this.isRunning = false
    }
}
  }

  function WheelWithSpin({ items, result, onSpinEnd, soundEnabled, duration, placeholder, getAudioController, t }) {
    const [isSpinning, setIsSpinning] = useState(false)
    const [spinResult, setSpinResult] = useState(null)

    const handleSpin = () => {
      if (!items || items.length === 0 || isSpinning) return
      if (soundEnabled) {
        void getAudioController().warmUp()
      }
      setIsSpinning(true)
      setSpinResult(null)
    }

    const handleSpinEnd = (spinResult) => {
      setIsSpinning(false)
      setSpinResult(spinResult)
      onSpinEnd(spinResult)
    }

    return (
      <div className="wheel-with-spin">
        <Wheel
          items={items}
          isSpinning={isSpinning}
          onSpinEnd={handleSpinEnd}
          soundEnabled={soundEnabled}
          duration={duration}
          placeholder={placeholder}
          getAudioController={getAudioController}
        />
        <button onClick={handleSpin} className="primary spin-btn" disabled={!items || items.length === 0 || isSpinning}>
          <Icon name="refresh" size={18} />
          {t('randomNumber.picker.spin')}
        </button>
        {spinResult && !isSpinning && (
          <div className="numbers-preview-result">
            <div className="numbers-preview-label">{t('randomNumber.numbers.result')}</div>
            <div className="numbers-preview-value">{spinResult.winnerItem}</div>
            <div className="numbers-preview-chance">{t('randomNumber.picker.chance')}: {spinResult.chance}%</div>
          </div>
        )}
      </div>
    )
  }

  function Wheel({ items, isSpinning, onSpinEnd, soundEnabled, duration, placeholder, getAudioController }) {
  const canvasRef = useRef(null)
  const wheelRef = useRef(null)
  const pointerRef = useRef(null)
  const sparkContainerRef = useRef(null)
  const wheelCenterRef = useRef(null)
  const wheelRaysRef = useRef(null)
  const [currentRotation, setCurrentRotation] = useState(0)
  const animationRef = useRef(null)
  const lastPointerIndexRef = useRef(-1)
  const lastPointerIndexForHumRef = useRef(-1)
  const pointerKickAnimationRef = useRef(null)
  const sparkTimeoutsRef = useRef(new Set())

  function getWheelRaysGradient(items) {
    if (!items || items.length === 0) return { background: 'none' }

    const segmentAngle = 360 / items.length
    const rays = []
    const opacity = 0.4

    for (let i = 0; i < items.length; i++) {
      const colorPair = SEGMENT_COLORS[i % SEGMENT_COLORS.length]
      const startAngle = i * segmentAngle
      const midAngle = startAngle + segmentAngle * 0.35
      const endAngle = startAngle + segmentAngle * 0.5

      rays.push(`${hexToRgba(colorPair[1], opacity)} ${startAngle}deg ${midAngle}deg`)
      rays.push(`${hexToRgba(colorPair[1], 0)} ${midAngle}deg ${endAngle}deg`)
    }

    return { background: `conic-gradient(from 0deg, ${rays.join(', ')})` }
  }

  function hexToRgba(hex, alpha) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    }
    return `rgba(255, 255, 255, ${alpha})`
  }

  const raysStyle = getWheelRaysGradient(items)

  const drawWheel = useCallback((ctx, items, size) => {
    if (!items || items.length === 0) return

    const center = size / 2
    const radius = size / 2 - 8
    const segmentAngle = (2 * Math.PI) / items.length

    ctx.clearRect(0, 0, size, size)
    ctx.save()

    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
    ctx.shadowBlur = 30
    ctx.shadowOffsetY = 10
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, 2 * Math.PI)

    const baseGradient = ctx.createRadialGradient(center, center, 0, center, center, radius)
    baseGradient.addColorStop(0, '#2d3a4d')
    baseGradient.addColorStop(0.7, '#1e293b')
    baseGradient.addColorStop(1, '#151f2d')
    ctx.fillStyle = baseGradient
    ctx.fill()
    ctx.restore()

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.stroke()

    items.forEach((item, i) => {
      const startAngle = i * segmentAngle - Math.PI / 2
      const endAngle = startAngle + segmentAngle

      const colorPair = SEGMENT_COLORS[i % SEGMENT_COLORS.length]

      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.arc(center, center, radius - 4, startAngle, endAngle)
      ctx.closePath()

      const segmentGradient = ctx.createLinearGradient(
        center + Math.cos(startAngle + segmentAngle / 2) * radius * 0.15,
        center + Math.sin(startAngle + segmentAngle / 2) * radius * 0.15,
        center + Math.cos(startAngle + segmentAngle / 2) * radius,
        center + Math.sin(startAngle + segmentAngle / 2) * radius
      )
      segmentGradient.addColorStop(0, colorPair[0])
      segmentGradient.addColorStop(1, colorPair[1])
      ctx.fillStyle = segmentGradient
      ctx.fill()

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.save()
      ctx.translate(center, center)
      ctx.rotate(startAngle + segmentAngle / 2)
      ctx.globalAlpha = 0.08
      ctx.beginPath()
      ctx.moveTo(0, -radius * 0.1)
      ctx.lineTo(0, radius * 0.1)
      const highlightGrad = ctx.createLinearGradient(radius * 0.2, 0, radius * 0.8, 0)
      highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0)')
      highlightGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)')
      highlightGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)')
      highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.strokeStyle = highlightGrad
      ctx.lineWidth = radius * 0.3
      ctx.lineCap = 'round'
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.restore()

      ctx.save()
      ctx.translate(center, center)
      ctx.rotate(startAngle + segmentAngle / 2)

      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetY = 2
      ctx.font = `bold ${Math.max(11, Math.min(16, 280 / items.length))}px system-ui, sans-serif`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'

      const maxChars = items.length > 8 ? 10 : items.length > 4 ? 14 : 18
      let displayText = item
      if (displayText.length > maxChars) {
        displayText = displayText.substring(0, maxChars - 2) + '…'
      }

      const lines = displayText.split(' ')
      if (lines.length > 1 && items.length <= 6) {
        const lineHeight = 14
        const textWidth = radius - 30
        lines.forEach((line, idx) => {
          const yOffset = (idx - (lines.length - 1) / 2) * lineHeight
          ctx.fillText(line, textWidth, yOffset)
        })
      } else {
        ctx.fillText(displayText, radius - 20, 0)
      }

      ctx.restore()
    })

    ctx.save()
    ctx.beginPath()
    ctx.arc(center, center, radius - 4, 0, 2 * Math.PI)
    const outerRingGrad = ctx.createRadialGradient(center, center, radius - 6, center, center, radius)
    outerRingGrad.addColorStop(0, 'rgba(255, 255, 255, 0)')
    outerRingGrad.addColorStop(1, 'rgba(255, 255, 255, 0.1)')
    ctx.strokeStyle = outerRingGrad
    ctx.lineWidth = 6
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.globalAlpha = 0.2
    ctx.beginPath()
    ctx.arc(center, center, radius - 4, 0, 2 * Math.PI)
    const glassOverlay = ctx.createLinearGradient(center - radius, center - radius, center + radius, center + radius)
    glassOverlay.addColorStop(0, 'rgba(255, 255, 255, 0.12)')
    glassOverlay.addColorStop(0.4, 'rgba(255, 255, 255, 0.04)')
    glassOverlay.addColorStop(0.6, 'rgba(255, 255, 255, 0.04)')
    glassOverlay.addColorStop(1, 'rgba(255, 255, 255, 0.08)')
    ctx.fillStyle = glassOverlay
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.restore()

    ctx.beginPath()
    ctx.arc(center, center, 35, 0, 2 * Math.PI)
    const centerGrad = ctx.createRadialGradient(center, center - 10, 5, center, center, 35)
    centerGrad.addColorStop(0, '#3d4f66')
    centerGrad.addColorStop(1, '#1e293b')
    ctx.fillStyle = centerGrad
    ctx.fill()
    ctx.strokeStyle = 'rgba(var(--primary-rgb), 0.8)'
    ctx.lineWidth = 5
    ctx.stroke()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !items.length) return

    const ctx = canvas.getContext('2d')
    const size = canvas.width
    drawWheel(ctx, items, size)
  }, [items, drawWheel])

  useEffect(() => {
    if (!isSpinning || items.length === 0) return

    const result = calculateSpinResult(items, duration, currentRotation)
    const { targetAngle } = result

    const startTime = performance.now()
    const startAngle = currentRotation
    const totalRotation = targetAngle - startAngle
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    lastPointerIndexRef.current = getIndexAtPointer(startAngle, items.length)

const playTick = () => {
      if (!soundEnabled) return

      void getAudioController().playTone({
        frequency: 600 + Math.random() * 200,
        gainValue: 0.08,
        duration: 0.04,
        fadeDuration: 0.08,
      })

      const baseFreq = 1800 + Math.random() * 500
      void getAudioController().playTone({
        frequency: baseFreq,
        type: 'sine',
        gainValue: 0.015,
        duration: 0.015,
        fadeDuration: 0.03,
      })
    }

    const playHum = (progress) => {
      if (!soundEnabled) return

      const humFreq = 80 + (1 - progress) * 40
      const humGain = 0.02 * (1 - progress)

      void getAudioController().playTone({
        frequency: humFreq,
        type: 'sine',
        gainValue: humGain,
        duration: 0.1,
        fadeDuration: 0.15,
      })
    }

const kickPointer = () => {
      const pointer = pointerRef.current
      if (!pointer || reduceMotion) return

      if (pointer.animate) {
        if (pointerKickAnimationRef.current) {
          pointerKickAnimationRef.current.cancel()
        }

        const animation = pointer.animate(
          [
            { transform: 'translateX(-50%) rotate(0deg)' },
            { transform: 'translateX(-50%) rotate(-14deg)', offset: 0.34 },
            { transform: 'translateX(-50%) rotate(6deg)', offset: 0.72 },
            { transform: 'translateX(-50%) rotate(0deg)' },
          ],
          {
            duration: 200,
            easing: 'cubic-bezier(0.2, 0.9, 0.24, 1)',
          }
        )

        pointerKickAnimationRef.current = animation

        animation.onfinish = () => {
          if (pointerKickAnimationRef.current === animation) {
            pointerKickAnimationRef.current = null
          }
        }
        animation.oncancel = () => {
          if (pointerKickAnimationRef.current === animation) {
            pointerKickAnimationRef.current = null
          }
        }
        return
      }

      pointer.classList.remove('is-ticking')
      void pointer.offsetWidth
      pointer.classList.add('is-ticking')
    }

const emitPointerSparks = () => {
      const sparkContainer = sparkContainerRef.current
      if (!sparkContainer || reduceMotion) return

      const sparkCount = 8 + Math.floor(Math.random() * 4)

      for (let i = 0; i < sparkCount; i++) {
        const spark = document.createElement('span')
        const angle = -160 + Math.random() * 140
        const distance = 16 + Math.random() * 16
        const x = Math.cos((angle * Math.PI) / 180) * distance
        const y = Math.sin((angle * Math.PI) / 180) * distance

        spark.className = 'wheel-spark'
        spark.style.setProperty('--spark-x', `${x.toFixed(1)}px`)
        spark.style.setProperty('--spark-y', `${y.toFixed(1)}px`)
        spark.style.setProperty('--spark-rotate', `${Math.round(angle)}deg`)
        spark.style.setProperty('--spark-delay', `${i * 8}ms`)

        sparkContainer.appendChild(spark)

        const timeoutId = window.setTimeout(() => {
          spark.remove()
          sparkTimeoutsRef.current.delete(timeoutId)
        }, 400)

        sparkTimeoutsRef.current.add(timeoutId)
      }
    }

const handleDividerHit = () => {
      playTick()
      kickPointer()
      emitPointerSparks()
    }

    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4)

    const updateCenterPulse = (progress) => {
      const wheelCenter = wheelCenterRef.current
      const wheelRays = wheelRaysRef.current
      if (!wheelCenter) return

      const pulsePhase = progress * Math.PI * 4
      const pulseValue = Math.sin(pulsePhase)
      const scale = 1 + 0.25 * (1 - progress) * Math.abs(pulseValue)
      const glowIntensity = (1 - progress) * 0.7 * Math.abs(pulseValue)
      wheelCenter.style.transform = `translate(-50%, -50%) scale(${scale})`
      wheelCenter.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.2)${glowIntensity > 0.05 ? `, 0 0 ${30 * glowIntensity}px rgba(var(--primary-rgb), ${glowIntensity * 1.5}), 0 0 ${60 * glowIntensity}px rgba(var(--primary-rgb), ${glowIntensity * 0.8})` : ''}`

      if (wheelRays) {
        const baseOpacity = 0.25 + 0.35 * (1 - progress)
        const pulseBoost = 0.2 * Math.abs(pulseValue) * (1 - progress)
        const raysOpacity = Math.min(baseOpacity + pulseBoost, 0.7)
        wheelRays.style.opacity = raysOpacity
      }
    }

    const animate = (time) => {
      const elapsed = time - startTime
      const rawProgress = elapsed / (duration * 1000)
      const progress = Math.min(rawProgress, 1)

      const easeProgress = easeOutQuart(progress)
      const newAngle = startAngle + totalRotation * easeProgress

      const pointerIndex = getIndexAtPointer(newAngle, items.length)

      if (pointerIndex !== lastPointerIndexRef.current) {
        handleDividerHit()
        lastPointerIndexRef.current = pointerIndex
      }

      if (pointerIndex !== lastPointerIndexForHumRef.current) {
        lastPointerIndexForHumRef.current = pointerIndex
        playHum(easeProgress)
      }

      updateCenterPulse(easeProgress)
      setCurrentRotation(newAngle)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setCurrentRotation(targetAngle)
        if (soundEnabled) {
          void getAudioController().playTone({
            frequency: 880,
            gainValue: 0.15,
            duration: 0.5,
            fadeDuration: 0.5,
          })
        }
        onSpinEnd(result)
        if (wheelCenterRef.current) {
          wheelCenterRef.current.style.transform = 'translate(-50%, -50%) scale(1)'
          wheelCenterRef.current.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'
        }
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [isSpinning, items, duration, getAudioController])

  useEffect(() => {
    return () => {
      if (pointerKickAnimationRef.current) {
        pointerKickAnimationRef.current.cancel()
      }

      sparkTimeoutsRef.current.forEach(timeoutId => window.clearTimeout(timeoutId))
      sparkTimeoutsRef.current.clear()
    }
  }, [])

  const canvasSize = 320

  return (
    <div className="wheel-container">
      <div className="wheel-wrapper" ref={wheelRef}>
{items.length === 0 ? (
          <div className="wheel-placeholder">
            <Icon name="pointer" size={48} />
            <p>{placeholder}</p>
          </div>
        ) : (
          <>
            <div ref={pointerRef} className="wheel-pointer" />
            <div ref={sparkContainerRef} className="wheel-spark-burst" aria-hidden="true" />
            <div className="wheel-canvas-wrapper">
              <div ref={wheelRaysRef} className="wheel-rays" style={{ ...raysStyle, willChange: 'transform', transform: `translate(-50%, -50%) rotate(${currentRotation}rad)` }} />
              <canvas
                ref={canvasRef}
                className="wheel-canvas"
                width={canvasSize}
                height={canvasSize}
                style={{
                  willChange: 'transform',
                  transform: `rotate(${currentRotation}rad)`,
                }}
              />
            </div>
            <div ref={wheelCenterRef} className="wheel-center">
              <Icon name="casino" size={24} />
            </div>
            <div className="wheel-glow" />
          </>
        )}
      </div>
    </div>
  )
}

function RandomNumber() {
  const { t, language } = useLanguage()
  const [mode, setMode] = useState('numbers')

  const [min, setMin] = useState('1')
  const [max, setMax] = useState('50')
  const [count, setCount] = useState('1')
  const [unique, setUnique] = useState(false)
  const [wheelEnabled, setWheelEnabled] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const [items, setItems] = useState(['', ''])
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinResult, setSpinResult] = useState(null)
  const [spinDuration, setSpinDuration] = useState(8)
  const [customDuration, setCustomDuration] = useState(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [history, setHistory] = useState([])
  const [excludeChosen, setExcludeChosen] = useState(true)
  const [wheelItemsSnapshot, setWheelItemsSnapshot] = useState(null)

  const confettiCanvasRef = useRef(null)
  const confettiRef = useRef(null)
  const wheelWrapperRef = useRef(null)
  const audioControllerRef = useRef(null)

  const getAudioController = useCallback(() => {
    if (!audioControllerRef.current) {
      audioControllerRef.current = createWheelAudioController()
    }

    return audioControllerRef.current
  }, [])

  useEffect(() => {
    const saved = safeGetItem('randomNumber')
    if (saved) {
      const data = safeParseJSON(saved, {})
      setMin(data.min || '1')
      const savedMax = data.max ? parseInt(data.max) : null
      setMax(savedMax && savedMax > 0 ? String(savedMax) : '50')
      setCount(data.count || '1')
      setUnique(data.unique || false)
    }

    if (confettiCanvasRef.current && !confettiRef.current) {
      confettiRef.current = new ConfettiSystem(confettiCanvasRef.current)
    }

    const handleResize = () => {
      if (confettiRef.current) {
        confettiRef.current.resize()
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    return () => {
      if (audioControllerRef.current) {
        void audioControllerRef.current.close()
      }
    }
  }, [])

  const handleGenerate = () => {
    const res = generateRandomNumbers(min, max, count, unique)
    if (res.error) {
      setError(t('randomNumber.errors.' + res.error))
      setResult(null)
    } else {
      setError('')
      setResult(res.numbers)
      safeSetItem('randomNumber', JSON.stringify({ min, max, count, unique }))
    }
  }

  const handleClear = () => {
    setMin('1')
    setMax('50')
    setCount('1')
    setUnique(false)
    setResult(null)
    setError('')
    safeRemoveItem('randomNumber')
  }

  const handleAddItem = () => {
    setItems(prev => [...prev, ''])
    if (!isSpinning) clearWheelResult()
  }

  const handleRemoveItem = (index) => {
    if (items.length <= 2) return
    setItems(prev => prev.filter((_, i) => i !== index))
    if (!isSpinning) clearWheelResult()
  }

  const handleItemChange = (index, value) => {
    setItems(prev => {
      const newItems = [...prev]
      newItems[index] = value
      return newItems
    })
    if (!isSpinning) clearWheelResult()
  }

  const normalizedItems = normalizeItems(items)

  const clearWheelResult = () => {
    setSpinResult(null)
    setWheelItemsSnapshot(null)
  }

  const handleModeChange = (nextMode) => {
    if (isSpinning) return
    setMode(nextMode)
    clearWheelResult()
  }

  const handleSpin = () => {
    if (!canSpin || isSpinning) return
    if (soundEnabled) {
      void getAudioController().warmUp()
    }

    setWheelItemsSnapshot(spinItems)
    setSpinResult(null)
    setIsSpinning(true)
  }

  const handleSoundToggle = () => {
    if (isSpinning) return

    setSoundEnabled(prev => {
      const nextValue = !prev

      if (nextValue) {
        void getAudioController().warmUp()
      }

      return nextValue
    })
  }

  const handleSpinEnd = (result) => {
    setIsSpinning(false)
    setSpinResult(result)

    if (mode === 'sequence' && excludeChosen) {
      setHistory(prev => [...prev, { item: result.winnerItem, index: result.winnerIndex }])
    }

    const finalVisualIndex = getIndexAtPointer(result.targetAngle, wheelItems.length)
    const visualItem = wheelItems[finalVisualIndex]
    const isMatch = finalVisualIndex === result.winnerIndex
    if (!isMatch) {
      console.error('[wheel mismatch after calculation]', {
        winnerIndex: result.winnerIndex,
        finalVisualIndex,
        winnerItem: result.winnerItem,
        visualItem,
        targetAngle: result.targetAngle,
        wheelLength: wheelItems.length,
      })
    } else {
      console.log('[wheel ok]', { winnerIndex: result.winnerIndex, visualIndex: finalVisualIndex, item: result.winnerItem })
    }

    setTimeout(() => {
      if (confettiRef.current && wheelWrapperRef.current) {
        const rect = wheelWrapperRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        confettiRef.current.emit(centerX, centerY, 70)
      }
    }, 100)
  }

  const handleReSpin = () => {
    if (!canSpin) return
    setSpinResult(null)
    setWheelItemsSnapshot(null)
    handleSpin()
  }

  const handleResetHistory = () => {
    setHistory([])
    setSpinResult(null)
    setWheelItemsSnapshot(null)
  }

  const {
    remainingItems,
    spinItems,
    wheelItems,
    hasEnoughItems,
    canSpin: canSpinBeforeAnimation,
    allSequenceItemsChosen,
  } = getWheelSelectionState({
    mode,
    normalizedItems,
    history,
    excludeChosen,
    wheelItemsSnapshot,
    isSpinning,
    hasSpinResult: Boolean(spinResult),
  })

  const finalDuration = customDuration ?? spinDuration
  const canSpin = canSpinBeforeAnimation && !isSpinning
  const spinButtonTitle = isSpinning
    ? t('randomNumber.picker.spinning')
    : !hasEnoughItems
      ? t('randomNumber.picker.wheelPlaceholder')
      : allSequenceItemsChosen
        ? t('randomNumber.sequence.allChosen')
        : !canSpin
          ? t('randomNumber.picker.wheelPlaceholder')
          : ''

  const remainingTemplate = t('randomNumber.sequence.remaining')
  const hasFormattedRemaining = remainingTemplate.includes('<strong>{{remaining}}</strong>')
  const [remainingPrefix, remainingRest = ''] = remainingTemplate.split('<strong>{{remaining}}</strong>')
  const remainingSuffix = remainingRest.replace('{{total}}', normalizedItems.length)
  const remainingPlainText = remainingTemplate
    .replace('<strong>{{remaining}}</strong>', String(remainingItems.length))
    .replace('{{remaining}}', String(remainingItems.length))
    .replace('{{total}}', String(normalizedItems.length))

  const handleCustomDurationChange = (e) => {
    if (!e.target.value) {
      setCustomDuration(null)
      return
    }

    const value = parseInt(e.target.value, 10)
    if (Number.isNaN(value)) return

    setCustomDuration(Math.min(60, Math.max(1, value)))
  }

  return (
    <>
      <SEO
        title={t('seo.randomNumber.title')}
        description={t('seo.randomNumber.description')}
        path={`/${language}/random-number`}
        keywords={t('seo.randomNumber.keywords')}
      />

      <div className="confetti-container">
        <canvas ref={confettiCanvasRef} className="confetti-canvas" />
      </div>

      <div className="tool-container random-number-page">
        <section className="random-number-hero" aria-labelledby="random-number-heading">
          <h1 id="random-number-heading" className="random-number-hero__title">
            <span className="random-number-hero__title-wrap">
              <Icon name="casino" size={22} className="random-number-hero__icon" />
              <span className="random-number-hero__title-text">{t('randomNumber.title')}</span>
            </span>
          </h1>
          <p className="random-number-hero__subtitle">{t('randomNumber.subtitle')}</p>
        </section>

        <nav className="mode-tabs" role="tablist">
          <button
            className={`mode-tab ${mode === 'numbers' ? 'is-active' : ''}`}
            onClick={() => handleModeChange('numbers')}
            role="tab"
            aria-selected={mode === 'numbers'}
            disabled={isSpinning}
          >
            <Icon name="casino" size={18} />
            {t('randomNumber.modes.numbers')}
          </button>
          <button
            className={`mode-tab ${mode === 'picker' ? 'is-active' : ''}`}
            onClick={() => handleModeChange('picker')}
            role="tab"
            aria-selected={mode === 'picker'}
            disabled={isSpinning}
          >
            <Icon name="pointer" size={18} />
            {t('randomNumber.modes.picker')}
          </button>
          <button
            className={`mode-tab ${mode === 'sequence' ? 'is-active' : ''}`}
            onClick={() => handleModeChange('sequence')}
            role="tab"
            aria-selected={mode === 'sequence'}
            disabled={isSpinning}
          >
            <Icon name="list_ordered" size={18} />
            {t('randomNumber.modes.sequence')}
          </button>
        </nav>

        {mode === 'numbers' && (
          <div className="numbers-layout">
            <div className="numbers-controls">
              <div className="numbers-row">
                <div className="field">
                  <label htmlFor="min">{t('randomNumber.min')}</label>
                  <input
                    id="min"
                    type="text"
                    value={min}
                    onChange={(e) => setMin(filterNumberInput(e.target.value))}
                    onKeyDown={handleNumberKeyDown}
                    placeholder="1"
                  />
                </div>
                <div className="field">
                  <label htmlFor="max">{t('randomNumber.max')}</label>
                  <input
                    id="max"
                    type="text"
                    value={max}
                    onChange={(e) => setMax(filterNumberInput(e.target.value))}
                    onKeyDown={handleNumberKeyDown}
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="count">{t('randomNumber.count')}</label>
                <input
                  id="count"
                  type="text"
                  value={count}
                  onChange={(e) => setCount(filterNumberInput(e.target.value))}
                  onKeyDown={handleNumberKeyDown}
                  placeholder="1"
                />
              </div>

              <div className="field unique-row">
                <label className="field-checkbox">
                  <input
                    id="unique"
                    type="checkbox"
                    checked={unique}
                    onChange={(e) => setUnique(e.target.checked)}
                  />
                  {t('randomNumber.unique')}
                </label>
                <label className="field-checkbox">
                  <input
                    id="wheelEnabled"
                    type="checkbox"
                    checked={wheelEnabled}
                    onChange={(e) => setWheelEnabled(e.target.checked)}
                  />
                  {t('randomNumber.wheel')}
                </label>
              </div>

              {wheelEnabled && (
                <>
                  <div className="duration-row">
                    <span className="duration-label">{t('randomNumber.picker.duration')}:</span>
                    <div className="duration-btns">
                      {DURATION_OPTIONS.map(d => (
                        <button
                          key={d}
                          className={`duration-btn ${spinDuration === d && !customDuration ? 'is-active' : ''}`}
                          onClick={() => {
                            setSpinDuration(d)
                            setCustomDuration(null)
                          }}
                        >
                          {d}s
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    className="duration-custom-input"
                    value={customDuration ?? ''}
                    onChange={(e) => {
                      handleCustomDurationChange(e)
                    }}
                    placeholder={t('randomNumber.picker.durationPlaceholder')}
                    min={1}
                    max={60}
                  />
                </>
              )}

              {error && <div className="error">{error}</div>}

              {!wheelEnabled && (
                <div className="btn-group">
                  <button onClick={handleGenerate} className="primary">
                    {t('randomNumber.generate')}
                  </button>
                </div>
              )}
            </div>

            <div className="numbers-preview">
              {wheelEnabled ? (
                <div className="numbers-preview-wheel">
                  <WheelWithSpin
                    items={(() => {
                      const minNum = parseInt(min) || 1
                      const maxNum = parseInt(max) || 100
                      const count = maxNum - minNum + 1
                      if (count > 0 && count <= 1000) {
                        return Array.from({length: count}, (_, i) => String(minNum + i))
                      }
                      return Array.from({length: 100}, (_, i) => String(i + 1))
                    })()}
                    result={result}
                    onSpinEnd={(spinResult) => {
                      if (spinResult && spinResult.winnerItem) {
                        const winningNum = parseInt(spinResult.winnerItem)
                        if (!isNaN(winningNum) && winningNum >= parseInt(min) && winningNum <= parseInt(max)) {
                          setResult([winningNum])
                        }
                      }
                    }}
                    soundEnabled={soundEnabled}
                    duration={finalDuration}
                    placeholder={t('randomNumber.numbers.previewPlaceholder')}
                    getAudioController={getAudioController}
                    t={t}
                  />
                </div>
              ) : (
                <div className="numbers-simple-result">
                  <div className="numbers-simple-label">{t('randomNumber.numbers.result')}</div>
                  <div className="numbers-simple-value">{result ? result[0] : '—'}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {(mode === 'picker' || mode === 'sequence') && (
          <div className="picker-layout">
            <div className="picker-input-panel">
              <div className="picker-input-header">
                <h3>{mode === 'picker' ? t('randomNumber.picker.title') : t('randomNumber.sequence.title')}</h3>
              </div>

              <div className="items-list">
                {items.map((item, index) => (
                  <div key={index} className="item-input-row">
                    <span className="item-number">{index + 1}</span>
                    <input
                      type="text"
                      className="item-input"
                      value={item}
                      onChange={(e) => handleItemChange(index, e.target.value)}
                      placeholder={t('randomNumber.picker.itemPlaceholder')}
                      disabled={isSpinning}
                    />
                    {items.length > 2 && (
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveItem(index)}
                        disabled={isSpinning}
                        aria-label="Remove"
                      >
                        <span className="remove-btn__icon">−</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                className="add-item-btn"
                onClick={handleAddItem}
                disabled={isSpinning}
              >
                <Icon name="plus" size={16} />
                {t('randomNumber.picker.addItem')}
              </button>

              {mode === 'sequence' && (
                <div className="field" style={{ marginTop: '0.5rem' }}>
                  <label className="field-checkbox">
                    <input
                      type="checkbox"
                      checked={excludeChosen}
                      onChange={(e) => { setExcludeChosen(e.target.checked); if (!isSpinning) clearWheelResult() }}
                      disabled={isSpinning}
                    />
                    {t('randomNumber.sequence.excludeChosen')}
                  </label>
                </div>
              )}

              {mode === 'sequence' && excludeChosen && hasEnoughItems && (
                <div className="history-section">
                  <h4>{t('randomNumber.sequence.history')}</h4>
                  {history.length > 0 && (
                    <div className="history-list">
                      {history.map((entry, index) => (
                        <div className="history-item" key={`${entry.item}-${index}`}>
                          <span className="history-item__number">{index + 1}</span>
                          <span className="history-item__text">{entry.item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="remaining-counter">
                    {hasFormattedRemaining ? (
                      <>
                        {remainingPrefix}
                        <strong>{remainingItems.length}</strong>
                        {remainingSuffix}
                      </>
                    ) : (
                      remainingPlainText
                    )}
                  </div>
                  {allSequenceItemsChosen ? (
                    <div className="all-chosen-message">
                      <p>{t('randomNumber.sequence.allChosen')}</p>
                      <button className="reset-history-btn" onClick={handleResetHistory}>
                        {t('randomNumber.sequence.reset')}
                      </button>
                    </div>
                  ) : history.length > 0 && (
                    <button className="reset-history-btn" onClick={handleResetHistory}>
                      {t('randomNumber.sequence.reset')}
                    </button>
                  )}
                </div>
              )}

              <div className="picker-actions">
                <div className="duration-row">
                  <span className="duration-label">{t('randomNumber.picker.duration')}:</span>
                  <div className="duration-btns">
                    {DURATION_OPTIONS.map(d => (
                      <button
                        key={d}
                        className={`duration-btn ${spinDuration === d && !customDuration ? 'is-active' : ''}`}
                        onClick={() => {
                          setSpinDuration(d)
                          setCustomDuration(null)
                        }}
                        disabled={isSpinning}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  className="duration-custom-input"
                  value={customDuration ?? ''}
                  onChange={(e) => {
                    handleCustomDurationChange(e)
                  }}
                  placeholder={t('randomNumber.picker.durationPlaceholder')}
                  min={1}
                  max={60}
                  disabled={isSpinning}
                />
                <button
                  className={`sound-toggle ${!soundEnabled ? 'is-muted' : ''}`}
                  onClick={handleSoundToggle}
                  disabled={isSpinning}
                >
                  <Icon name={soundEnabled ? 'volume_2' : 'volume_x'} size={16} />
                  {soundEnabled ? t('randomNumber.picker.soundOn') : t('randomNumber.picker.soundOff')}
                </button>
              </div>
            </div>

            <div className="picker-wheel-panel">
              <div ref={wheelWrapperRef}>
                <Wheel
                  items={wheelItems}
                  isSpinning={isSpinning}
                  onSpinEnd={handleSpinEnd}
                  soundEnabled={soundEnabled}
                  duration={finalDuration}
                  placeholder={t('randomNumber.picker.wheelPlaceholder')}
                  getAudioController={getAudioController}
                />
              </div>

              <button
                className={`spin-btn ${isSpinning ? 'is-spinning' : ''}`}
                onClick={handleSpin}
                disabled={!canSpin}
                title={spinButtonTitle}
              >
                {isSpinning ? (
                  <>
                    <Icon name="loader_2" size={20} />
                    {t('randomNumber.picker.spinning')}
                  </>
                ) : (
                  <>
                    <Icon name="refresh" size={20} />
                    {t('randomNumber.picker.spin')}
                  </>
                )}
              </button>

              {spinResult && !isSpinning && (
                <div className="picker-result">
                  <div className="picker-result__icon">
                    <Icon name="sparkles" size={48} />
                  </div>
                  <div className="picker-result__winner">{spinResult.winnerItem}</div>
                  <div className="picker-result__chance">
                    {t('randomNumber.picker.chance')}: {spinResult.chance}%
                  </div>
                  <div className="picker-result__actions">
{canSpin && (
                      <button className="re-spin-btn" onClick={handleReSpin}>
                        {t('randomNumber.picker.reSpin')}
                      </button>
                    )}
                    <CopyButton text={spinResult.winnerItem} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <ToolHelp>
          <ToolDescriptionSection>
            <div className="tool-help-prose">
              <h2 className="tool-help-heading">{t('randomNumber.infoTitle')}</h2>
              <p>{t('randomNumber.infoDescription')}</p>

              <h3 className="tool-help-subheading">{t('randomNumber.featuresTitle')}</h3>
              <ul>
                <li key="range">{t('randomNumber.features.range')}</li>
                <li key="sets">{t('randomNumber.features.sets')}</li>
                <li key="noRepeat">{t('randomNumber.features.noRepeat')}</li>
                <li key="withRepeat">{t('randomNumber.features.withRepeat')}</li>
                <li key="persist">{t('randomNumber.features.persist')}</li>
              </ul>

              <h3 className="tool-help-subheading">{t('randomNumber.wheelModeTitle')}</h3>
              <p>{t('randomNumber.wheelModeDescription')}</p>
              <ul>
                <li key="movies">{t('randomNumber.wheelUseCases.movies')}</li>
                <li key="games">{t('randomNumber.wheelUseCases.games')}</li>
                <li key="tasks">{t('randomNumber.wheelUseCases.tasks')}</li>
                <li key="food">{t('randomNumber.wheelUseCases.food')}</li>
                <li key="decisions">{t('randomNumber.wheelUseCases.decisions')}</li>
                <li key="raffle">{t('randomNumber.wheelUseCases.raffle')}</li>
              </ul>

              <h3 className="tool-help-subheading">{t('randomNumber.popularTitle')}</h3>
              <ul>
                <li key="oneToHundred">{t('randomNumber.popular.oneToHundred')}</li>
                <li key="randomizer">{t('randomNumber.popular.randomizer')}</li>
                <li key="unique">{t('randomNumber.popular.unique')}</li>
                <li key="oneToTen">{t('randomNumber.popular.oneToTen')}</li>
                <li key="noDuplicates">{t('randomNumber.popular.noDuplicates')}</li>
              </ul>

              <ToolFaq title={t('randomNumber.faqTitle')} items={[
                { q: t('randomNumber.faq.q1'), a: t('randomNumber.faq.a1') },
                { q: t('randomNumber.faq.q2'), a: t('randomNumber.faq.a2') },
                { q: t('randomNumber.faq.q3'), a: t('randomNumber.faq.a3') },
                { q: t('randomNumber.faq.q4'), a: t('randomNumber.faq.a4') },
              ]} />
            </div>
          </ToolDescriptionSection>
        </ToolHelp>

        <RelatedTools currentPath={`/${language}/random-number`} />
      </div>
    </>
  )
}

export default RandomNumber
