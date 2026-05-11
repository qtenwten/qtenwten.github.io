const path = require('path')
const fs = require('fs')

const DRAFTS_DIR = path.join(__dirname, '../BD/article-drafts/stage-18-addressee')
const ARTICLE_FUNNEL_PATH = path.join(__dirname, '../src/utils/articleFunnel.js')

const SCENARIO_FOCUS_MAP = {
  'application-header-example': { scenario: 'application-director', focus: null },
  'addressee-to-field-application': { scenario: 'application', focus: 'to' },
  'addressee-from-field-application': { scenario: 'application', focus: 'from' },
  'school-director-application': { scenario: 'application', focus: 'to' },
  'employer-application': { scenario: 'application', focus: 'to' },
  'management-company-application': { scenario: 'application', focus: 'to' },
  'memo-to-manager-addressee': { scenario: 'memo', focus: 'to' },
}

const EN_SLUGS = new Set([
  'how-to-write-to-field-in-russian-application',
  'how-to-format-from-field-in-russian-documents',
  'russian-application-header-example',
  'russian-school-director-application-header',
  'russian-employer-application-to-from-fields',
  'russian-management-company-application-header',
  'russian-internal-memo-to-from-header',
])

const FUTURE_EN_MODES = new Set([
  'businessLetter',
  'business-letter',
  'enBusinessLetter',
  'complaint',
  'request',
  'custom',
  'csv-bulk',
  'csvBulk',
])

const VALID_SCENARIOS = new Set([
  'application',
  'application-director',
  'memo',
  'complaint',
  'request',
  'business-letter',
  'custom',
  'csv-bulk',
])

const VALID_FOCUSES = new Set(['to', 'from', 'salutation'])

function loadDrafts() {
  if (!fs.existsSync(DRAFTS_DIR)) {
    return {}
  }
  const files = fs.readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.json'))
  const drafts = {}
  for (const file of files) {
    const filePath = path.join(DRAFTS_DIR, file)
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(content)
      drafts[data.slug] = data
    } catch (e) {
      console.error(`Failed to read ${file}: ${e.message}`)
    }
  }
  return drafts
}

function checkDrafts(drafts) {
  const results = { pass: 0, fail: 0, errors: [] }

  for (const [slug, draft] of Object.entries(drafts)) {
    const isEn = EN_SLUGS.has(slug)
    const expected = SCENARIO_FOCUS_MAP[draft.translation_key]

    if (!expected) {
      results.fail++
      results.errors.push(`${slug}: unknown translation_key "${draft.translation_key}"`)
      continue
    }

    const cta = draft.scenarioCta
    if (!cta || typeof cta !== 'object') {
      results.fail++
      results.errors.push(`${slug}: missing or invalid scenarioCta object`)
      continue
    }

    if (cta.scenario !== expected.scenario) {
      results.fail++
      results.errors.push(`${slug}: expected scenario="${expected.scenario}", got "${cta.scenario}"`)
      continue
    }

    if (expected.focus === null) {
      if (cta.focus !== undefined) {
        results.fail++
        results.errors.push(`${slug}: header article should not have focus, got "${cta.focus}"`)
        continue
      }
    } else {
      if (cta.focus !== expected.focus) {
        results.fail++
        results.errors.push(`${slug}: expected focus="${expected.focus}", got "${cta.focus}"`)
        continue
      }
    }

    if (!cta.source || cta.source !== 'article') {
      results.fail++
      results.errors.push(`${slug}: expected source="article", got "${cta.source}"`)
      continue
    }

    if (!cta.translation_key || cta.translation_key !== draft.translation_key) {
      results.fail++
      results.errors.push(`${slug}: expected translation_key="${draft.translation_key}", got "${cta.translation_key}"`)
      continue
    }

    if (isEn && draft.content && draft.content.includes('/ru/')) {
      results.fail++
      results.errors.push(`${slug}: EN article contains /ru/ link`)
      continue
    }

    if (!isEn && draft.content && draft.content.includes('/en/')) {
      results.fail++
      results.errors.push(`${slug}: RU article contains /en/ link`)
      continue
    }

const ctaScenarioLower = (cta.scenario || '').toLowerCase()
    const ctaFocusLower = (cta.focus || '').toLowerCase()
    if (isEn && FUTURE_EN_MODES.has(ctaScenarioLower)) {
      results.fail++
      results.errors.push(`${slug}: EN article uses unsupported scenario="${cta.scenario}"`)
      continue
    }
    if (!isEn && FUTURE_EN_MODES.has(ctaScenarioLower)) {
      const ruSupportedScenarios = new Set(['memo', 'complaint', 'request'])
      if (!ruSupportedScenarios.has(ctaScenarioLower)) {
        results.fail++
        results.errors.push(`${slug}: non-EN mode scenario="${cta.scenario}" is not supported for RU`)
        continue
      }
    }

    results.pass++
  }

  return results
}

