import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const defaultEnvFile = path.join(repoRoot, 'BD/article-publisher.env')
const defaultPublicBaseUrl = 'https://qsen.ru'

const requiredFields = [
  'language',
  'translation_key',
  'tool_slug',
  'slug',
  'title',
  'excerpt',
  'content',
  'status',
  'author',
  'cover_image',
  'seo_title',
  'seo_description',
]

function parseArgs(argv) {
  const options = {
    dir: '',
    publish: false,
    envFile: defaultEnvFile,
    expectRu: 3,
    expectEn: 3,
    publicBaseUrl: defaultPublicBaseUrl,
    skipRemoteDuplicateCheck: false,
    skipExisting: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--dir') {
      options.dir = argv[i + 1] || ''
      i += 1
    } else if (arg === '--env-file') {
      options.envFile = path.resolve(repoRoot, argv[i + 1] || '')
      i += 1
    } else if (arg === '--publish') {
      options.publish = true
    } else if (arg === '--dry-run') {
      options.publish = false
    } else if (arg === '--expect-ru') {
      options.expectRu = Number(argv[i + 1])
      i += 1
    } else if (arg === '--expect-en') {
      options.expectEn = Number(argv[i + 1])
      i += 1
    } else if (arg === '--public-base-url') {
      options.publicBaseUrl = (argv[i + 1] || '').replace(/\/+$/, '')
      i += 1
    } else if (arg === '--skip-remote-duplicate-check') {
      options.skipRemoteDuplicateCheck = true
    } else if (arg === '--skip-existing') {
      options.skipExisting = true
    } else if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (!options.dir) {
    throw new Error('Missing required --dir <batch-directory>')
  }

  if (!Number.isFinite(options.expectRu) || !Number.isFinite(options.expectEn)) {
    throw new Error('--expect-ru and --expect-en must be numbers')
  }

  options.dir = path.resolve(repoRoot, options.dir)
  return options
}

function printUsage() {
  console.log(`
Usage:
  node scripts/article-agent/publish-daily-batch.mjs --dir BD/content-staging/daily-YYYY-MM-DD --dry-run
  node scripts/article-agent/publish-daily-batch.mjs --dir BD/content-staging/daily-YYYY-MM-DD --publish

Options:
  --dir <path>                      Directory with exactly 3 RU + 3 EN JSON files
  --publish                         POST articles to Worker admin API
  --dry-run                         Validate only (default)
  --env-file <path>                 Optional env file, defaults to BD/article-publisher.env
  --skip-remote-duplicate-check     Skip public API duplicate scan
  --skip-existing                   Treat already-published identical articles as success
`)
}

function loadEnvFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue

    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim()
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function readBatch(dir) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error(`Batch directory not found: ${dir}`)
  }

  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => {
      const filePath = path.join(dir, name)
      const raw = fs.readFileSync(filePath, 'utf8')
      let article
      try {
        article = JSON.parse(raw)
      } catch (err) {
        throw new Error(`${name}: invalid JSON (${err.message})`)
      }
      return { name, filePath, raw, article }
    })
}

function hasMojibake(value) {
  return /\?\?\?|�|Рџ|Рќ|Рњ|Рґ|Рё|Р°|СЃ|С‚|СЊ|СЏ|С‹|С‡|С‰|С†|СЋ|СЌ|СЂ/.test(value)
}

function getMarkdownLinks(content) {
  return [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1])
}

