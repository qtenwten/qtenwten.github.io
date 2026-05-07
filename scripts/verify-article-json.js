import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const contentStagingPath = path.resolve(__dirname, '../BD/content-staging')

const REQUIRED_FIELDS = [
  'language',
  'translation_key',
  'slug',
  'title',
  'excerpt',
  'content',
  'status',
  'author',
  'seo_title',
  'seo_description',
]

const EXCLUDED_PATTERNS = [
  /fix-/,
  /repair-/,
  /^qsen-tool-articles/,
  /\.ps1$/,
  /\.sh$/,
  /\.md$/,
]

function shouldExclude(filename) {
  return EXCLUDED_PATTERNS.some((p) => p.test(filename))
}

function getJsonFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.json')) {
      if (!shouldExclude(entry.name)) {
        files.push(path.join(dir, entry.name))
      }
    }
  }
  return files.sort()
}

function parseJsonFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  try {
    return JSON.parse(content)
  } catch (e) {
    return null
  }
}

function validateArticle(article, filename) {
  const issues = []

  if (typeof article !== 'object' || article === null) {
    issues.push({ file: filename, level: 'error', message: 'Not a valid object' })
    return issues
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in article)) {
      issues.push({ file: filename, level: 'error', message: `Missing required field: ${field}` })
    }
  }

  if (article.language && !['ru', 'en'].includes(article.language)) {
    issues.push({
      file: filename,
      level: 'error',
      message: `Invalid language "${article.language}" — must be "ru" or "en"`,
    })
  }

  if (article.slug && typeof article.slug !== 'string') {
    issues.push({ file: filename, level: 'error', message: 'slug must be a string' })
  }

  if (article.translation_key && typeof article.translation_key !== 'string') {
    issues.push({ file: filename, level: 'error', message: 'translation_key must be a string' })
  }

  if (article.status && !['published', 'draft', 'archived'].includes(article.status)) {
    issues.push({
      file: filename,
      level: 'error',
      message: `Invalid status "${article.status}"`,
    })
  }

  if (article.cover_image !== null && article.cover_image !== undefined) {
    issues.push({ file: filename, level: 'warning', message: 'cover_image is set (not null) — confirm this is intentional' })
  }

  if (article.content) {
    if (typeof article.content !== 'string') {
      issues.push({ file: filename, level: 'error', message: 'content must be a string' })
    } else {
      const tableCount = (article.content.match(/^\|.*\|$/gm) || []).length
      if (tableCount > 0) {
        issues.push({
          file: filename,
          level: 'info',
          message: `Content contains markdown table syntax (${tableCount} table rows detected) — renderer supports tables`,
        })
      }

      if (article.content.includes('---') || article.content.includes('***') || article.content.includes('___')) {
        issues.push({
          file: filename,
          level: 'info',
          message: 'Content contains horizontal rule syntax --- — renderer supports dividers',
        })
      }
    }
  }

  if (article.content && article.language === 'en' && article.content.includes('qsen.ru/en/')) {
    issues.push({ file: filename, level: 'warning', message: 'EN article content contains absolute qsen.ru/en/ URL' })
  }

  if (article.content && article.language === 'ru' && article.content.includes('qsen.ru/ru/')) {
    issues.push({ file: filename, level: 'warning', message: 'RU article content contains absolute qsen.ru/ru/ URL' })
  }

  if (article.content && article.language === 'en' && article.content.includes('/ru/')) {
    issues.push({ file: filename, level: 'warning', message: 'EN article content contains /ru/ internal link' })
  }

  if (article.content && article.language === 'ru' && article.content.includes('/en/')) {
    issues.push({ file: filename, level: 'warning', message: 'RU article content contains /en/ internal link' })
  }

  if (article.content && article.language === 'en' && !article.content.includes('/en/') && article.content.includes('/')) {
    const lines = article.content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const mdLinkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (mdLinkMatch) {
        const href = mdLinkMatch[2]
        if (href.startsWith('/') && !href.startsWith('/en/') && !href.startsWith('/en$') && !href.match(/^\/en\/[a-z0-9-]/)) {
          const isValidLangLink = href === '/' || href.startsWith('/en/') || href.startsWith('/en?')
          if (!isValidLangLink) {
            issues.push({
              file: filename,
              level: 'warning',
              message: `EN article line ${i + 1}: link "${href}" does not use /en/ prefix`,
            })
          }
        }
      }
    }
  }

  if (article.content && article.language === 'ru' && !article.content.includes('/ru/') && article.content.includes('/')) {
    const lines = article.content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const mdLinkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (mdLinkMatch) {
        const href = mdLinkMatch[2]
        if (href.startsWith('/') && !href.startsWith('/ru/') && !href.startsWith('/ru$') && !href.match(/^\/ru\/[a-z0-9-]/)) {
          const isValidLangLink = href === '/' || href.startsWith('/ru/') || href.startsWith('/ru?')
          if (!isValidLangLink) {
            issues.push({
              file: filename,
              level: 'warning',
              message: `RU article line ${i + 1}: link "${href}" does not use /ru/ prefix`,
            })
          }
        }
      }
    }
  }

  if (article.content && article.content.includes('[Открыть') && article.content.includes('https://qsen.ru')) {
    issues.push({
      file: filename,
      level: 'warning',
      message: 'Content contains absolute https://qsen.ru URL in CTA link — use relative path instead',
    })
  }

  if (article.content && article.content.includes('[Перевести') && article.content.includes('https://qsen.ru')) {
    issues.push({
      file: filename,
      level: 'warning',
      message: 'Content contains absolute https://qsen.ru URL in CTA link — use relative path instead',
    })
  }

  if (article.content && article.content.includes('[Калькулятор') && article.content.includes('https://qsen.ru')) {
    issues.push({
      file: filename,
      level: 'warning',
      message: 'Content contains absolute https://qsen.ru URL in CTA link — use relative path instead',
    })
  }

  return issues
}

