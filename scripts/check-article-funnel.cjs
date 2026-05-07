const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')

const targets = [
  {
    language: 'ru',
    slug: 'generator-adresata-kak-pravilno-ukazat-adresata',
    expectedToolSlug: 'generator-adresata',
  },
  {
    language: 'en',
    slug: 'how-to-write-addressee-in-business-letter',
    expectedToolSlug: 'generator-adresata',
  },
  {
    language: 'ru',
    slug: 'kak-vydelit-nds-iz-summy-i-nachislit-sverhu',
    expectedToolSlug: 'vat-calculator',
  },
  {
    language: 'en',
    slug: 'extract-vat-and-add-vat-without-mistakes',
    expectedToolSlug: 'vat-calculator',
  },
]

const failures = []

function fail(message) {
  failures.push(message)
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function readArticleHtml(language, slug) {
  const filePath = path.join(distDir, language, 'articles', slug, 'index.html')

  if (!fs.existsSync(filePath)) {
    fail(`Missing prerendered article HTML: ${path.relative(rootDir, filePath)}`)
    return { filePath, html: '' }
  }

  return {
    filePath,
    html: fs.readFileSync(filePath, 'utf8'),
  }
}

function extractInlineJson(html, scriptId, filePath) {
  const pattern = new RegExp(`<script[^>]*id=["']${escapeRegExp(scriptId)}["'][^>]*>([\\s\\S]*?)<\\/script>`)
  const match = html.match(pattern)

  if (!match) {
    fail(`Missing ${scriptId} in ${path.relative(rootDir, filePath)}`)
    return null
  }

  try {
    return JSON.parse(match[1])
  } catch (error) {
    fail(`Invalid ${scriptId} JSON in ${path.relative(rootDir, filePath)}: ${error.message}`)
    return null
  }
}

function getRelatedBlock(html) {
  const start = html.indexOf('<aside class="article-related"')
  if (start === -1) {
    return ''
  }

  const end = html.indexOf('</aside>', start)
  return end === -1 ? html.slice(start) : html.slice(start, end + '</aside>'.length)
}

function getVisibleArticleHtml(html) {
  const dataIndex = html.indexOf('id="__ARTICLE_DETAIL_DATA__"')
  return dataIndex === -1 ? html : html.slice(0, dataIndex)
}

function getToolSlug(article = {}) {
  return article.toolSlug || article.tool_slug || ''
}

function articleMatchesLanguage(article = {}, language) {
  return article.language === language || article.lang === language
}

function assertArticleShell(html, language, slug, filePath) {
  const detailDataIndex = html.indexOf('id="__ARTICLE_DETAIL_DATA__"')
  const markdownIndex = html.indexOf('class="article-markdown"')

  if (markdownIndex === -1) {
    fail(`Missing article-markdown in ${path.relative(rootDir, filePath)}`)
  }

  if (detailDataIndex === -1) {
    fail(`Missing __ARTICLE_DETAIL_DATA__ marker in ${path.relative(rootDir, filePath)}`)
  }

  if (markdownIndex !== -1 && detailDataIndex !== -1 && markdownIndex > detailDataIndex) {
    fail(`article-markdown appears after __ARTICLE_DETAIL_DATA__ in ${language}/${slug}`)
  }

  const visibleHtml = getVisibleArticleHtml(html)
  const rawPatterns = [
    { label: 'undefined', pattern: /\bundefined\b/i },
    { label: 'visible null text', pattern: />\s*null\s*</i },
    { label: 'raw articles i18n key', pattern: /\barticles\.[a-z0-9_.-]+/i },
    { label: 'raw article funnel key', pattern: /\barticleFunnel\.[a-z0-9_.-]+/i },
  ]

  rawPatterns.forEach(({ label, pattern }) => {
    if (pattern.test(visibleHtml)) {
      fail(`Found ${label} in visible article HTML: ${language}/${slug}`)
    }
  })
}

function assertToolCta(html, language, slug, toolSlug) {
  const expectedHref = `/${language}/${toolSlug}/`
  const noSlashHref = new RegExp(`href="${escapeRegExp(`/${language}/${toolSlug}`)}(?=["?#])`)

  if (!html.includes('class="article-tool-cta"')) {
    fail(`Missing article-tool-cta for ${language}/${slug}`)
  }

  if (!html.includes(`href="${expectedHref}"`)) {
    fail(`Missing CTA href ${expectedHref} for ${language}/${slug}`)
  }

  if (noSlashHref.test(html)) {
    fail(`Found no-slash CTA href for ${language}/${slug}`)
  }
}

function assertRelatedBlock(html, article, indexItems, language, slug) {
  const toolSlug = getToolSlug(article)
  const expectedRelated = indexItems.filter((item) => {
    if (!item || !articleMatchesLanguage(item, language)) {
      return false
    }

    return item.slug !== slug && getToolSlug(item) === toolSlug
  })
  const relatedBlock = getRelatedBlock(html)

  if (expectedRelated.length > 0 && !relatedBlock) {
    fail(`Missing related block for ${language}/${slug}`)
    return
  }

  if (!relatedBlock) {
    return
  }

  const currentArticleHref = `/${language}/articles/${slug}/`
  const otherLanguage = language === 'ru' ? 'en' : 'ru'

  if (relatedBlock.includes(currentArticleHref)) {
    fail(`Related block links to current article: ${language}/${slug}`)
  }

  if (relatedBlock.includes(`/${otherLanguage}/articles/`)) {
    fail(`Related block mixes article languages: ${language}/${slug}`)
  }

  const hrefMatches = [...relatedBlock.matchAll(/href="([^"]+)"/g)].map((match) => match[1])
  hrefMatches.forEach((href) => {
    if (href.startsWith(`/${language}/articles/`) && !href.endsWith('/')) {
      fail(`Related article href is missing trailing slash in ${language}/${slug}: ${href}`)
    }
  })
}

targets.forEach(({ language, slug, expectedToolSlug }) => {
  const { filePath, html } = readArticleHtml(language, slug)
  if (!html) {
    return
  }

  const article = extractInlineJson(html, '__ARTICLE_DETAIL_DATA__', filePath)
  const indexPayload = extractInlineJson(html, '__ARTICLES_INDEX_DATA__', filePath)
  const indexItems = Array.isArray(indexPayload?.items) ? indexPayload.items : []
  const toolSlug = getToolSlug(article)

  assertArticleShell(html, language, slug, filePath)

  if (toolSlug) {
    if (toolSlug !== expectedToolSlug) {
      fail(`Unexpected toolSlug for ${language}/${slug}: expected ${expectedToolSlug}, got ${toolSlug}`)
    }

    assertToolCta(html, language, slug, toolSlug)
    assertRelatedBlock(html, article, indexItems, language, slug)
  }
})

if (failures.length > 0) {
  console.error('Article funnel checks failed:')
  failures.forEach((message) => console.error(`- ${message}`))
  process.exit(1)
}

console.log(`Article funnel checks passed for ${targets.length} prerendered article pages.`)
