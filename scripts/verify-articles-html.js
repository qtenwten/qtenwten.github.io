import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../dist')
const publicPath = path.resolve(__dirname, '../public')

const ARTICLES_API_BASE_URL = 'https://fancy-scene-deeb.qten.workers.dev'
const ARTICLES_REQUEST_TIMEOUT_MS = 20000
const ARTICLES_PAGE_SIZE = 50

async function fetchArticlesIndex() {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ARTICLES_REQUEST_TIMEOUT_MS)

  try {
    const items = []
    let offset = 0
    let total = null

    while (total === null || offset < total) {
      const response = await fetch(`${ARTICLES_API_BASE_URL}/articles?limit=${ARTICLES_PAGE_SIZE}&offset=${offset}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Articles request failed with status ${response.status}`)
      }

      const data = await response.json()
      if (data?.error) throw new Error(data.error)

      if (Array.isArray(data)) {
        items.push(...data)
        break
      }

      const pageItems = Array.isArray(data?.articles)
        ? data.articles
        : Array.isArray(data?.results)
          ? data.results
          : []

      items.push(...pageItems)
      total = Number.isFinite(Number(data?.total)) ? Number(data.total) : items.length

      if (pageItems.length === 0 || pageItems.length < ARTICLES_PAGE_SIZE) {
        break
      }

      offset += pageItems.length
    }

    if (items.length === 0) {
      throw new Error(`Articles index returned 0 items`)
    }
    return items
  } finally {
    clearTimeout(timeoutId)
  }
}

function articleMatchesLanguage(article, language) {
  if (language !== 'ru' && language !== 'en') {
    return true
  }

  if (['ru', 'en'].includes(article?.language)) {
    return article.language === language
  }

  return false
}

function countGeneratedArticleFiles(lang) {
  const articlesDir = path.join(distPath, lang, 'articles')
  if (!fs.existsSync(articlesDir)) {
    return { count: 0, slugs: [] }
  }

  const dirs = fs.readdirSync(articlesDir).filter((d) => {
    const dPath = path.join(articlesDir, d)
    return fs.statSync(dPath).isDirectory()
  })

  return { count: dirs.length, slugs: dirs }
}

function parseSitemapArticleUrls() {
  const sitemapPath = path.join(publicPath, 'sitemap.xml')
  if (!fs.existsSync(sitemapPath)) {
    return []
  }

  const content = fs.readFileSync(sitemapPath, 'utf-8')
  const locMatches = content.match(/<loc>(https?:\/\/qsen\.ru\/[^<]+)<\/loc>/g) || []
  const urls = locMatches.map((m) => m.replace(/<\/?loc>/g, ''))
  return urls.filter((url) => /\/articles\/[^/]+/.test(url))
}

function decodeHtmlEntities(str) {
  return str.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function checkArticleHtml(filePath) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, error: 'file not found' }
  }

  const content = fs.readFileSync(filePath, 'utf-8')

  const articleMarkdownPos = content.indexOf('<div class="article-markdown">')
  const scriptPos = content.indexOf('<script id="__ARTICLE_DETAIL_DATA__"')

  if (articleMarkdownPos === -1) {
    return { exists: true, error: 'no article-markdown div' }
  }

  if (scriptPos === -1) {
    return { exists: true, error: 'no __ARTICLE_DETAIL_DATA__ script' }
  }

  if (articleMarkdownPos > scriptPos) {
    return { exists: true, error: 'article-markdown AFTER script tag' }
  }

  const contentStart = articleMarkdownPos + '<div class="article-markdown">'.length
  const searchRegion = content.substring(contentStart, scriptPos)

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

  const bodyHtml = content.substring(contentStart, bodyEnd)
  const textWithoutTags = bodyHtml.replace(/<[^>]+>/g, ' ')
  const decodedText = decodeHtmlEntities(textWithoutTags).trim()

  if (decodedText.length < 30) {
    return { exists: true, error: `body text too short (${decodedText.length} chars after decode)`, bodyLength: bodyHtml.length }
  }

  return {
    exists: true,
    bodyLength: bodyHtml.length,
    textLength: decodedText.length,
    bodyBeforeScript: true,
    ok: true,
  }
}

