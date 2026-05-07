import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const reportPath = path.join(repoRoot, 'reports', 'ru-article-language-audit.json')
const repairPlanPath = path.join(repoRoot, 'BD', 'content-staging', 'repairs', 'ru-language-cleanup-2026-05-07.json')
const envPath = path.join(repoRoot, 'BD', 'article-publisher.env')
const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing env file: ${path.relative(repoRoot, filePath)}`)
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    if (!line.trim() || /^\s*#/.test(line)) continue
    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) continue
    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    if (key && !process.env[key]) {
      process.env[key] = value
    }
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json; charset=utf-8' } : {}),
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(20000),
  })

  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }

  return data
}

function normalizeArticle(item = {}) {
  return {
    id: item.id,
    slug: item.slug || '',
    language: item.language || '',
    title: item.title || '',
    content: item.content || '',
    excerpt: item.excerpt || '',
    seo_title: item.seo_title || item.seoTitle || '',
    seo_description: item.seo_description || item.seoDescription || '',
  }
}

function groupRepairs(repairs) {
  const grouped = new Map()
  for (const repair of repairs) {
    const key = `${repair.id || ''}:${repair.slug}`
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key).push(repair)
  }
  return grouped
}

function fieldToApiField(field) {
  if (field === 'seoTitle') return 'seo_title'
  if (field === 'seoDescription') return 'seo_description'
  return field
}

function preview(value = '') {
  return String(value).slice(0, 180).replace(/\s+/g, ' ').trim()
}

function assertSafeRuText(article) {
  const content = article.content || ''
  if (!/[А-Яа-яЁё]/.test(content)) {
    throw new Error(`${article.slug}: patched RU content has no Cyrillic`)
  }
  if (content.includes('???')) {
    throw new Error(`${article.slug}: patched RU content still contains ???`)
  }
}

function loadRepairs() {
  if (fs.existsSync(repairPlanPath)) {
    const payload = JSON.parse(fs.readFileSync(repairPlanPath, 'utf8'))
    return Array.isArray(payload.repairs) ? payload.repairs : []
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
  return Array.isArray(report.repairPlan) ? report.repairPlan : []
}

async function main() {
  if (!fs.existsSync(reportPath)) {
    throw new Error(`Missing report: ${path.relative(repoRoot, reportPath)}. Run scripts/audit-ru-article-language.js first.`)
  }

  loadEnvFile(envPath)
  const apiBaseUrl = process.env.ARTICLE_API_BASE_URL
  const token = process.env.ARTICLE_ADMIN_TOKEN

  if (!apiBaseUrl || !token) {
    throw new Error('Missing ARTICLE_API_BASE_URL or ARTICLE_ADMIN_TOKEN in env file')
  }

  const repairs = loadRepairs()

  if (repairs.length === 0) {
    console.log('No high-confidence repairs found in report.')
    return
  }

  console.log(dryRun ? 'RU language cleanup dry-run' : 'RU language cleanup PATCH mode')
  console.log(`Repairs: ${repairs.length}`)

  const grouped = groupRepairs(repairs)
  for (const group of grouped.values()) {
    const first = group[0]
    const article = normalizeArticle(await fetchJson(`${apiBaseUrl}/articles/${encodeURIComponent(first.slug)}`))
    const payload = {}

    for (const repair of group) {
      const apiField = fieldToApiField(repair.field)
      const oldValue = payload[apiField] ?? article[apiField]
      if (typeof oldValue !== 'string') {
        throw new Error(`${repair.slug}: field ${apiField} is not a string`)
      }

      if (repair.mode === 'set-field') {
        if (typeof repair.value !== 'string' || repair.value.length === 0) {
          throw new Error(`${repair.slug}: set-field repair has no value`)
        }
        payload[apiField] = repair.value
        console.log(`${dryRun ? 'DRY' : 'PATCH'} ${repair.slug} ${apiField}`)
        console.log(`  old: ${repair.oldFragment}`)
        console.log(`  new: ${repair.newFragment || preview(repair.value)}`)
        continue
      }

      if (!oldValue.includes(repair.find)) {
        console.log(`SKIP ${repair.slug} ${apiField}: fragment already absent`)
        continue
      }

      payload[apiField] = oldValue.split(repair.find).join(repair.replace)
      console.log(`${dryRun ? 'DRY' : 'PATCH'} ${repair.slug} ${apiField}`)
      console.log(`  old: ${repair.find}`)
      console.log(`  new: ${repair.replace}`)
    }

    if (Object.keys(payload).length === 0) {
      continue
    }

    const previewArticle = { ...article, ...payload }
    assertSafeRuText(previewArticle)

    if (dryRun) {
      continue
    }

    await fetchJson(`${apiBaseUrl}/admin/articles/${article.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const verified = normalizeArticle(await fetchJson(`${apiBaseUrl}/articles/${encodeURIComponent(article.slug)}`))
    assertSafeRuText(verified)

    for (const repair of group) {
      const apiField = fieldToApiField(repair.field)
      if (payload[apiField] && verified[apiField].includes(repair.find)) {
        throw new Error(`${repair.slug}: public API still contains ${repair.find}`)
      }
    }
    console.log(`Verified public API for ${article.slug}`)
  }
}

main().catch((err) => {
  console.error(`Repair failed: ${err.message}`)
  process.exit(1)
})
