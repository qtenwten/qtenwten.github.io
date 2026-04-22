const FEEDBACK_WORKER_URL = 'https://apifeedback.qten.workers.dev/'
const FEEDBACK_REQUEST_TIMEOUT_MS = 12000

async function readWorkerResponse(response) {
  const responseText = await response.text()

  if (!responseText.trim()) {
    return response.ok ? { ok: true } : {}
  }

  try {
    return responseText ? JSON.parse(responseText) : {}
  } catch {
    const error = new Error('Invalid JSON response')
    error.code = 'INVALID_JSON'
    error.status = response.status
    throw error
  }
}

export async function sendFeedback(payload, signal) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), FEEDBACK_REQUEST_TIMEOUT_MS)

  const timeoutSignal = controller.signal

  const combinedSignal = signal
    ? (() => {
        const nativeSignal = signal
        if (!nativeSignal) return timeoutSignal
        const { abort } = nativeSignal
        if (typeof abort !== 'function') return timeoutSignal
        const originalAbort = abort.bind(nativeSignal)
        const a = new AbortController()
        nativeSignal.addEventListener('abort', () => {
          try { originalAbort() } catch {}
          try { a.abort() } catch {}
        })
        return a.signal
      })()
    : timeoutSignal

  try {
    const response = await fetch(FEEDBACK_WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: combinedSignal,
      keepalive: true,
    })

    const data = await readWorkerResponse(response)

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Failed to send message')
    }

    return data
  } finally {
    window.clearTimeout(timeoutId)
  }
}