async function main() {
  console.log('🔍 QSEN Articles HTML Verification\n')
  console.log('='.repeat(60))

  let publishedArticles = []
  try {
    publishedArticles = await fetchArticlesIndex()
    publishedArticles = publishedArticles.filter((a) => a.status === 'published' || !a.status)
  } catch (err) {
    console.error(`❌ Failed to fetch articles from API: ${err.message}`)
    process.exit(1)
  }

  const ruPublished = publishedArticles.filter((a) => articleMatchesLanguage(a, 'ru'))
  const enPublished = publishedArticles.filter((a) => articleMatchesLanguage(a, 'en'))

  console.log(`\n📊 API Data:`)
  console.log(`   Total published articles in D1: ${publishedArticles.length}`)
  console.log(`   RU articles: ${ruPublished.length}`)
  console.log(`   EN articles: ${enPublished.length}`)

  const ruGenerated = countGeneratedArticleFiles('ru')
  const enGenerated = countGeneratedArticleFiles('en')
  const sitemapUrls = parseSitemapArticleUrls()
  const sitemapRu = sitemapUrls.filter((u) => u.includes('/ru/articles/'))
  const sitemapEn = sitemapUrls.filter((u) => u.includes('/en/articles/'))

  console.log(`\n📁 Generated HTML Files:`)
  console.log(`   RU HTML files: ${ruGenerated.count}`)
  console.log(`   EN HTML files: ${enGenerated.count}`)
  console.log(`   Total HTML files: ${ruGenerated.count + enGenerated.count}`)

  console.log(`\n🗺️  Sitemap:`)
  console.log(`   Total article URLs in sitemap: ${sitemapUrls.length}`)
  console.log(`   RU article URLs: ${sitemapRu.length}`)
  console.log(`   EN article URLs: ${sitemapEn.length}`)

  const publishedSlugs = {
    ru: ruPublished.map((a) => a.slug),
    en: enPublished.map((a) => a.slug),
  }

  const generatedSlugs = {
    ru: ruGenerated.slugs,
    en: enGenerated.slugs,
  }

  const missingRu = publishedSlugs.ru.filter((s) => !generatedSlugs.ru.includes(s))
  const missingEn = publishedSlugs.en.filter((s) => !generatedSlugs.en.includes(s))

  const sitemapSlugPairs = new Set(
    sitemapUrls.map((u) => {
      const parts = u.replace('https://qsen.ru', '').split('/articles/')
      return parts[1]?.replace(/\/$/, '')
    })
  )

  console.log(`\n⚠️  Validation:`)

  let hasErrors = false

  if (missingRu.length > 0) {
    hasErrors = true
    console.log(`   ❌ Missing RU HTML (${missingRu.length}): ${missingRu.slice(0, 5).join(', ')}${missingRu.length > 5 ? '...' : ''}`)
  } else {
    console.log(`   ✅ All RU articles have HTML files`)
  }

  if (missingEn.length > 0) {
    hasErrors = true
    console.log(`   ❌ Missing EN HTML (${missingEn.length}): ${missingEn.slice(0, 5).join(', ')}${missingEn.length > 5 ? '...' : ''}`)
  } else {
    console.log(`   ✅ All EN articles have HTML files`)
  }

  const ruMismatch = ruPublished.length !== ruGenerated.count
  const enMismatch = enPublished.length !== enGenerated.count

  if (ruMismatch) {
    hasErrors = true
    console.log(`   ❌ RU count mismatch: D1=${ruPublished.length}, generated=${ruGenerated.count}`)
  } else {
    console.log(`   ✅ RU count match: D1=${ruPublished.length} = generated=${ruGenerated.count}`)
  }

  if (enMismatch) {
    hasErrors = true
    console.log(`   ❌ EN count mismatch: D1=${enPublished.length}, generated=${enGenerated.count}`)
  } else {
    console.log(`   ✅ EN count match: D1=${enPublished.length} = generated=${enGenerated.count}`)
  }

  console.log(`\n🔬 Body Content Checks (sampling):`)

  const sampleSize = Math.min(10, publishedSlugs.ru.length)
  let sampledPassed = 0
  let sampledFailed = 0

  for (const slug of publishedSlugs.ru.slice(0, sampleSize)) {
    const ruFilePath = path.join(distPath, 'ru', 'articles', slug, 'index.html')
    const ruResult = checkArticleHtml(ruFilePath)
    if (!ruResult.exists || !ruResult.ok) {
      sampledFailed++
      console.log(`   ❌ RU/${slug}: ${ruResult.error}`)
    } else {
      sampledPassed++
    }
  }

  for (const slug of publishedSlugs.en.slice(0, sampleSize)) {
    const enFilePath = path.join(distPath, 'en', 'articles', slug, 'index.html')
    const enResult = checkArticleHtml(enFilePath)
    if (!enResult.exists || !enResult.ok) {
      sampledFailed++
      console.log(`   ❌ EN/${slug}: ${enResult.error}`)
    } else {
      sampledPassed++
    }
  }

  if (sampledFailed === 0) {
    console.log(`   ✅ All sampled articles have valid body HTML (${sampledPassed} files checked)`)
  } else {
    hasErrors = true
    console.log(`   ❌ ${sampledFailed} sampled files have body issues`)
  }

  const emptyBodySlugs = []
  for (const slug of publishedSlugs.ru.slice(0, 50)) {
    const ruFilePath = path.join(distPath, 'ru', 'articles', slug, 'index.html')
    const result = checkArticleHtml(ruFilePath)
    if (result.exists && !result.ok) {
      emptyBodySlugs.push(`${slug} (${result.error})`)
    }
  }

  if (emptyBodySlugs.length > 0) {
    hasErrors = true
    console.log(`   ❌ RU articles with empty/short body (${emptyBodySlugs.length}): ${emptyBodySlugs.slice(0, 3).join(', ')}`)
  } else {
    console.log(`   ✅ No RU articles with empty body detected in first 50 checked`)
  }

  console.log('\n' + '='.repeat(60))

  if (hasErrors) {
    console.log('\n❌ VERIFICATION FAILED')
    process.exit(1)
  } else {
    console.log('\n✅ ALL CHECKS PASSED')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error(`❌ Verification error: ${err.message}`)
  process.exit(1)
})