function main() {
  const files = getJsonFiles(contentStagingPath)

  if (files.length === 0) {
    console.log('No article JSON files found in BD/content-staging/')
    return
  }

  console.log(`Scanning ${files.length} article files in BD/content-staging/...\n`)

  const allIssues = []
  const articles = []

  for (const filePath of files) {
    const filename = path.basename(filePath)
    const article = parseJsonFile(filePath)

    if (!article) {
      allIssues.push({ file: filename, level: 'error', message: 'Failed to parse JSON' })
      continue
    }

    const issues = validateArticle(article, filename)
    allIssues.push(...issues)
    articles.push({ filename, article })
  }

  const slugMap = new Map()
  const translationKeyMap = new Map()

  for (const { filename, article } of articles) {
    if (article.slug) {
      if (slugMap.has(article.slug)) {
        slugMap.get(article.slug).push(filename)
      } else {
        slugMap.set(article.slug, [filename])
      }
    }

    if (article.translation_key) {
      const key = `${article.translation_key}:${article.language}`
      if (translationKeyMap.has(key)) {
        translationKeyMap.get(key).push(filename)
      } else {
        translationKeyMap.set(key, [filename])
      }
    }
  }

  for (const [slug, filenames] of slugMap.entries()) {
    if (filenames.length > 1) {
      allIssues.push({
        file: filenames.join(', '),
        level: 'error',
        message: `Duplicate slug "${slug}" across files: ${filenames.join(', ')}`,
      })
    }
  }

  for (const [key, filenames] of translationKeyMap.entries()) {
    if (filenames.length > 1) {
      allIssues.push({
        file: filenames.join(', '),
        level: 'error',
        message: `Duplicate language+translation_key "${key}" across files: ${filenames.join(', ')}`,
      })
    }
  }

  const errors = allIssues.filter((i) => i.level === 'error')
  const warnings = allIssues.filter((i) => i.level === 'warning')
  const infos = allIssues.filter((i) => i.level === 'info')

  if (errors.length > 0) {
    console.log(`\nERRORS (${errors.length}):`)
    for (const issue of errors) {
      console.log(`  [${issue.level.toUpperCase()}] ${issue.file}: ${issue.message}`)
    }
  }

  if (warnings.length > 0) {
    console.log(`\nWARNINGS (${warnings.length}):`)
    for (const issue of warnings) {
      console.log(`  [${issue.level.toUpperCase()}] ${issue.file}: ${issue.message}`)
    }
  }

  if (infos.length > 0) {
    console.log(`\nINFO (${infos.length}):`)
    for (const issue of infos) {
      console.log(`  [${issue.level.toUpperCase()}] ${issue.file}: ${issue.message}`)
    }
  }

  console.log(`\n---`)
  console.log(`Total files scanned: ${files.length}`)
  console.log(`Total articles: ${articles.length}`)
  console.log(`Errors: ${errors.length}`)
  console.log(`Warnings: ${warnings.length}`)
  console.log(`Info: ${infos.length}`)

  if (errors.length > 0) {
    console.log('\nRESULT: FAIL — errors must be fixed')
    process.exit(1)
  } else {
    console.log('\nRESULT: PASS')
    process.exit(0)
  }
}

main()
