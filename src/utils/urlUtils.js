export function normalizeUrl(url) {
  const trimmed = String(url).trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function isValidUrl(url) {
  try {
    const normalized = normalizeUrl(url)
    if (!normalized) return false
    const parsed = new URL(normalized)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export function buildSearchUrl(language, term) {
  return `https://qsen.ru/${language}/?search=${encodeURIComponent(term)}`
}