function validateBatch(files, options) {
  const issues = []
  const expectedTotal = options.expectRu + options.expectEn

  if (files.length !== expectedTotal) {
    issues.push(`Expected ${expectedTotal} JSON files, got ${files.length}`)
  }

  const counts = { ru: 0, en: 0 }
  const slugs = new Map()
  const byTranslationKey = new Map()

  for (const file of files) {
    const { name, article } = file

    if (!article || typeof article !== 'object' || Array.isArray(article)) {
      issues.push(`${name}: article must be a JSON object`)
      continue
    }

    for (const field of requiredFields) {
      if (!(field in article)) {
        issues.push(`${name}: missing required field "${field}"`)
      }
    }

    if (!['ru', 'en'].includes(article.language)) {
      issues.push(`${name}: language must be "ru" or "en"`)
    } else {
      counts[article.language] += 1
    }

    if (article.status !== 'published') {
      issues.push(`${name}: status must be "published" for daily auto-publication`)
    }

    for (const field of ['translation_key', 'tool_slug', 'slug', 'title', 'excerpt', 'content', 'author', 'seo_title', 'seo_description']) {
      if (typeof article[field] !== 'string' || !article[field].trim()) {
        issues.push(`${name}: field "${field}" must be a non-empty string`)
      }
    }

    if (typeof article.slug === 'string') {
      if (slugs.has(article.slug)) {
        issues.push(`${name}: duplicate slug in batch: ${article.slug}`)
      }
      slugs.set(article.slug, name)
    }

    if (typeof article.translation_key === 'string') {
      const list = byTranslationKey.get(article.translation_key) || []
      list.push({ name, article })
      byTranslationKey.set(article.translation_key, list)
    }

    if (typeof article.content === 'string') {
      if (!/^#\s+\S/m.test(article.content)) {
        issues.push(`${name}: content must contain an H1 heading`)
      }

      if (hasMojibake(article.content) || hasMojibake(article.title || '') || hasMojibake(article.excerpt || '')) {
        issues.push(`${name}: content looks like broken UTF-8/mojibake`)
      }

      const langPrefix = article.language === 'ru' ? '/ru/' : '/en/'
      const otherPrefix = article.language === 'ru' ? '/en/' : '/ru/'
      const links = getMarkdownLinks(article.content)
      const langLinks = links.filter((href) => href.startsWith(langPrefix))

      if (langLinks.length < 2) {
        issues.push(`${name}: expected at least two CTA/internal links with ${langPrefix}`)
      }

      if (links.some((href) => href.startsWith(otherPrefix))) {
        issues.push(`${name}: contains wrong-language internal link with ${otherPrefix}`)
      }

      if (article.language === 'ru') {
        const ruText = `${article.title}\n${article.excerpt}\n${article.content}`
        if (!/[А-Яа-яЁё]/.test(ruText)) {
          issues.push(`${name}: RU article does not appear to contain Cyrillic text`)
        }
      }
    }
  }

  if (counts.ru !== options.expectRu) {
    issues.push(`Expected ${options.expectRu} RU articles, got ${counts.ru}`)
  }

  if (counts.en !== options.expectEn) {
    issues.push(`Expected ${options.expectEn} EN articles, got ${counts.en}`)
  }

  if (byTranslationKey.size !== options.expectRu) {
    issues.push(`Expected ${options.expectRu} translation pairs, got ${byTranslationKey.size}`)
  }

  for (const [translationKey, pair] of byTranslationKey.entries()) {
    const langs = pair.map((item) => item.article.language).sort().join(',')
    if (pair.length !== 2 || langs !== 'en,ru') {
      issues.push(`translation_key "${translationKey}" must have exactly one RU and one EN article`)
    }

    const tools = new Set(pair.map((item) => item.article.tool_slug).filter(Boolean))
    if (tools.size > 1) {
      issues.push(`translation_key "${translationKey}" has mismatched tool_slug values`)
    }
  }

  return issues
}

async function requestJson(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    })
    const text = await response.text()
    let data = null
    if (text.trim()) {
      try {
        data = JSON.parse(text)
      } catch {
        data = { raw: text }
      }
    }
    if (!response.ok || data?.error) {
      const message = data?.error || data?.message || `HTTP ${response.status}`
      throw new Error(message)
    }
    return data
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchAllRemoteArticles(apiBase) {
  const articles = []
  let offset = 0
  const limit = 50
  let total = null

  while (total === null || offset < total) {
    const page = await requestJson(`${apiBase}/articles?limit=${limit}&offset=${offset}`)
    if (Array.isArray(page)) {
      return page
    }

    const pageItems = Array.isArray(page?.articles) ? page.articles : []
    articles.push(...pageItems)
    total = Number.isFinite(Number(page?.total)) ? Number(page.total) : articles.length

    if (pageItems.length === 0 || pageItems.length < limit) break
    offset += pageItems.length
  }

  return articles
}

function articleIdentityMatches(remoteArticle, article) {
  return remoteArticle
    && remoteArticle.slug === article.slug
    && remoteArticle.language === article.language
    && remoteArticle.translation_key === article.translation_key
    && remoteArticle.tool_slug === article.tool_slug
}

async function getRemoteDuplicateState(files, apiBase) {
  const issues = []
  const existingFiles = []
  const remote = await fetchAllRemoteArticles(apiBase)
  const remoteSlugs = new Map()
  const remoteTranslationLang = new Map()

  for (const article of remote) {
    if (article?.slug) remoteSlugs.set(article.slug, article)
    if (article?.translation_key && article?.language) {
      remoteTranslationLang.set(`${article.translation_key}:${article.language}`, article)
    }
  }

  for (const { name, article } of files) {
    const slugMatch = remoteSlugs.get(article.slug)
    const key = `${article.translation_key}:${article.language}`
    const keyMatch = remoteTranslationLang.get(key)

    if (!slugMatch && !keyMatch) {
      continue
    }

    const matches = [slugMatch, keyMatch].filter(Boolean)
    const identities = new Set(matches.map((item) => item.id || `${item.slug}:${item.language}:${item.translation_key}`))
    const isSameArticle = matches.every((item) => articleIdentityMatches(item, article)) && identities.size === 1

    if (isSameArticle) {
      existingFiles.push({ name, article, remoteArticle: matches[0] })
    } else {
      issues.push(`${name}: conflicts with existing Worker API record for slug or translation_key+language`)
    }
  }

  return { issues, existingFiles }
}

