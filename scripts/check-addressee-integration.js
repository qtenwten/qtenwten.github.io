import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function readFile(filePath) {
  return fs.readFileSync(path.join(rootDir, filePath), 'utf-8')
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath))
}

let passed = 0
let total = 0

function check(condition, description) {
  total++
  if (condition) {
    passed++
    console.log(`  ✓ ${description}`)
  } else {
    console.log(`  ✗ FAILED: ${description}`)
  }
}

console.log('\n=== Addressee Integration Checks ===\n')

// 1. Required files exist
console.log('1. Required files')
const requiredFiles = [
  'src/pages/AddresseeGenerator.jsx',
  'src/pages/AddresseeGenerator.css',
  'src/utils/addresseeFormatter.js',
  'src/utils/addresseeTypes.js',
  'scripts/check-addressee-formatter.js',
  'src/config/routeRegistry.js',
  'src/config/routeSeo.js',
  'src/routes/lazyPages.js',
  'src/App.jsx',
  'src/locales/ru.json',
  'src/locales/en.json',
  'scripts/generate-pages.js',
  'src/components/SEO.jsx',
  'src/components/CopyButton.jsx',
]
for (const file of requiredFiles) {
  check(fs.existsSync(path.join(rootDir, file)), `file exists: ${file}`)
}

// 2. routeRegistry.js
console.log('\n2. routeRegistry.js')
const routeRegistryContent = readFile('src/config/routeRegistry.js')
check(routeRegistryContent.includes("key: 'addresseeGenerator'"), 'has key: addresseeGenerator')
check(routeRegistryContent.includes("path: '/generator-adresata'"), 'has path: /generator-adresata')
check(routeRegistryContent.includes("componentKey: 'AddresseeGenerator'"), 'has componentKey: AddresseeGenerator')
check(routeRegistryContent.includes("titleKey: 'tools.addresseeGenerator.title'"), 'has titleKey: tools.addresseeGenerator.title')
check(routeRegistryContent.includes("descriptionKey: 'tools.addresseeGenerator.description'"), 'has descriptionKey: tools.addresseeGenerator.description')
check(routeRegistryContent.includes("icon: 'person'"), "has icon: 'person'")
check(routeRegistryContent.includes("'/generator-adresata': '/ru/generator-adresata/'"), "has LEGACY_ROUTE_REDIRECT for /generator-adresata")

// 3. lazyPages.js
console.log('\n3. lazyPages.js')
const lazyPagesContent = readFile('src/routes/lazyPages.js')
check(lazyPagesContent.includes('export const AddresseeGenerator'), 'exports AddresseeGenerator')
check(lazyPagesContent.includes("import('../pages/AddresseeGenerator')"), 'lazy import for AddresseeGenerator')
check(lazyPagesContent.includes("'/generator-adresata': AddresseeGenerator"), "route '/generator-adresata' maps to AddresseeGenerator")

// 4. App.jsx
console.log('\n4. App.jsx')
const appContent = readFile('src/App.jsx')
const addrGenCount = (appContent.match(/AddresseeGenerator/g) || []).length
check(addrGenCount >= 2, 'AddresseeGenerator appears at least twice in App.jsx')
check(appContent.includes("from './routes/lazyPages'"), 'imports from ./routes/lazyPages')

// 5. routeSeo.js
console.log('\n5. routeSeo.js')
const routeSeoContent = readFile('src/config/routeSeo.js')
check(routeSeoContent.includes("'/generator-adresata':"), "has entry '/generator-adresata'")

