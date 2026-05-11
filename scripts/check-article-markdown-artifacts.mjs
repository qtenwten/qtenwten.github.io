import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const RENDER_ARTIFACT_PATTERNS = [
  { pattern: /\|[\s-]+\|[\s:-]+\|/g, name: 'markdown table separator row (unrendered)' },
  { pattern: /\|[\s-]+\|/g, name: 'markdown table pipe row (unrendered)' },
  { pattern: /\|-{3,}/g, name: 'markdown table dash separator (unrendered)' },
  { pattern: /```/g, name: 'triple backtick fence (unrendered)' },
]

const TABLE_PIPE_LINE = /^\s*\|[\s\S]*\|\s*$/
const RENDERABLE_TABLE_SEP = /\|[\s:-]+\|[\s:-]+\|[\s:-]*\|?\s*$/

function scanHtmlForRenderArtifacts(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8')
    content = content.replace(/<script[^>]*type="application\/json"[^>]*>[\s\S]*?<\/script>/gi, '')
    const artifacts = []

    for (const { pattern, name } of RENDER_ARTIFACT_PATTERNS) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        const lineCount = content.split('\n').filter(line => pattern.test(line)).length
        artifacts.push({ type: name, count: matches.length, lineCount })
      }
      pattern.lastIndex = 0
    }

    const tableLines = content.split('\n').filter(line => TABLE_PIPE_LINE.test(line) && !RENDERABLE_TABLE_SEP.test(line))
    if (tableLines.length > 0) {
      artifacts.push({ type: 'raw markdown table row in HTML (unrendered)', count: tableLines.length, lineCount: tableLines.length })
    }

    return artifacts
  } catch {
    return []
  }
}

function scanJsonDraftForContentArtifacts(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(content)
    const contentField = data.content || data.text || ''
    const artifacts = []

    for (const { pattern, name } of RENDER_ARTIFACT_PATTERNS) {
      const matches = contentField.match(pattern)
      if (matches && matches.length > 0) {
        artifacts.push({ type: name, count: matches.length })
      }
      pattern.lastIndex = 0
    }

    const tableLines = contentField.split('\n').filter(line => TABLE_PIPE_LINE.test(line) && !RENDERABLE_TABLE_SEP.test(line))
    if (tableLines.length > 0) {
      artifacts.push({ type: 'raw markdown table row in content', count: tableLines.length })
    }

    return artifacts
  } catch {
    return []
  }
}

async function run() {
  console.log('\n=== Article Rendering Artifact Checks ===\n')

  const distDir = path.join(rootDir, 'dist')
  const draftDir = path.join(rootDir, 'BD', 'article-drafts')

  let totalArtifacts = 0
  let htmlFilesScanned = 0

  console.log('A. Prerendered article HTML checks (rendering artifacts only)')
  if (fs.existsSync(distDir)) {
    const htmlFiles = []
    const collectHtml = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          collectHtml(fullPath)
        } else if (entry.name === 'index.html') {
          htmlFiles.push(fullPath)
        }
      }
    }
    collectHtml(distDir)

    for (const filePath of htmlFiles) {
      const rel = path.relative(rootDir, filePath)
      const artifacts = scanHtmlForRenderArtifacts(filePath)
      htmlFilesScanned++
      if (artifacts.length > 0) {
        totalArtifacts += artifacts.length
        console.log(`  FAIL: ${rel}`)
        artifacts.forEach(a => console.log(`    - ${a.type}: ${a.count} occurrences`))
      }
    }

    const cleanCount = htmlFiles.length - (totalArtifacts > 0 ? htmlFiles.length : 0)
    console.log(`  Scanned ${htmlFiles.length} HTML files: ${cleanCount} clean`)
  } else {
    console.log('  dist/ not found, skipping prerender checks')
  }

  console.log('\nB. Draft article JSON content checks (raw markdown artifacts - informational only)')
  if (fs.existsSync(draftDir)) {
    const jsonFiles = []
    const collectJson = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          collectJson(fullPath)
        } else if (entry.name.endsWith('.json')) {
          jsonFiles.push(fullPath)
        }
      }
    }
    collectJson(draftDir)

    let draftFilesWithArtifacts = 0
    for (const filePath of jsonFiles) {
      const rel = path.relative(rootDir, filePath)
      const artifacts = scanJsonDraftForContentArtifacts(filePath)
      if (artifacts.length > 0) {
        draftFilesWithArtifacts++
        console.log(`  INFO: ${rel}`)
        artifacts.forEach(a => console.log(`    - ${a.type}: ${a.count} occurrences`))
      }
    }
    console.log(`  Scanned ${jsonFiles.length} draft JSON files: ${jsonFiles.length - draftFilesWithArtifacts} clean (informational only)`)
  }

  console.log('\n=== Results ===')
  console.log(`HTML articles (Section A): ${totalArtifacts === 0 ? 'PASS' : 'FAIL'} - ${htmlFilesScanned} files scanned`)
  console.log(`Draft JSON files (Section B): informational only, not counted in overall result`)
  process.exit(totalArtifacts > 0 ? 1 : 0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})