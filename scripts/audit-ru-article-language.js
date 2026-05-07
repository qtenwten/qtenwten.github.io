import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const apiBaseUrl = process.env.ARTICLE_API_BASE_URL || 'https://fancy-scene-deeb.qten.workers.dev'
const siteBaseUrl = 'https://qsen.ru'
const reportPath = path.join(repoRoot, 'reports', 'ru-article-language-audit.json')
const repairPlanPath = path.join(repoRoot, 'BD', 'content-staging', 'repairs', 'ru-language-cleanup-2026-05-07.json')
const requestTimeoutMs = 20000
const pageSize = 50

const args = new Set(process.argv.slice(2))
const strictMode = args.has('--strict')

const allowedTokens = new Set([
  'qsen', 'google', 'github', 'cloudflare', 'd1', 'worker', 'workers', 'vite', 'react', 'obs', 'imdb',
  'qr', 'url', 'seo', 'api', 'html', 'css', 'javascript', 'json', 'markdown', 'pages', 'h1', 'h2',
  'cta', 'faq', 'vat', 'en', 'ru', 'utm', 'wpa', 'wpa2', 'wpa3', 'wi-fi', 'wi', 'fi', 'ppc',
  'metal', 'gear', 'solid', 'dark', 'souls', 'png', 'svg', 'pdf', 'csv', 'txt', 'sms', 'email',
  'wifi', 'web', 'https', 'http', 'www', 'id', 'ui', 'ux', 'crm', 'saas',
])

const knownBadPhrases = [
  {
    phrase: 'пассивное watching',
    replacement: 'пассивный просмотр',
    type: 'known-bad-english',
  },
  {
    phrase: 'есть stakes',
    replacement: 'есть азарт',
    type: 'known-bad-english',
  },
  {
    phrase: 'чувство ownership',
    replacement: 'чувство причастности',
    type: 'known-bad-english',
  },
  {
    phrase: 'для shorts и тизеров',
    replacement: 'для коротких роликов и тизеров',
    type: 'known-bad-english',
  },
  {
    phrase: 'уменьшает need в PPC',
    replacement: 'уменьшает потребность в PPC',
    type: 'known-bad-english',
  },
  {
    phrase: 'уменьшают need в PPC',
    replacement: 'уменьшают потребность в PPC',
    type: 'known-bad-english',
  },
  {
    phrase: 'после major изменений',
    replacement: 'после крупных изменений',
    type: 'known-bad-english',
  },
  {
    phrase: 'принимаете result как есть',
    replacement: 'принимаете результат как есть',
    type: 'known-bad-english',
  },
  {
    phrase: 'получает result как есть',
    replacement: 'принимает результат как есть',
    type: 'known-bad-english',
  },
  {
    phrase: 'на屏幕上',
    replacement: 'на экране',
    type: 'mixed-chinese',
  },
  {
    phrase: 'это指尖无意中',
    replacement: 'исправить на нормальный русский текст по смыслу',
    type: 'mixed-chinese',
    autoFix: false,
  },
  {
    phrase: 'это指尖无意中 смещён в сторону',
    replacement: 'это выбор, невольно смещённый в сторону',
    type: 'mixed-chinese',
  },
  {
    phrase: '同样的 механизм',
    replacement: 'тот же механизм',
    type: 'mixed-chinese',
  },
  {
    phrase: 'Можно ли использовать для美元的?',
    replacement: 'Можно ли использовать для долларов?',
    type: 'mixed-chinese',
  },
]

const suspiciousEnglishWords = new Map([
  ['watching', 'просмотр'],
  ['stakes', 'азарт'],
  ['ownership', 'причастность'],
  ['need', 'потребность'],
  ['major', 'крупный'],
  ['result', 'результат'],
  ['screen', 'экран'],
  ['shorts', 'короткие ролики'],
  ['supplier', 'поставщик'],
  ['company', 'компания'],
])

