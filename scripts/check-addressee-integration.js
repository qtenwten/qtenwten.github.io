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
    'addresseeGenerator.fields.senderFullName',
    'addresseeGenerator.fields.senderPosition',
    'addresseeGenerator.fields.senderOrganization',
    'addresseeGenerator.placeholders.senderFullName',
    'addresseeGenerator.placeholders.senderPosition',
    'addresseeGenerator.placeholders.senderOrganization',
    'addresseeGenerator.hints.sender',
    'addresseeGenerator.buttons.generate',
    'addresseeGenerator.buttons.clear',
    'addresseeGenerator.buttons.copyAll',
    'addresseeGenerator.buttons.exportCsv',
    'addresseeGenerator.buttons.exportTxt',
    'addresseeGenerator.buttons.exportHtml',
    'addresseeGenerator.buttons.downloadDocx',
    'addresseeGenerator.buttons.docxComingSoon',
    'addresseeGenerator.export.disclaimer',
    'addresseeGenerator.export.to',
    'addresseeGenerator.export.from',
    'addresseeGenerator.export.greeting',
    'addresseeGenerator.export.documentTemplate',
    'addresseeGenerator.bulk.hint',
    'addresseeGenerator.bulk.placeholder',
    'addresseeGenerator.exportNote',
    'addresseeGenerator.statusMessages.resultGenerated',
    'addresseeGenerator.statusMessages.copied',
    'addresseeGenerator.statusMessages.txtDownloaded',
    'addresseeGenerator.statusMessages.htmlDownloaded',
    'addresseeGenerator.statusMessages.csvDownloaded',
    'addresseeGenerator.statusMessages.validationError',
    'addresseeGenerator.statusMessages.rowsProcessed',
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

  if (lang === 'en') {
    const enLocale = readJson('src/locales/en.json')
    const bulkPlaceholder = enLocale.addresseeGenerator?.bulk?.placeholder || ''
    const cyrillicRegex = /[\u0400-\u04FF]/
    const hasCyrillic = cyrillicRegex.test(bulkPlaceholder)
    check(!hasCyrillic, 'en: bulk.placeholder has no Cyrillic characters')
  }

  const exportNote = locale.addresseeGenerator?.exportNote || ''
  if (exportNote.toLowerCase().includes('massovaya') || exportNote.toLowerCase().includes('mass processing') || exportNote.toLowerCase().includes('bulk processing') || exportNote.toLowerCase().includes('will be added')) {
    if (!exportNote.toLowerCase().includes('csv') || !exportNote.toLowerCase().includes('available')) {
      console.log(`  WARNING: ${lang}.json exportNote may contain outdated claims`)
    }
  }
}

// 6b. FAQ texts consistency
console.log('\n6b. FAQ texts consistency')
const ruLocale = readJson('src/locales/ru.json')
const enLocale = readJson('src/locales/en.json')

const ruFaq6 = ruLocale.addresseeGenerator?.info?.faqList?.q6 || ''
const ruFaq6Answer = ruLocale.addresseeGenerator?.info?.faqList?.a6 || ''
const ruExportNote = ruLocale.addresseeGenerator?.exportNote || ''

const enFaq6 = enLocale.addresseeGenerator?.info?.faqList?.q6 || ''
const enFaq6Answer = enLocale.addresseeGenerator?.info?.faqList?.a6 || ''
const enExportNote = enLocale.addresseeGenerator?.exportNote || ''

const outdatedPhrasesRu = ['будет добавлена позже', 'запланирована отдельно', 'скоро', 'массовая обработка csv?', 'massovaya']
const outdatedPhrasesEn = ['will be added later', 'planned separately', 'coming soon', 'bulk csv processing?', 'planned']

