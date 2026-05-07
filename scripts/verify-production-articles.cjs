const https = require('https')
const http = require('http')

const BASE_URL = 'https://qsen.ru'
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`
const TIMEOUT_MS = 15000

function fetch(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const req = protocol.get(url, { signal: controller.signal }, (res) => {
      clearTimeout(timeout)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(fetch(res.headers.location))
        return
      }

      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })

    req.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

function decodeHtmlEntities(str) {
  return str.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function extractArticleUrls(xml) {
  const locMatches = xml.match(/<loc>(https?:\/\/qsen\.ru\/[^<]+)<\/loc>/g) || []
  const urls = locMatches.map((m) => m.replace(/<\/?loc>/g, ''))
  return {
    ru: urls.filter((u) => /\/ru\/articles\/[^/]+\/?$/.test(u)),
    en: urls.filter((u) => /\/en\/articles\/[^/]+\/?$/.test(u)),
    all: urls.filter((u) => /\/articles\/[^/]+\/?$/.test(u)),
  }
}

function checkArticleHtml(body) {
  const articleMarkdownPos = body.indexOf('<div class="article-markdown">')
  const scriptPos = body.indexOf('<script id="__ARTICLE_DETAIL_DATA__"')

  if (articleMarkdownPos === -1) {
    return { ok: false, error: 'no article-markdown div' }
  }
  if (scriptPos === -1) {
    return { ok: false, error: 'no __ARTICLE_DETAIL_DATA__ script' }
  }
  if (articleMarkdownPos > scriptPos) {
    return { ok: false, error: 'article-markdown AFTER script tag' }
  }

  const contentStart = articleMarkdownPos + '<div class="article-markdown">'.length
  const searchRegion = body.substring(contentStart, scriptPos)

  let depth = 0
  let bodyEnd = -1
  const divPattern = /<\/?div[^>]*>/g
  let match
  let lastIndex = contentStart

  while ((match = divPattern.exec(searchRegion)) !== null) {
    const matchPos = contentStart + match.index
    if (matchPos >= scriptPos) break
    if (match[0].startsWith('</')) {
      if (depth === 0) {
        bodyEnd = matchPos
        break
      }
      depth--
    } else {
      depth++
    }
    lastIndex = matchPos + match[0].length
  }

  if (bodyEnd === -1) {
    bodyEnd = scriptPos
  }

  const bodyHtml = body.substring(contentStart, bodyEnd)
  const textWithoutTags = bodyHtml.replace(/<[^>]+>/g, ' ')
  const decodedText = decodeHtmlEntities(textWithoutTags).trim()

  if (decodedText.length < 30) {
    return { ok: false, error: `body text too short (${decodedText.length} chars)`, textLength: decodedText.length }
  }

  return {
    ok: true,
    bodyTextLength: decodedText.length,
    bodyBeforeScript: true,
  }
}

async function verifyArticle(url) {
  try {
    const response = await fetch(url)
    if (response.status !== 200) {
      return { url, ok: false, error: `HTTP ${response.status}` }
    }

    const check = checkArticleHtml(response.body)
    if (!check.ok) {
      return { url, ok: false, error: check.error }
    }

    return { url, ok: true, bodyTextLength: check.bodyTextLength }
  } catch (err) {
    return { url, ok: false, error: err.message }
  }
}

async function main() {
  console.log('🔍 Production Article Verification for QSEN.RU\n')
  console.log('='.repeat(60))

  console.log('\n📥 Fetching sitemap...')
  let sitemapBody
  try {
    const sitemapResponse = await fetch(SITEMAP_URL)
    sitemapBody = sitemapResponse.body
  } catch (err) {
    console.error(`❌ Failed to fetch sitemap: ${err.message}`)
    process.exit(1)
  }

  const urls = extractArticleUrls(sitemapBody)
  console.log(`   RU article URLs in sitemap: ${urls.ru.length}`)
  console.log(`   EN article URLs in sitemap: ${urls.en.length}`)
  console.log(`   Total article URLs: ${urls.all.length}`)

  if (urls.ru.length === 0 && urls.en.length === 0) {
    console.error('❌ No article URLs found in sitemap')
    process.exit(1)
  }

  const sampleRu = urls.ru.slice(0, 5)
  const sampleEn = urls.en.slice(0, 5)

  console.log('\n🔬 Checking RU articles (sample)...')
  let ruPassed = 0
  let ruFailed = 0
  for (const url of sampleRu) {
    const result = await verifyArticle(url)
    if (result.ok) {
      ruPassed++
    } else {
      ruFailed++
      console.log(`   ❌ ${url}: ${result.error}`)
    }
  }
  console.log(`   ✅ RU: ${ruPassed}/${sampleRu.length} passed`)

  console.log('\n🔬 Checking EN articles (sample)...')
  let enPassed = 0
  let enFailed = 0
  for (const url of sampleEn) {
    const result = await verifyArticle(url)
    if (result.ok) {
      enPassed++
    } else {
      enFailed++
      console.log(`   ❌ ${url}: ${result.error}`)
    }
  }
  console.log(`   ✅ EN: ${enPassed}/${sampleEn.length} passed`)

  console.log('\n' + '='.repeat(60))

  const totalFailed = ruFailed + enFailed
  if (totalFailed > 0) {
    console.log(`\n❌ PRODUCTION VERIFICATION FAILED (${totalFailed} issues)`)
    process.exit(1)
  } else {
    console.log('\n✅ ALL PRODUCTION CHECKS PASSED')
    console.log('\n📋 Post-deploy checklist:')
    console.log('   1. Verify in browser: https://qsen.ru/ru/articles/koleso-donatov-dlya-strimera/')
    console.log('   2. Submit sitemap: https://qsen.ru/sitemap.xml to Google Search Console')
    console.log('   3. Request indexing for key articles in Google Search Console')
    console.log('   4. Check Яндекс.Вебмастер for sitemap status')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error(`❌ Script error: ${err.message}`)
  process.exit(1)
})