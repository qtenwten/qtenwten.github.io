const MIN_GAIN = 0.001

function getDefaultAudioContextConstructor() {
  if (typeof window === 'undefined') return null
  return window.AudioContext || window.webkitAudioContext || null
}

export function createWheelAudioController({
  getAudioContextConstructor = getDefaultAudioContextConstructor,
} = {}) {
  let audioContext = null
  let resumePromise = null

  const ensureContext = () => {
    if (audioContext && audioContext.state !== 'closed') {
      return audioContext
    }

    const AudioContextConstructor = getAudioContextConstructor()
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

    if (context.state === 'suspended' && typeof context.resume === 'function') {
      if (!resumePromise) {
        resumePromise = context.resume().catch(() => null).finally(() => {
          resumePromise = null
        })
      }

      await resumePromise
    }

    return context.state === 'running' ? context : null
  }

  const playTone = async ({
    frequency = 700,
    type = 'sine',
    gainValue = 0.08,
    duration = 0.04,
    fadeDuration = duration,
  } = {}) => {
    const context = await warmUp()
    if (!context) return false

    try {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const now = context.currentTime

      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.frequency.value = frequency
      oscillator.type = type
      gain.gain.setValueAtTime(gainValue, now)
      gain.gain.exponentialRampToValueAtTime(MIN_GAIN, now + fadeDuration)
      oscillator.start()
      oscillator.stop(now + duration)
      return true
    } catch {
      return false
    }
  }

  const close = async () => {
    const context = audioContext
    audioContext = null
    resumePromise = null

    if (context && context.state !== 'closed' && typeof context.close === 'function') {
      try {
        await context.close()
      } catch {
        // The browser can reject close during shutdown; there is nothing useful to surface.
      }
    }
  }

  return {
    warmUp,
    playTone,
    close,
    getContext: () => audioContext,
  }
}