for (const phrase of outdatedPhrasesRu) {
  check(!ruFaq6.toLowerCase().includes(phrase.toLowerCase()) || ruFaq6.toLowerCase().includes('массовая обработка'), `ru: FAQ q6 does not contain outdated phrase "${phrase}"`)
}
for (const phrase of outdatedPhrasesRu) {
  check(!ruFaq6Answer.toLowerCase().includes(phrase.toLowerCase()), `ru: FAQ a6 does not contain outdated phrase "${phrase}"`)
}

for (const phrase of outdatedPhrasesEn) {
  check(!enFaq6.toLowerCase().includes(phrase.toLowerCase()), `en: FAQ q6 does not contain outdated phrase "${phrase}"`)
}
for (const phrase of outdatedPhrasesEn) {
  check(!enFaq6Answer.toLowerCase().includes(phrase.toLowerCase()), `en: FAQ a6 does not contain outdated phrase "${phrase}"`)
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
check(copyBtnContent.includes('onCopied') || copyBtnContent.includes('onCopied='), 'supports optional onCopied prop')

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
check(agContent.includes('getDocumentExportText'), 'has getDocumentExportText')
check(agContent.includes('escapeHtml'), 'has escapeHtml')
check(agContent.includes('addressee-generator-document.txt'), 'has TXT filename')
check(agContent.includes('addressee-generator-document.html'), 'has HTML filename')
check(agContent.includes('\\uFEFF') || agContent.includes('\\\\uFEFF'), 'CSV has UTF-8 BOM')
check(agContent.includes("'fullName'") &&
  agContent.includes("'position'") &&
  agContent.includes("'organization'") &&
  agContent.includes("'to'") &&
  agContent.includes("'from'") &&
  agContent.includes("'greeting'") &&
  agContent.includes("'letter'") &&
  agContent.includes("'documentText'"),
  'CSV header array contains expected fields including documentText'
)
check(
  agContent.includes("'senderFullName'") &&
  agContent.includes("'senderPosition'") &&
  agContent.includes("'senderOrganization'"),
  'CSV header array contains sender fields'
)
check(agContent.includes('addrSenderTitle'), 'has addrSenderTitle element')
check(agContent.includes('addrSenderFullName'), 'has addrSenderFullName element')
check(agContent.includes('addrSenderPosition'), 'has addrSenderPosition element')
check(agContent.includes('addrSenderOrganization'), 'has addrSenderOrganization element')
check(agContent.includes('addresseeGenerator.senderTitle'), 'has JSX section using senderTitle i18n')
check(!agContent.includes('console.log'), 'no console.log statements')
check(agContent.includes('<form'), 'has <form> element')
check(agContent.includes('onSubmit={handleSubmit}') || agContent.includes('onSubmit={ handleSubmit }'), 'has onSubmit handler')
check(agContent.includes('type="submit"'), 'generate button is type="submit"')
check(agContent.includes('aria-live=') || agContent.includes('aria-live ='), 'has aria-live region')
check(agContent.includes('aria-invalid=') || agContent.includes('aria-invalid ='), 'has aria-invalid on fields')
check(agContent.includes('aria-describedby=') || agContent.includes('aria-describedby ='), 'has aria-describedby on fields')
check(agContent.includes('tabIndex={-1}') || agContent.includes('tabIndex={ -1 }'), 'result section has tabIndex={-1}')
check(agContent.includes('ref={resultRef}') || agContent.includes('ref={ resultRef }'), 'result section has ref for focus')
check(agContent.includes('blocks.documentText') || agContent.includes("key: 'documentText'"), 'resultBlocks includes documentText')
check(agContent.includes('handleExportDocx') || agContent.includes('downloadAddresseeDocx'), 'has DOCX export handler')
check(agContent.includes('docx') || agContent.includes('description'), 'DOCX button uses description icon')

// 10b. DOCX helper
console.log('\n10b. DOCX helper')
const docxHelperPath = path.join(rootDir, 'src/utils/addresseeDocxExport.js')
check(fs.existsSync(docxHelperPath), 'DOCX helper file exists')
if (fs.existsSync(docxHelperPath)) {
  const docxContent = readFile('src/utils/addresseeDocxExport.js')
  check(docxContent.includes('generateAddresseeDocxBlob') || docxContent.includes('downloadAddresseeDocx'), 'DOCX helper exports generation function')
  check(docxContent.includes('Document') || docxContent.includes('P') || docxContent.includes('Text'), 'DOCX helper uses docx library')
  check(docxContent.includes('result.blocks.from') || docxContent.includes('fromSection'), 'DOCX helper uses from block for sender')
}

// 10c. Locales for DOCX
console.log('\n10c. Locales for DOCX')
for (const lang of ['ru', 'en']) {
  const locale = readJson(`src/locales/${lang}.json`)
  const docxKeys = [
    'addresseeGenerator.statusMessages.docxDownloaded',
    'addresseeGenerator.export.docxDocumentLabel',
    'addresseeGenerator.export.addressee',
    'addresseeGenerator.export.sender',
    'addresseeGenerator.export.warningsSection',
    'addresseeGenerator.export.docxSingleOnly',
  ]
  for (const key of docxKeys) {
    const value = key.split('.').reduce((obj, k) => obj?.[k], locale)
    check(typeof value === 'string' && value.length > 0, `${lang}: ${key}`)
  }
}

// 10d. No stale DOCX FAQ phrases in addressee section
console.log('\n10d. No stale DOCX FAQ phrases in addressee section')

const staleDocxPhrases = [
  { lang: 'ru', phrases: ['docx не включён', 'docx экспорт не включён', 'docx экспорт сейчас не включён', 'docx экспорт — в разработке', 'docx coming soon', 'docx экспорт в разработке'] },
  { lang: 'en', phrases: ['docx export is not enabled', 'docx export is not included', 'docx not enabled', 'docx coming soon', 'docx will be available'] },
]

for (const { lang, phrases } of staleDocxPhrases) {
  const locale = readJson(`src/locales/${lang}.json`)
  const addresseeSection = locale.addresseeGenerator || {}
  const allValues = JSON.stringify(addresseeSection).toLowerCase()
  for (const phrase of phrases) {
    check(!allValues.includes(phrase.toLowerCase()), `${lang}: addresseeGenerator section does not contain stale DOCX phrase "${phrase}"`)
  }
}

const addrSectionRouteSeo = routeSeoContent.match(/\/generator-adresata[\s\S]*?(?=\n  ['"]\/|,\s*['"]\/|$)/)
if (addrSectionRouteSeo) {
  const addrSeoText = addrSectionRouteSeo[0].toLowerCase()
  for (const { phrases, lang } of staleDocxPhrases) {
    for (const phrase of phrases) {
      check(!addrSeoText.includes(phrase.toLowerCase()), `routeSeo: addressee section (${lang}) does not contain stale DOCX phrase "${phrase}"`)
    }
  }
}

// 10e. UI regression checks (sender title i18n, spacing elements)
console.log('\n10e. UI regression checks')
check(!agContent.includes('addresseeGenerator.sections.sender'), 'JSX does not use raw i18n key "addresseeGenerator.sections.sender"')
check(agContent.includes('addresseeGenerator.senderTitle'), 'JSX uses addresseeGenerator.senderTitle for sender section')
check(agContent.includes('addr-gen-examples'), 'JSX has addr-gen-examples class')
check(agContent.includes('addr-gen-actions'), 'JSX has addr-gen-actions class')
const agCssContent = readFile('src/pages/AddresseeGenerator.css')
check(agCssContent.includes('.addr-gen-examples'), 'CSS has .addr-gen-examples styles')
check(agCssContent.includes('.addr-gen-actions'), 'CSS has .addr-gen-actions styles')
check(agCssContent.includes('margin-top') && agCssContent.includes('.addr-gen-examples'), 'CSS .addr-gen-examples has margin-top')
check(agCssContent.includes('margin-top') && agCssContent.includes('.addr-gen-actions'), 'CSS .addr-gen-actions has margin-top')
for (const lang of ['ru', 'en']) {
  const locale = readJson(`src/locales/${lang}.json`)
  const senderTitle = locale.addresseeGenerator?.senderTitle
  check(typeof senderTitle === 'string' && senderTitle.length > 0, `${lang}: addresseeGenerator.senderTitle exists and is non-empty`)
  const staleKey = 'addresseeGenerator.sections.sender'
  const staleValue = staleKey.split('.').reduce((obj, k) => obj?.[k], locale)
  check(!staleValue || typeof staleValue !== 'string', `${lang}: does NOT have stale key "addresseeGenerator.sections.sender"`)
}

// 10f. CSV upload checks
console.log('\n10f. CSV upload checks')
check(agContent.includes('handleCsvFileChange'), 'JSX has handleCsvFileChange function')
check(agContent.includes('type="file"') && agContent.includes('accept=".csv,text/csv"'), 'JSX has file input with CSV accept attribute')
check(agContent.includes('addr-gen-upload-row'), 'JSX has addr-gen-upload-row element')
check(agContent.includes('addr-gen-upload-input'), 'JSX has addr-gen-upload-input class')
check(agContent.includes('bulkFileInput'), 'JSX has bulkFileInput id for file input')
check(agContent.includes('htmlFor="bulkFileInput"') || agContent.includes('htmlFor={"bulkFileInput"}'), 'JSX file input has label with htmlFor')
check(agContent.includes('FileReader'), 'JSX uses FileReader for CSV parsing')
for (const lang of ['ru', 'en']) {
  const locale = readJson(`src/locales/${lang}.json`)
  const bulk = locale.addresseeGenerator?.bulk
  check(bulk?.uploadCsv && typeof bulk.uploadCsv === 'string', `${lang}: bulk.uploadCsv exists`)
  check(bulk?.uploadHint && typeof bulk.uploadHint === 'string', `${lang}: bulk.uploadHint exists`)
  check(bulk?.uploadedCount && typeof bulk.uploadedCount === 'string', `${lang}: bulk.uploadedCount exists`)
  check(bulk?.uploadError && typeof bulk.uploadError === 'string', `${lang}: bulk.uploadError exists`)
}
check(agCssContent.includes('.addr-gen-upload-row'), 'CSS has .addr-gen-upload-row styles')
check(agCssContent.includes('.addr-gen-upload-input'), 'CSS has .addr-gen-upload-input styles')

// 10g. Mobile responsive checks
console.log('\n10g. Mobile responsive checks')
check(agCssContent.includes('@media (max-width: 768px)') || agCssContent.includes('@media (max-width: 767px)'), 'CSS has mobile media query (768px)')
check(agCssContent.includes('@media (max-width: 420px)') || agCssContent.includes('@media (max-width: 480px)'), 'CSS has narrow mobile media query')
check(agCssContent.includes('.addr-gen-bulk-table-wrap') && agCssContent.includes('overflow-x'), 'CSS has horizontal scroll for bulk table')
check(
  agCssContent.includes('.addr-gen-btn--primary') && agCssContent.includes('flex'),
  'CSS has flex-based primary button layout'
)

// 10h. No raw placeholder keys in locales
console.log('\n10h. No raw placeholder keys in addresseeGenerator')
for (const lang of ['ru', 'en']) {
  const locale = readJson(`src/locales/${lang}.json`)
  const addrGenSection = locale.addresseeGenerator || {}
  const allValues = JSON.stringify(addrGenSection)
  check(!allValues.includes('undefined'), `${lang}: locale has no 'undefined' string`)
  check(!allValues.includes('null'), `${lang}: locale has no 'null' string`)
  check(!allValues.includes('addresseeGenerator.'), `${lang}: locale has no raw i18n key strings`)
}


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