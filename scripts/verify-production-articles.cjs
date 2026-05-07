const https = require('https')
const http = require('http')

const BASE_URL = 'https://qsen.ru'
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`
const EXPECTED_RU_COUNT = 35
const EXPECTED_EN_COUNT = 35
const TIMEOUT_MS = 20000
const MAX_REDIRECTS = 5
const MIN_BODY_TEXT_LENGTH = 250

function fetchUrl(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const req = protocol.get(url, { signal: controller.signal }, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        clearTimeout(timeout)

        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirectCount >= MAX_REDIRECTS) {
            reject(new Error(`too many redirects for ${url}`))
            return
          }

          const nextUrl = new URL(res.headers.location, url).toString()
          fetchUrl(nextUrl, redirectCount + 1)
            .then((nextResponse) => {
              resolve({
                ...nextResponse,
                redirects: [
                  { status: res.statusCode, from: url, to: nextUrl },
                  ...(nextResponse.redirects || []),
                ],
              })
            })
            .catch(reject)
          return
        }

        resolve({
          requestedUrl: url,
          finalUrl: url,
          status: res.statusCode,
          headers: res.headers,
          body: data,
          redirects: [],
        })
      })
    })

    req.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

function decodeHtmlEntities(value = '') {
  return value
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
}

function stripTags(html = '') {
  return decodeHtmlEntities(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function extractArticleUrls(xml) {
  const locMatches = [...xml.matchAll(/<loc>(https?:\/\/qsen\.ru\/[^<]+)<\/loc>/g)]
  const urls = locMatches.map((match) => match[1])
  return {
    ru: urls.filter((url) => /\/ru\/articles\/[^/]+\/?$/.test(url)),
    en: urls.filter((url) => /\/en\/articles\/[^/]+\/?$/.test(url)),
    all: urls.filter((url) => /\/(?:ru|en)\/articles\/[^/]+\/?$/.test(url)),
  }
}

function extractFirstMatch(html, pattern) {
  const match = html.match(pattern)
  return match ? decodeHtmlEntities(match[1].trim()) : ''
}

function extractArticleDetailData(html) {
  const match = html.match(/<script id="__ARTICLE_DETAIL_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!match) return null

  try {
    return JSON.parse(match[1])
  } catch {
    return null
  }
}

function extractArticleMarkdownHtml(html) {
  const startMatch = html.match(/<div class="article-markdown">/)
  if (!startMatch || typeof startMatch.index !== 'number') {
    return { html: '', startsAt: -1, endsAt: -1 }
  }

  const startTagStart = startMatch.index
  const contentStart = startTagStart + startMatch[0].length
  const remainder = html.slice(contentStart)
  const divPattern = /<\/?div\b[^>]*>/gi
  let depth = 1
  let match

  while ((match = divPattern.exec(remainder)) !== null) {
    const tag = match[0]
    if (tag.startsWith('</')) {
      depth -= 1
      if (depth === 0) {
        const endsAt = contentStart + match.index
        return {
          html: html.slice(contentStart, endsAt),
          startsAt: startTagStart,
          endsAt,
        }
      }
    } else if (!tag.endsWith('/>')) {
      depth += 1
    }
  }

  return {
    html: html.slice(contentStart),
    startsAt: startTagStart,
    endsAt: html.length,
  }
}

function markdownTextLength(markdown = '') {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[[^\]]+\]\([^)]+\)/g, '$1')
    .replace(/[#>*_\-|:[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length
}

function hasMarkdownTable(markdown = '') {
  const lines = markdown.split(/\r?\n/)
  return lines.some((line, index) => {
    if (!line.includes('|')) return false
    const next = lines[index + 1] || ''
    return /\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?/.test(next)
  })
}

function hasMarkdownDivider(markdown = '') {
  return markdown.split(/\r?\n/).some((line) => /^\s*-{3,}\s*$/.test(line))
}

function validateArticleHtml(url, response) {
  const issues = []
  const html = response.body || ''
  const detailData = extractArticleDetailData(html)
  const articleBody = extractArticleMarkdownHtml(html)
  const bodyText = stripTags(articleBody.html)
  const scriptPos = html.indexOf('<script id="__ARTICLE_DETAIL_DATA__"')
  const canonical = extractFirstMatch(html, /<link rel="canonical" href="([^"]+)" \/>/)
  const h1 = extractFirstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/)
  const title = extractFirstMatch(html, /<title>([\s\S]*?)<\/title>/)
  const description = extractFirstMatch(html, /<meta name="description" content="([^"]*)" \/>/)
  const robots = extractFirstMatch(html, /<meta name="robots" content="([^"]*)" \/>/i)

  if (response.status !== 200) issues.push(`HTTP ${response.status}`)
  if (!url.endsWith('/')) issues.push('sitemap URL has no trailing slash')
  if (!response.finalUrl.endsWith('/')) issues.push('final URL has no trailing slash')
  if (!/<article\b/i.test(html) && !html.includes('article-layout')) issues.push('no article layout')
  if (!html.includes('article-markdown')) issues.push('no article-markdown')
  if (articleBody.startsAt === -1) issues.push('article body not found')
  if (scriptPos === -1) issues.push('no __ARTICLE_DETAIL_DATA__ script')
  if (articleBody.startsAt !== -1 && scriptPos !== -1 && articleBody.startsAt > scriptPos) issues.push('article body appears after JSON script')
  if (articleBody.endsAt !== -1 && scriptPos !== -1 && articleBody.endsAt > scriptPos) issues.push('article body overlaps JSON script')
  if (bodyText.length < MIN_BODY_TEXT_LENGTH) issues.push(`body text too short (${bodyText.length})`)
  if (!detailData) issues.push('article detail JSON is missing or invalid')
  if (/noindex/i.test(robots)) issues.push('robots noindex')
  if (!canonical) issues.push('missing canonical')
  if (canonical && !canonical.endsWith('/')) issues.push('canonical has no trailing slash')
  if (canonical && canonical !== url) issues.push(`canonical mismatch: ${canonical}`)
  if (!h1) issues.push('missing h1')
  if (!title) issues.push('missing title')
  if (!description) issues.push('missing meta description')

  const expectedTextLength = markdownTextLength(detailData?.content || '')
  if (expectedTextLength > 500 && bodyText.length < expectedTextLength * 0.25) {
    issues.push(`body looks like old shell (${bodyText.length}/${expectedTextLength})`)
  }

  if (hasMarkdownTable(detailData?.content || '') && !html.includes('article-table')) {
    issues.push('markdown table did not render as article-table')
  }

  if (hasMarkdownDivider(detailData?.content || '') && !html.includes('article-divider')) {
    issues.push('markdown divider did not render as article-divider')
  }

  return {
    ok: issues.length === 0,
    url,
    status: response.status,
    finalUrl: response.finalUrl,
    bodyLength: bodyText.length,
    h1,
    canonical,
    hasArticleMarkdown: html.includes('article-markdown'),
    hasBodyBeforeJson: articleBody.startsAt !== -1 && scriptPos !== -1 && articleBody.startsAt < scriptPos && articleBody.endsAt <= scriptPos,
    hasNoindex: /noindex/i.test(robots),
    hasArticleTable: html.includes('article-table'),
    hasArticleDivider: html.includes('article-divider'),
    issues,
  }
}

function printResult(result) {
  const status = result.ok ? 'PASS' : 'FAIL'
  console.log(`${status} ${result.url}`)
  console.log(`  body length: ${result.bodyLength}`)
  console.log(`  h1: ${result.h1 || '(missing)'}`)
  console.log(`  canonical: ${result.canonical || '(missing)'}`)
  console.log(`  has article-markdown: ${result.hasArticleMarkdown}`)
  console.log(`  has body before JSON: ${result.hasBodyBeforeJson}`)
  console.log(`  has noindex: ${result.hasNoindex}`)
  console.log(`  issues: ${result.issues.length ? result.issues.join('; ') : 'none'}`)
}

async function main() {
  console.log('Production Article Verification for QSEN.RU')
  console.log('='.repeat(60))

  const sitemapResponse = await fetchUrl(SITEMAP_URL)
  if (sitemapResponse.status !== 200) {
    console.error(`Failed to fetch sitemap: HTTP ${sitemapResponse.status}`)
    process.exit(1)
  }

  const urls = extractArticleUrls(sitemapResponse.body)
  console.log(`RU article URLs in sitemap: ${urls.ru.length}`)
  console.log(`EN article URLs in sitemap: ${urls.en.length}`)
  console.log(`Total article URLs: ${urls.all.length}`)

  const countIssues = []
  if (urls.ru.length !== EXPECTED_RU_COUNT) countIssues.push(`expected ${EXPECTED_RU_COUNT} RU URLs, got ${urls.ru.length}`)
  if (urls.en.length !== EXPECTED_EN_COUNT) countIssues.push(`expected ${EXPECTED_EN_COUNT} EN URLs, got ${urls.en.length}`)
  if (urls.all.length !== EXPECTED_RU_COUNT + EXPECTED_EN_COUNT) countIssues.push(`expected ${EXPECTED_RU_COUNT + EXPECTED_EN_COUNT} total URLs, got ${urls.all.length}`)

  console.log('\nChecking article pages...')
  const results = []
  for (const url of urls.all) {
    try {
      const response = await fetchUrl(url)
      const result = validateArticleHtml(url, response)
      results.push(result)
      printResult(result)
    } catch (err) {
      const result = {
        ok: false,
        url,
        bodyLength: 0,
        h1: '',
        canonical: '',
        hasArticleMarkdown: false,
        hasBodyBeforeJson: false,
        hasNoindex: false,
        issues: [err.message],
      }
      results.push(result)
      printResult(result)
    }
  }

  const failed = results.filter((result) => !result.ok)
  console.log('\n' + '='.repeat(60))
  console.log(`Checked article URLs: ${results.length}`)
  console.log(`Passed: ${results.length - failed.length}`)
  console.log(`Failed: ${failed.length}`)

  if (countIssues.length > 0) {
    console.log(`Count issues: ${countIssues.join('; ')}`)
  }

  if (failed.length > 0) {
    console.log('\nFailed URLs:')
    for (const result of failed) {
      console.log(`- ${result.url}: ${result.issues.join('; ')}`)
    }
  }

  if (countIssues.length > 0 || failed.length > 0) {
    process.exit(1)
  }

  console.log('\nALL PRODUCTION ARTICLE CHECKS PASSED')
}

main().catch((err) => {
  console.error(`Script error: ${err.message}`)
  process.exit(1)
})
