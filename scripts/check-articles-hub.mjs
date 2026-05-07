import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../dist')

const checks = []

function pass(msg) {
  checks.push({ status: 'PASS', message: msg })
}

function fail(msg) {
  checks.push({ status: 'FAIL', message: msg })
}

function checkFileExists(filePath, label) {
  if (fs.existsSync(filePath)) {
    pass(`${label} exists`)
  } else {
    fail(`${label} does not exist: ${filePath}`)
  }
}

function checkFileContains(filePath, pattern, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label}: file not found`)
    return
  }
  const content = fs.readFileSync(filePath, 'utf-8')
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern
  if (regex.test(content)) {
    pass(`${label}`)
  } else {
    fail(`${label}: pattern not found`)
  }
}

function checkFileNotContains(filePath, pattern, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label}: file not found`)
    return
  }
  const content = fs.readFileSync(filePath, 'utf-8')
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern
  if (!regex.test(content)) {
    pass(`${label}`)
  } else {
    fail(`${label}: pattern should NOT be present but was found`)
  }
}

function countToolLinks(filePath, pattern) {
  if (!fs.existsSync(filePath)) return 0
  const content = fs.readFileSync(filePath, 'utf-8')
  const matches = content.match(new RegExp(pattern, 'gi'))
  return matches ? matches.length : 0
}

console.log('\n=== Articles Hub Checks ===\n')

const ruPath = path.join(distPath, 'ru', 'articles', 'index.html')
const enPath = path.join(distPath, 'en', 'articles', 'index.html')
const sitemapPath = path.join(distPath, 'sitemap.xml')

checkFileExists(ruPath, 'RU articles hub HTML')
checkFileExists(enPath, 'EN articles hub HTML')

if (fs.existsSync(ruPath)) {
  const ruContent = fs.readFileSync(ruPath, 'utf-8')

  if (/Статьи и инструкции по онлайн-инструментам QSEN/i.test(ruContent)) {
    pass('RU H1 contains "Статьи и инструкции"')
  } else {
    fail('RU H1 missing expected text')
  }

  if (/Документы/i.test(ruContent) || /Документы и деловая/i.test(ruContent)) {
    pass('RU contains category labels')
  } else {
    fail('RU missing category labels')
  }

  if (/Начните с инструмента/i.test(ruContent) || /Начните с задачи/i.test(ruContent)) {
    pass('RU hub CTA present')
  } else {
    fail('RU hub CTA missing')
  }

  const toolLinkCount = countToolLinks(ruPath, '/ru/(generator-adresata|vat-calculator|number-to-words|qr-code-generator|password-generator|seo-audit)/')
  if (toolLinkCount >= 5) {
    pass(`RU contains at least 5 tool links (found ${toolLinkCount})`)
  } else {
    fail(`RU has fewer than 5 tool links: ${toolLinkCount}`)
  }

  if (/Статьи и инструкции по онлайн-инструментам QSEN/.test(ruContent)) {
    pass('RU no noindex in page')
  } else {
    fail('RU may contain noindex — verify manually')
  }

  if (/href="https:\/\/qsen\.ru\/ru\/articles\/"/.test(ruContent)) {
    pass('RU canonical with trailing slash')
  } else {
    fail('RU canonical missing or incorrect')
  }

  if (/hreflang="ru"/.test(ruContent) && /hreflang="en"/.test(ruContent)) {
    pass('RU hreflang present')
  } else {
    fail('RU hreflang missing')
  }
}

if (fs.existsSync(enPath)) {
  const enContent = fs.readFileSync(enPath, 'utf-8')

  if (/Articles and guides for QSEN online tools/i.test(enContent)) {
    pass('EN H1 contains "Articles and guides"')
  } else {
    fail('EN H1 missing expected text')
  }

  if (/Documents/i.test(enContent) || /Documents and business writing/i.test(enContent)) {
    pass('EN contains category labels')
  } else {
    fail('EN missing category labels')
  }

  if (/Start with a tool/i.test(enContent) || /Start with your task/i.test(enContent)) {
    pass('EN hub CTA present')
  } else {
    fail('EN hub CTA missing')
  }

  const toolLinkCount = countToolLinks(enPath, '/en/(generator-adresata|vat-calculator|number-to-words|qr-code-generator|password-generator|seo-audit)/')
  if (toolLinkCount >= 5) {
    pass(`EN contains at least 5 tool links (found ${toolLinkCount})`)
  } else {
    fail(`EN has fewer than 5 tool links: ${toolLinkCount}`)
  }

  if (/Articles and guides for QSEN online tools/.test(enContent)) {
    pass('EN no noindex in page')
  } else {
    fail('EN may contain noindex — verify manually')
  }

  if (/href="https:\/\/qsen\.ru\/en\/articles\/"/.test(enContent)) {
    pass('EN canonical with trailing slash')
  } else {
    fail('EN canonical missing or incorrect')
  }

  if (/hreflang="en"/.test(enContent) && /hreflang="ru"/.test(enContent)) {
    pass('EN hreflang present')
  } else {
    fail('EN hreflang missing')
  }
}

if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf-8')
  if (/https:\/\/qsen\.ru\/ru\/articles\//.test(sitemap)) {
    pass('Sitemap contains /ru/articles/')
  } else {
    fail('Sitemap missing /ru/articles/')
  }
  if (/https:\/\/qsen\.ru\/en\/articles\//.test(sitemap)) {
    pass('Sitemap contains /en/articles/')
  } else {
    fail('Sitemap missing /en/articles/')
  }
}

checkFileNotContains(enPath, '>null<', 'EN no null string values')
checkFileNotContains(ruPath, 'i18n-key', 'RU no raw i18n keys')
checkFileNotContains(enPath, 'i18n-key', 'EN no raw i18n keys')

const passCount = checks.filter((c) => c.status === 'PASS').length
const failCount = checks.filter((c) => c.status === 'FAIL').length

console.log('Results:')
checks.forEach((c) => {
  console.log(`  ${c.status}: ${c.message}`)
})

console.log(`\n${passCount}/${passCount + failCount} checks passed\n`)

if (failCount > 0) {
  process.exit(1)
}