function checkArticleFunnelFallback() {
  const results = { pass: 0, fail: 0, errors: [] }

  const content = fs.readFileSync(ARTICLE_FUNNEL_PATH, 'utf-8')

  if (!content.includes('SCENARIO_QUERY_VALUES') && !content.includes('scenarioQueryValues')) {
    results.fail++
    results.errors.push('articleFunnel.js missing SCENARIO_QUERY_VALUES mapping')
  } else {
    results.pass++
  }

  if (!content.includes('VALID_FOCUS_VALUES')) {
    results.fail++
    results.errors.push('articleFunnel.js missing VALID_FOCUS_VALUES')
  } else {
    results.pass++
  }

  if (!content.includes('scenarioValue') || !content.includes('VALID_SCENARIO_QUERY_VALUES')) {
    results.fail++
    results.errors.push('articleFunnel.js missing scenario validation (scenarioValue + VALID_SCENARIO_QUERY_VALUES)')
  } else {
    results.pass++
  }

  if (!content.includes('focus') || !content.includes('VALID_FOCUS_VALUES')) {
    results.fail++
    results.errors.push('articleFunnel.js missing focus validation (focus + VALID_FOCUS_VALUES)')
  } else {
    results.pass++
  }

  return results
}

function checkSitemap() {
  const results = { pass: 0, fail: 0, errors: [] }
  const sitemapPath = path.join(__dirname, '../public/sitemap.xml')

  if (!fs.existsSync(sitemapPath)) {
    results.pass++
    return results
  }

  const content = fs.readFileSync(sitemapPath, 'utf-8')

  if (content.includes('scenario=') || content.includes('focus=')) {
    results.fail++
    results.errors.push('sitemap.xml contains scenario= or focus= query params')
  } else {
    results.pass++
  }

  return results
}

function main() {
  console.log('\n=== Addressee Article CTA Checks ===\n')

  console.log('A. Stage-18 drafts have correct scenario/focus\n')
  const drafts = loadDrafts()
  const draftResults = checkDrafts(drafts)
  for (const err of draftResults.errors) {
    console.log(`  FAIL: ${err}`)
  }
  console.log(`  Total: ${draftResults.pass}/${Object.keys(drafts).length} drafts passed`)

  console.log('\nB. articleFunnel.js fallback handling\n')
  const funnelResults = checkArticleFunnelFallback()
  for (const err of funnelResults.errors) {
    console.log(`  FAIL: ${err}`)
  }
  console.log(`  Total: ${funnelResults.pass}/4 checks passed`)

  console.log('\nC. Sitemap does not contain scenario/focus params\n')
  const sitemapResults = checkSitemap()
  for (const err of sitemapResults.errors) {
    console.log(`  FAIL: ${err}`)
  }
  console.log(`  Total: ${sitemapResults.pass}/1 checks passed`)

  const totalPass = draftResults.pass + funnelResults.pass + sitemapResults.pass
  const totalFail = draftResults.fail + funnelResults.fail + sitemapResults.fail
  const total = Object.keys(drafts).length + 4 + 1

  console.log(`\n=== Results: ${totalPass}/${total} ===\n`)

  if (totalFail > 0) {
    console.log('FAILED checks:')
    for (const err of [...draftResults.errors, ...funnelResults.errors, ...sitemapResults.errors]) {
      console.log(`  - ${err}`)
    }
    process.exit(1)
  } else {
    console.log('All addressee article CTA checks passed!\n')
    process.exit(0)
  }
}

main()