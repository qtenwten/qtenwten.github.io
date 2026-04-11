import dns from 'node:dns/promises'
import net from 'node:net'
import fetch from 'node-fetch'

const REQUEST_TIMEOUT_MS = 10000
const MAX_REDIRECTS = 5
const BLOCKED_HOSTNAMES = new Set(['localhost'])
const BLOCKED_SUFFIXES = ['.localhost', '.local', '.internal', '.home.arpa']

class AuditRequestError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

function normalizeHostname(hostname) {
  return hostname
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .replace(/\.$/, '')
    .toLowerCase()
}

function normalizeTargetUrl(rawUrl) {
  let targetUrl = rawUrl.trim()

  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`
  }

  const parsedUrl = new URL(targetUrl)

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new AuditRequestError('Only HTTP and HTTPS URLs are allowed')
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new AuditRequestError('Credentials in URL are not allowed')
  }

  return parsedUrl
}

function isPrivateIPv4(address) {
  const octets = address.split('.').map(Number)

  if (octets.length !== 4 || octets.some(Number.isNaN)) {
    return false
  }

  const [a, b] = octets

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  )
}

function isPrivateIPv6(address) {
  const normalized = normalizeHostname(address)

  if (normalized === '::1' || normalized === '::') {
    return true
  }

  if (normalized.startsWith('::ffff:')) {
    return isPrivateIPv4(normalized.slice(7))
  }

  return (
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb') ||
    normalized.startsWith('ff')
  )
}

function isPrivateAddress(address) {
  const normalized = normalizeHostname(address)
  const ipVersion = net.isIP(normalized)

  if (ipVersion === 4) {
    return isPrivateIPv4(normalized)
  }

  if (ipVersion === 6) {
    return isPrivateIPv6(normalized)
  }

  return false
}

async function assertPublicTarget(urlObj) {
  const hostname = normalizeHostname(urlObj.hostname)

  if (!hostname) {
    throw new AuditRequestError('Hostname is required')
  }

  if (BLOCKED_HOSTNAMES.has(hostname) || BLOCKED_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    throw new AuditRequestError('Private and local network hosts are not allowed')
  }

  if (isPrivateAddress(hostname)) {
    throw new AuditRequestError('Private and local network hosts are not allowed')
  }

  let resolvedAddresses = []

  if (net.isIP(hostname)) {
    resolvedAddresses = [{ address: hostname }]
  } else {
    try {
      resolvedAddresses = await dns.lookup(hostname, { all: true, verbatim: true })
    } catch {
      throw new AuditRequestError('Unable to resolve hostname')
    }
  }

  if (!resolvedAddresses.length) {
    throw new AuditRequestError('Unable to resolve hostname')
  }

  if (resolvedAddresses.some(({ address }) => isPrivateAddress(address))) {
    throw new AuditRequestError('Private and local network hosts are not allowed')
  }
}

async function fetchPublicHtml(initialUrl) {
  let currentUrl = initialUrl.toString()

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const urlObj = normalizeTargetUrl(currentUrl)

    await assertPublicTarget(urlObj)

    const response = await fetch(urlObj.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: 'manual'
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')

      if (!location) {
        throw new AuditRequestError('Redirect response has no location header', 502)
      }

      currentUrl = new URL(location, urlObj).toString()
      continue
    }

    if (!response.ok) {
      throw new AuditRequestError(`Failed to fetch URL: ${response.status} ${response.statusText}`, 502)
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase()
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw new AuditRequestError('URL must return an HTML document')
    }

    return response
  }

  throw new AuditRequestError('Too many redirects', 400)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const url = req.method === 'POST' ? req.body?.url : req.query.url

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' })
  }

  try {
    const targetUrl = normalizeTargetUrl(url)
    const response = await fetchPublicHtml(targetUrl)
    const html = await response.text()
    const result = parseHTML(html)

    return res.status(200).json(result)
  } catch (error) {
    console.error('SEO Audit Error:', error)

    if (error instanceof AuditRequestError) {
      return res.status(error.status).json({ error: error.message })
    }

    return res.status(500).json({ error: 'Failed to analyze URL' })
  }
}

function parseHTML(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : null

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
  const description = descMatch ? descMatch[1].trim() : null

  const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i)
  const keywords = keywordsMatch ? keywordsMatch[1].trim() : null

  const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i)
  const robots = robotsMatch ? robotsMatch[1].trim() : null

  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
  const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : null

  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
  const ogDescription = ogDescMatch ? ogDescMatch[1].trim() : null

  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
  const ogImage = ogImageMatch ? ogImageMatch[1].trim() : null

  const h1Matches = html.match(/<h1[^>]*>/gi)
  const h1Count = h1Matches ? h1Matches.length : 0

  const h2Matches = html.match(/<h2[^>]*>/gi)
  const h2Count = h2Matches ? h2Matches.length : 0

  const h3Matches = html.match(/<h3[^>]*>/gi)
  const h3Count = h3Matches ? h3Matches.length : 0

  const imgMatches = html.match(/<img[^>]*>/gi)
  const imagesTotal = imgMatches ? imgMatches.length : 0

  let imagesWithoutAlt = 0
  if (imgMatches) {
    imgMatches.forEach((img) => {
      if (!img.match(/alt=["'][^"']*["']/i)) {
        imagesWithoutAlt++
      }
    })
  }

  const structuredDataMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/i)
  const hasStructuredData = !!structuredDataMatch

  return {
    title,
    description,
    keywords,
    robots,
    h1Count,
    h2Count,
    h3Count,
    imagesTotal,
    imagesWithoutAlt,
    hasStructuredData,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      image: ogImage
    }
  }
}