function fetchJson(url) {
  return fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(requestTimeoutMs),
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`)
    }
    return response.json()
  })
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { Accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(requestTimeoutMs),
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }
  return response.text()
}

function normalizeArticle(item = {}) {
  return {
    id: item.id,
    language: item.language,
    translationKey: item.translationKey || item.translation_key || '',
    toolSlug: item.toolSlug || item.tool_slug || '',
    slug: item.slug || '',
    title: item.title || '',
    excerpt: item.excerpt || '',
    content: item.content || '',
    status: item.status || 'published',
    author: item.author || '',
    seoTitle: item.seoTitle || item.seo_title || '',
    seoDescription: item.seoDescription || item.seo_description || '',
  }
}

async function fetchArticlesFromApi() {
  const indexItems = []
  let offset = 0
  let total = null

  while (total === null || offset < total) {
    const data = await fetchJson(`${apiBaseUrl}/articles?limit=${pageSize}&offset=${offset}`)
    const pageItems = Array.isArray(data?.articles) ? data.articles : Array.isArray(data) ? data : []
    indexItems.push(...pageItems.map(normalizeArticle))
    total = Number.isFinite(Number(data?.total)) ? Number(data.total) : indexItems.length

    if (pageItems.length === 0 || pageItems.length < pageSize) {
      break
    }
    offset += pageItems.length
  }

  const ruIndexItems = indexItems.filter((article) => article.language === 'ru')
  const details = []
  for (const item of ruIndexItems) {
    const detail = await fetchJson(`${apiBaseUrl}/articles/${encodeURIComponent(item.slug)}`)
    details.push(normalizeArticle({ ...item, ...detail }))
  }

  return details
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

async function fetchArticlesFromProductionHtml() {
  const sitemap = await fetchText(`${siteBaseUrl}/sitemap.xml`)
  const urls = [...sitemap.matchAll(/<loc>(https:\/\/qsen\.ru\/ru\/articles\/[^<]+)<\/loc>/g)].map((match) => match[1])
  const articles = []

  for (const url of urls) {
    const html = await fetchText(url)
    const detailMatch = html.match(/<script id="__ARTICLE_DETAIL_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
    if (!detailMatch) continue
    try {
      articles.push(normalizeArticle(JSON.parse(detailMatch[1])))
    } catch {
      const slug = url.replace(/\/$/, '').split('/').pop()
      articles.push(normalizeArticle({
        language: 'ru',
        slug,
        title: decodeHtmlEntities(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] || ''),
        content: decodeHtmlEntities(html.replace(/<[^>]+>/g, ' ')),
      }))
    }
  }

  return articles
}

function readLocalArticleJsonFiles() {
  const roots = [
    path.join(repoRoot, 'BD', 'content-staging'),
    path.join(repoRoot, 'BD', 'repairs'),
  ]
  const articles = []

  function walk(dir) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(entryPath)
        continue
      }
      if (!entry.name.endsWith('.json')) continue

      try {
        const parsed = JSON.parse(fs.readFileSync(entryPath, 'utf8'))
        const candidates = Array.isArray(parsed) ? parsed : Array.isArray(parsed.articles) ? parsed.articles : [parsed]
        for (const candidate of candidates) {
          const article = normalizeArticle(candidate)
          if (article.language === 'ru' && article.slug) {
            articles.push({ ...article, sourceFile: entryPath })
          }
        }
      } catch {
        // Ignore malformed local drafts here; verify:article-json owns JSON validity.
      }
    }
  }

  for (const root of roots) walk(root)
  return articles
}

function getFieldEntries(article) {
  return [
    ['title', article.title],
    ['excerpt', article.excerpt],
    ['content', article.content],
    ['seoTitle', article.seoTitle],
    ['seoDescription', article.seoDescription],
  ].filter(([, value]) => typeof value === 'string' && value.length > 0)
}

function snippetAround(text, index, length) {
  const start = Math.max(0, index - 55)
  const end = Math.min(text.length, index + length + 55)
  return text.slice(start, end).replace(/\s+/g, ' ').trim()
}

function maskAllowedRegions(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\[[^\]]*\]\([^)]+\)/g, (match) => {
      const label = match.match(/^\[([^\]]*)\]/)?.[1] || ''
      return label
    })
    .replace(/<[^>]+>/g, ' ')
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function addIssue(issues, article, field, fragment, type, recommendedReplacement, confidence, index = 0, autoFix = false) {
  issues.push({
    id: article.id || null,
    slug: article.slug,
    url: `${siteBaseUrl}/ru/articles/${article.slug}/`,
    field,
    fragment,
    type,
    recommendedReplacement,
    confidence,
    autoFix,
    index,
  })
}

function auditField(article, field, value) {
  const issues = []
  const text = value || ''

  for (const match of text.matchAll(/[\u3400-\u9FFF]+/g)) {
    addIssue(issues, article, field, snippetAround(text, match.index, match[0].length), 'chinese-characters', 'Заменить на русский текст по смыслу', 'high', match.index)
  }

  const mojibakePattern = /\?{3,}|Ð|Ñ|Рџ|\uFFFD/g
  for (const match of text.matchAll(mojibakePattern)) {
    addIssue(issues, article, field, snippetAround(text, match.index, match[0].length), 'mojibake-or-replacement-char', 'Восстановить корректный UTF-8 текст', 'high', match.index)
  }

  for (const item of knownBadPhrases) {
    let index = text.indexOf(item.phrase)
    while (index !== -1) {
      addIssue(issues, article, field, snippetAround(text, index, item.phrase.length), item.type, item.replacement, 'high', index, item.autoFix !== false)
      index = text.indexOf(item.phrase, index + item.phrase.length)
    }
  }

  const maskedText = maskAllowedRegions(text)
  for (const sentence of splitSentences(maskedText)) {
    if (!/[А-Яа-яЁё]/.test(sentence)) continue

    const tokenMatches = [...sentence.matchAll(/\b[A-Za-z][A-Za-z-]{2,}\b/g)]
    for (const match of tokenMatches) {
      const token = match[0]
      const normalized = token.toLowerCase()
      if (allowedTokens.has(normalized)) continue
      if (/^[A-Z]{2,}$/.test(token)) continue

      if (suspiciousEnglishWords.has(normalized)) {
        addIssue(issues, article, field, sentence, 'suspicious-english-word', suspiciousEnglishWords.get(normalized), 'medium')
        continue
      }

      if (normalized.length >= 7) {
        addIssue(issues, article, field, sentence, 'long-latin-word-in-ru-text', 'Проверить вручную или заменить русским словом', 'low')
      }
    }
  }

  return issues
}

function dedupeIssues(issues) {
  const seen = new Set()
  return issues.filter((issue) => {
    const key = [issue.slug, issue.field, issue.type, issue.fragment, issue.recommendedReplacement].join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function auditArticle(article) {
  const issues = []
  for (const [field, value] of getFieldEntries(article)) {
    issues.push(...auditField(article, field, value))
  }
  return dedupeIssues(issues)
}

function hasStrictTextDamage(value = '') {
  return /[\u3400-\u9FFF]|\?{3,}|Ð|Ñ|Рџ|\uFFFD/.test(value)
}

function buildRepairPlan(articles, issues, localArticles = []) {
  const highAutoFixes = issues.filter((issue) => issue.confidence === 'high' && issue.autoFix)
  const bySlug = new Map(articles.map((article) => [article.slug, article]))
  const localBySlug = new Map(localArticles.map((article) => [article.slug, article]))

  const replacements = highAutoFixes.map((issue) => {
    const article = bySlug.get(issue.slug)
    return {
      mode: 'replace',
      id: issue.id,
      slug: issue.slug,
      url: issue.url,
      field: issue.field,
      oldFragment: issue.fragment,
      find: knownBadPhrases.find((item) => item.autoFix !== false && item.replacement === issue.recommendedReplacement && issue.fragment.includes(item.phrase))?.phrase || '',
      replace: issue.recommendedReplacement,
      currentTitle: article?.title || '',
      confidence: issue.confidence,
    }
  }).filter((item) => item.find)

  const restoredFields = []
  const restoreKeys = new Set()
  for (const issue of issues) {
    if (issue.confidence !== 'high' || issue.type !== 'mojibake-or-replacement-char') continue
    const localArticle = localBySlug.get(issue.slug)
    if (!localArticle) continue
    const localValue = localArticle[issue.field]
    if (typeof localValue !== 'string' || localValue.length === 0 || hasStrictTextDamage(localValue)) continue

    const key = `${issue.slug}:${issue.field}`
    if (restoreKeys.has(key)) continue
    restoreKeys.add(key)

    restoredFields.push({
      mode: 'set-field',
      id: issue.id,
      slug: issue.slug,
      url: issue.url,
      field: issue.field,
      oldFragment: issue.fragment,
      newFragment: localValue.slice(0, 160).replace(/\s+/g, ' ').trim(),
      value: localValue,
      sourceFile: localArticle.sourceFile ? path.relative(repoRoot, localArticle.sourceFile) : '',
      currentTitle: bySlug.get(issue.slug)?.title || '',
      confidence: issue.confidence,
    })
  }

  return [...replacements, ...restoredFields]
}

function sanitizeRepairForReport(repair) {
  if (repair.mode !== 'set-field') return repair

  const { value, ...safeRepair } = repair
  return {
    ...safeRepair,
    valueLength: typeof value === 'string' ? value.length : 0,
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

async function loadArticles() {
  try {
    const apiArticles = await fetchArticlesFromApi()
    return { source: 'worker-api', articles: apiArticles }
  } catch (apiError) {
    console.warn(`Worker API unavailable for language audit: ${apiError.message}`)
  }

  try {
    const productionArticles = await fetchArticlesFromProductionHtml()
    if (productionArticles.length > 0) {
      return { source: 'production-html', articles: productionArticles }
    }
  } catch (productionError) {
    console.warn(`Production HTML fallback unavailable: ${productionError.message}`)
  }

  const localArticles = readLocalArticleJsonFiles()
  return { source: 'local-json', articles: localArticles }
}

async function main() {
  const { source, articles } = await loadArticles()
  const ruArticles = articles.filter((article) => article.language === 'ru')
  const localArticles = readLocalArticleJsonFiles()
  const articleReports = []
  const allIssues = []

  for (const article of ruArticles) {
    const issues = auditArticle(article)
    articleReports.push({
      id: article.id || null,
      slug: article.slug,
      url: `${siteBaseUrl}/ru/articles/${article.slug}/`,
      title: article.title,
      issueCount: issues.length,
      issues,
    })
    allIssues.push(...issues)
  }

  const highIssues = allIssues.filter((issue) => issue.confidence === 'high')
  const mediumIssues = allIssues.filter((issue) => issue.confidence === 'medium')
  const lowIssues = allIssues.filter((issue) => issue.confidence === 'low')
  const repairPlan = buildRepairPlan(ruArticles, allIssues, localArticles)

  const report = {
    generatedAt: new Date().toISOString(),
    source,
    strictMode,
    totals: {
      ruArticles: ruArticles.length,
      issues: allIssues.length,
      high: highIssues.length,
      medium: mediumIssues.length,
      low: lowIssues.length,
      autoFixes: repairPlan.length,
    },
    articles: articleReports,
    issues: allIssues,
    repairPlan: repairPlan.map(sanitizeRepairForReport),
  }

  writeJson(reportPath, report)
  if (repairPlan.length > 0) {
    writeJson(repairPlanPath, {
      generatedAt: report.generatedAt,
      source,
      note: 'Prepared repair plan only. Do not patch D1 without explicit user confirmation.',
      repairs: repairPlan,
    })
  }

  console.log('RU article language audit')
  console.log(`Source: ${source}`)
  console.log(`RU articles checked: ${ruArticles.length}`)
  console.log(`Issues: ${allIssues.length} (high=${highIssues.length}, medium=${mediumIssues.length}, low=${lowIssues.length})`)
  console.log(`Report: ${path.relative(repoRoot, reportPath)}`)
  if (repairPlan.length > 0) {
    console.log(`Repair plan: ${path.relative(repoRoot, repairPlanPath)}`)
  }

  for (const issue of allIssues) {
    console.log(`${issue.confidence.toUpperCase()} ${issue.slug} [${issue.field}] ${issue.type}: ${issue.fragment}`)
    console.log(`  recommendation: ${issue.recommendedReplacement}`)
  }

  if (strictMode && highIssues.length > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(`RU language audit failed: ${err.message}`)
  process.exit(1)
})
