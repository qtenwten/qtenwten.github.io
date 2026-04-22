const SEO_AUDIT_WORKER_URL = 'https://seo-audit-api.qten.workers.dev/'

async function readApiResponse(response) {
  const contentType = (response.headers.get('content-type') || '').toLowerCase()
  const bodyText = await response.text()
  const trimmedBody = bodyText.trim()

  const looksLikeHtml =
    contentType.includes('text/html') ||
    trimmedBody.startsWith('<!DOCTYPE') ||
    trimmedBody.startsWith('<html') ||
    trimmedBody.startsWith('<')

  if (looksLikeHtml) {
    const error = new Error('API returned HTML instead of JSON')
    error.code = 'HTML_RESPONSE'
    error.html = bodyText
    error.status = response.status
    throw error
  }

  try {
    return trimmedBody ? JSON.parse(bodyText) : {}
  } catch (error) {
    const parseError = new Error('API returned invalid JSON')
    parseError.code = 'INVALID_JSON'
    parseError.status = response.status
    parseError.cause = error
    throw parseError
  }
}

function normalizeAuditUrl(rawUrl) {
  const trimmedUrl = rawUrl.trim()

  if (!trimmedUrl) {
    return ''
  }

  const normalizedUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`
  const parsedUrl = new URL(normalizedUrl)

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Invalid URL protocol')
  }

  return parsedUrl.toString()
}

async function requestWorkerAudit(normalizedUrl, signal) {
  const response = await fetch(`${SEO_AUDIT_WORKER_URL}?url=${encodeURIComponent(normalizedUrl)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  const data = await readApiResponse(response)

  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Worker request failed')
    error.code = 'WORKER_ERROR'
    error.status = response.status
    throw error
  }

  if (data?.error) {
    const error = new Error(data.error)
    error.code = 'WORKER_ERROR'
    throw error
  }

  return data
}

export { SEO_AUDIT_WORKER_URL, readApiResponse, normalizeAuditUrl, requestWorkerAudit }