const addrSectionMatch = routeSeoContent.match(/\/generator-adresata[\s\S]*?(?=\n  '\/|$)/)
const addrSection = addrSectionMatch ? addrSectionMatch[0] : ''
check(addrSection.includes("title: 'Генератор адресата"), 'ru title exists')
check(addrSection.includes("title: 'Addressee & Salutation Generator"), 'en title exists')
check(addrSection.includes('keywords:'), 'has keywords')
check(addrSection.includes('structuredData:'), 'has structuredData')
check(addrSection.includes("'@type': 'WebApplication'"), 'has WebApplication')
check(addrSection.includes("'@type': 'FAQPage'"), 'has FAQPage')
const questionCount = (addrSection.match(/['"]@type['"]\s*:\s*['"]Question['"]/g) || []).length
check(questionCount >= 8, `has at least 8 Question entries (found ${questionCount})`)

// 6. Locales
console.log('\n6. Locales (ru.json and en.json)')
for (const lang of ['ru', 'en']) {
  console.log(`  ${lang}.json`)
  const locale = readJson(`src/locales/${lang}.json`)
  const keys = [
    'tools.addresseeGenerator.title',
    'tools.addresseeGenerator.description',
    'seo.addresseeGenerator.title',
    'seo.addresseeGenerator.description',
    'seo.addresseeGenerator.keywords',
    'addresseeGenerator.title',
    'addresseeGenerator.subtitle',
    'addresseeGenerator.fields.fullName',
    'addresseeGenerator.fields.position',
    'addresseeGenerator.fields.organization',
    'addresseeGenerator.fields.gender',
    'addresseeGenerator.fields.greetingMode',
    'addresseeGenerator.fields.punctuation',
    'addresseeGenerator.buttons.generate',
    'addresseeGenerator.buttons.clear',
    'addresseeGenerator.buttons.copyAll',
    'addresseeGenerator.buttons.exportCsv',
    'addresseeGenerator.buttons.exportTxt',
    'addresseeGenerator.buttons.exportHtml',
    'addresseeGenerator.export.disclaimer',
    'addresseeGenerator.info.faqList.q1',
    'addresseeGenerator.info.faqList.a1',
    'addresseeGenerator.info.faqList.q2',
    'addresseeGenerator.info.faqList.a2',
    'addresseeGenerator.info.faqList.q3',
    'addresseeGenerator.info.faqList.a3',
    'addresseeGenerator.info.faqList.q4',
    'addresseeGenerator.info.faqList.a4',
    'addresseeGenerator.info.faqList.q5',
    'addresseeGenerator.info.faqList.a5',
    'addresseeGenerator.info.faqList.q6',
    'addresseeGenerator.info.faqList.a6',
    'addresseeGenerator.info.faqList.q7',
    'addresseeGenerator.info.faqList.a7',
    'addresseeGenerator.info.faqList.q8',
    'addresseeGenerator.info.faqList.a8',
  ]
  for (const key of keys) {
    const value = key.split('.').reduce((obj, k) => obj?.[k], locale)
    check(typeof value === 'string' && value.length > 0, `${lang}: ${key}`)
  }
}

// 7. generate-pages.js
console.log('\n7. generate-pages.js')
const generatePagesContent = readFile('scripts/generate-pages.js')
check(generatePagesContent.includes("'/generator-adresata'"), '/generator-adresata appears in generate-pages.js')
const gpMatches = (generatePagesContent.match(/\/generator-adresata/g) || []).length
check(gpMatches >= 3, `has at least 3 occurrences of /generator-adresata (found ${gpMatches})`)

// 8. SEO.jsx
console.log('\n8. SEO.jsx')
const seoContent = readFile('src/components/SEO.jsx')
check(seoContent.includes('keywords'), 'keywords in function props')
check(seoContent.includes('fullKeywords'), 'fullKeywords variable exists')
check(seoContent.includes('name="keywords"'), 'renders meta name="keywords"')
check(seoContent.includes('name="robots"'), 'renders meta name="robots"')

// 9. CopyButton.jsx
console.log('\n9. CopyButton.jsx')
const copyBtnContent = readFile('src/components/CopyButton.jsx')
check(copyBtnContent.includes('type="button"'), 'button has type="button"')
check(!copyBtnContent.includes('name="close"'), 'no name="close"')
check(copyBtnContent.includes('name="x"') || copyBtnContent.includes("name='x'"), 'has Icon name="x"')

// 10. AddresseeGenerator.jsx
console.log('\n10. AddresseeGenerator.jsx')
const agContent = readFile('src/pages/AddresseeGenerator.jsx')
check(agContent.includes('formatAddressee'), 'imports formatAddressee')
check(agContent.includes('FAQ_KEYS'), 'has FAQ_KEYS')
check(agContent.includes('<SEO'), 'uses <SEO')
check(agContent.includes('structuredData'), 'passes structuredData to SEO')
check(agContent.includes('handleExportCsv'), 'has handleExportCsv')
check(agContent.includes('handleExportTxt'), 'has handleExportTxt')
check(agContent.includes('handleExportHtml'), 'has handleExportHtml')
check(agContent.includes('escapeHtml'), 'has escapeHtml')
check(agContent.includes('addressee-generator-document.txt'), 'has TXT filename')
check(agContent.includes('addressee-generator-document.html'), 'has HTML filename')
check(agContent.includes('\\uFEFF') || agContent.includes('\\\\uFEFF'), 'CSV has UTF-8 BOM')
check(
  agContent.includes("'fullName'") &&
  agContent.includes("'position'") &&
  agContent.includes("'organization'") &&
  agContent.includes("'to'") &&
  agContent.includes("'from'") &&
  agContent.includes("'greeting'") &&
  agContent.includes("'letter'"),
  'CSV header array contains expected fields'
)
check(!agContent.includes('console.log'), 'no console.log statements')

// 11. Sitemap (optional check after build)
console.log('\n11. Sitemap')
const distSitemapPath = path.join(rootDir, 'dist/sitemap.xml')
const pubSitemapPath = path.join(rootDir, 'public/sitemap.xml')
const sitemapPath = fs.existsSync(distSitemapPath) ? distSitemapPath : (fs.existsSync(pubSitemapPath) ? pubSitemapPath : null)
if (sitemapPath) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf-8')
  check(sitemap.includes('https://qsen.ru/ru/generator-adresata'), 'sitemap has RU URL (without trailing slash)')
  check(sitemap.includes('https://qsen.ru/en/generator-adresata'), 'sitemap has EN URL (without trailing slash)')
} else {
  console.log('  ⚠ sitemap.xml not found — skipping')
}

// Results
console.log(`\n=== Results ===\n`)
console.log(`Addressee integration checks passed: ${passed}/${total}`)

if (passed < total) {
  console.log('\nFailed checks:')
  process.exit(1)
} else {
  console.log('\nAll checks passed!')
}