async function validatePublishedArticle(article, apiBase) {
  const checkResponse = await requestJson(`${apiBase}/articles/${encodeURIComponent(article.slug)}`)
  const checkIssues = []

  if (checkResponse.language !== article.language) checkIssues.push('language mismatch')
  if (checkResponse.translation_key !== article.translation_key) checkIssues.push('translation_key mismatch')
  if (checkResponse.tool_slug !== article.tool_slug) checkIssues.push('tool_slug mismatch')
  if (checkResponse.status !== 'published') checkIssues.push(`status is ${checkResponse.status || '(missing)'}`)

  if (checkIssues.length > 0) {
    throw new Error(`${article.slug}: public check failed: ${checkIssues.join(', ')}`)
  }

  return checkResponse
}

async function publishAndCheck(files, apiBase, token, existingFiles = []) {
  const results = []

  for (const file of existingFiles) {
    const checkResponse = await validatePublishedArticle(file.article, apiBase)
    results.push({
      action: 'skipped-existing',
      id: checkResponse?.id || file.remoteArticle?.id || null,
      language: file.article.language,
      translation_key: file.article.translation_key,
      tool_slug: file.article.tool_slug,
      slug: file.article.slug,
      title: file.article.title,
      status: checkResponse.status,
    })
  }

  for (const file of files) {
    const { article, raw } = file
    const publishResponse = await requestJson(`${apiBase}/admin/articles`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: raw,
    })

    const checkResponse = await validatePublishedArticle(article, apiBase)

    results.push({
      action: 'published',
      id: publishResponse?.id || checkResponse?.id || null,
      language: article.language,
      translation_key: article.translation_key,
      tool_slug: article.tool_slug,
      slug: article.slug,
      title: article.title,
      status: checkResponse.status,
    })
  }

  return results
}

function printBatchSummary(files, options) {
  console.log(`Batch directory: ${path.relative(repoRoot, options.dir)}`)
  console.log(`Mode: ${options.publish ? 'publish' : 'dry-run'}`)
  console.log(`Files: ${files.length}`)
  for (const { article } of files) {
    const publicUrl = `${options.publicBaseUrl}/${article.language}/articles/${article.slug}/`
    console.log(`- ${article.language} ${article.translation_key} ${article.slug} -> ${publicUrl}`)
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  loadEnvFile(options.envFile)

  const apiBase = (process.env.ARTICLE_API_BASE_URL || '').replace(/\/+$/, '')
  const token = process.env.ARTICLE_ADMIN_TOKEN || ''
  const files = readBatch(options.dir)
  let existingFiles = []

  printBatchSummary(files, options)

  const localIssues = validateBatch(files, options)
  if (localIssues.length > 0) {
    console.error('\nLOCAL VALIDATION FAILED')
    for (const issue of localIssues) console.error(`- ${issue}`)
    process.exit(1)
  }
  console.log('\nLocal validation: PASS')

  if (apiBase && !options.skipRemoteDuplicateCheck) {
    const remoteState = await getRemoteDuplicateState(files, apiBase)
    if (remoteState.issues.length > 0) {
      console.error('\nREMOTE DUPLICATE CHECK FAILED')
      for (const issue of remoteState.issues) console.error(`- ${issue}`)
      process.exit(1)
    }

    if (remoteState.existingFiles.length > 0) {
      if (!options.skipExisting) {
        console.error('\nREMOTE DUPLICATE CHECK FAILED')
        for (const file of remoteState.existingFiles) {
          console.error(`- ${file.name}: identical article already exists in Worker API: ${file.article.slug}`)
        }
        process.exit(1)
      }

      existingFiles = remoteState.existingFiles
      console.log(`Remote duplicate check: PASS (${existingFiles.length} identical existing articles will be skipped)`)
    } else {
      console.log('Remote duplicate check: PASS')
    }
  } else {
    console.log('Remote duplicate check: SKIPPED')
  }

  if (!options.publish) {
    console.log('\nDry run complete. Nothing was published.')
    return
  }

  if (!apiBase || !token) {
    throw new Error('ARTICLE_API_BASE_URL and ARTICLE_ADMIN_TOKEN are required for --publish')
  }

  const existingNames = new Set(existingFiles.map((file) => file.name))
  const filesToPublish = files.filter((file) => !existingNames.has(file.name))
  const results = await publishAndCheck(filesToPublish, apiBase, token, existingFiles)
  console.log('\nPublish/check results:')
  for (const result of results) {
    console.log(`- ${result.action} id=${result.id || '(unknown)'} ${result.language} ${result.translation_key} ${result.slug} status=${result.status}`)
  }

  console.log('\nRESULT: PASS')
}

main().catch((err) => {
  console.error(`\nRESULT: FAIL\n${err.message}`)
  process.exit(1)
})
