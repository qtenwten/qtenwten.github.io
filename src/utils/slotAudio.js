let isAudioUnlocked = false

function unlockAudioOnInteraction() {
  if (isAudioUnlocked || typeof window === 'undefined') return
  isAudioUnlocked = true

  const unlockContext = () => {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextConstructor) return

    try {
      const tempContext = new AudioContextConstructor()
      if (tempContext.state === 'suspended') {
        tempContext.resume().catch(() => {})
      }
      tempContext.close().catch(() => {})
    } catch {}
  }

  const events = ['touchstart', 'touchend', 'click', 'keydown']
  events.forEach((event) => {
    window.addEventListener(event, unlockContext, { once: true, passive: true })
  })
}

if (typeof window !== 'undefined') {
  unlockAudioOnInteraction()
}

function getDefaultAudioContextConstructor() {
  if (typeof window === 'undefined') return null
  return window.AudioContext || window.webkitAudioContext || null
}

let slotAudioController = null

function createSlotAudioController() {
  let audioContext = null

  const ensureContext = () => {
    if (audioContext && audioContext.state !== 'closed') {
      return audioContext
    }

    const AudioContextConstructor = getDefaultAudioContextConstructor()
    if (!AudioContextConstructor) {
      audioContext = null
      return null
    }

    try {
      audioContext = new AudioContextConstructor()
      return audioContext
    } catch {
      audioContext = null
      return null
    }
  }

  const warmUp = async () => {
    const context = ensureContext()
    if (!context) return null

    if (context.state === 'suspended') {
      await context.resume().catch(() => null)
    }

    if (context.state === 'running') {
      isAudioUnlocked = true
    }

    return context.state === 'running' ? context : null
  }

  const playTick = async (volumeScale = 1) => {
    let context = await warmUp()
    if (!context) return

    try {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const now = context.currentTime

      oscillator.connect(gain)
      gain.connect(context.destination)

      const baseFreq = 550 + Math.random() * 350
      oscillator.frequency.value = baseFreq
      oscillator.type = 'sine'

      const gainValue = Math.min(0.06, 0.04 * volumeScale)
      gain.gain.setValueAtTime(gainValue, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

      oscillator.start(now)
      oscillator.stop(now + 0.06)
    } catch {}
  }

  const playFinalClick = async () => {
    let context = await warmUp()
    if (!context) return

    try {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const now = context.currentTime

      oscillator.connect(gain)
      gain.connect(context.destination)

      oscillator.frequency.value = 1400
      oscillator.type = 'triangle'

      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

      oscillator.start(now)
      oscillator.stop(now + 0.18)
    } catch {}
  }

  const close = async () => {
    const context = audioContext
    audioContext = null

    if (context && context.state !== 'closed' && typeof context.close === 'function') {
      try {
        await context.close()
      } catch {}
    }
  }

  return {
    playTick,
    playFinalClick,
    close,
    warmUp,
  }
}

export function getSlotAudioController() {
  if (!slotAudioController) {
    slotAudioController = createSlotAudioController()
  }
  return slotAudioController
}

export function closeSlotAudioController() {
  if (slotAudioController) {
    slotAudioController.close()
    slotAudioController = null
  }
}