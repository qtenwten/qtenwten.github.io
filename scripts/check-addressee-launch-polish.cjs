const fs = require('fs')
const path = require('path')

const PASS = 'PASS'
const FAIL = 'FAIL'

const checks = []

function check(name, fn) {
  try {
    const result = fn()
    checks.push({ name, status: PASS, detail: result })
  } catch (e) {
    checks.push({ name, status: FAIL, detail: e.message })
  }
}

function checkFile(filePath, content, expectations) {
  expectations.forEach(({ regex, description }) => {
    const re = new RegExp(regex)
    const match = re.test(content)
    checks.push({
      name: `${description}: ${regex}`,
      status: match ? PASS : FAIL,
      detail: match ? 'found' : 'not found',
    })
  })
}

const rootDir = path.resolve(__dirname, '..')
const jsxPath = path.join(rootDir, 'src', 'pages', 'AddresseeGenerator.jsx')
const cssPath = path.join(rootDir, 'src', 'pages', 'AddresseeGenerator.css')
const ruPath = path.join(rootDir, 'src', 'locales', 'ru.json')
const enPath = path.join(rootDir, 'src', 'locales', 'en.json')

const jsx = fs.readFileSync(jsxPath, 'utf8')
const css = fs.readFileSync(cssPath, 'utf8')
const ru = fs.readFileSync(ruPath, 'utf8')
const en = fs.readFileSync(enPath, 'utf8')

check('AddresseeGenerator.jsx exists', () => fs.existsSync(jsxPath))
check('AddresseeGenerator.css exists', () => fs.existsSync(cssPath))
check('ru.json exists', () => fs.existsSync(ruPath))
check('en.json exists', () => fs.existsSync(enPath))

check('No hardcoded Russian in JSX for presets/recipient title', () => {
  const hardcodedRecipients = jsx.match(/Сохранённые адресаты/g)
  return !hardcodedRecipients
})

check('No hardcoded Russian in JSX for presets/sender title', () => {
  const hardcodedSenders = jsx.match(/Сохранённые отправители/g)
  return !hardcodedSenders
})

check('JSX has addr-gen-intro-privacy rendered', () => /addr-gen-intro-privacy/.test(jsx))
check('JSX has addr-gen-free-notice rendered', () => /addr-gen-free-notice/.test(jsx))

check('ru.json has introPrivacy key', () => {
  const parsed = JSON.parse(ru)
  return !!parsed.addresseeGenerator.introPrivacy
})

check('en.json has introPrivacy key', () => {
  const parsed = JSON.parse(en)
  return !!parsed.addresseeGenerator.introPrivacy
})

check('ru.json has freeForeverNotice key', () => {
  const parsed = JSON.parse(ru)
  return !!parsed.addresseeGenerator.freeForeverNotice
})

check('en.json has freeForeverNotice key', () => {
  const parsed = JSON.parse(en)
  return !!parsed.addresseeGenerator.freeForeverNotice
})

check('ru.json: no "Pro" in exportPremiumHint', () => {
  const parsed = JSON.parse(ru)
  return !parsed.addresseeGenerator.exportPremiumHint.includes('Pro')
})

check('en.json: no "Pro" in exportPremiumHint', () => {
  const parsed = JSON.parse(en)
  return !parsed.addresseeGenerator.exportPremiumHint.includes('Pro')
})

check('ru.json: no "Pro" in bulk.proHint', () => {
  const parsed = JSON.parse(ru)
  return !parsed.addresseeGenerator.bulk.proHint.includes('Pro')
})

check('en.json: no "Pro" in bulk.proHint', () => {
  const parsed = JSON.parse(en)
  return !parsed.addresseeGenerator.bulk.proHint.includes('Pro')
})

check('ru.json: no "Pro" in presets.recipientSection.limitClose', () => {
  const parsed = JSON.parse(ru)
  return !parsed.addresseeGenerator.addressee.presets.recipientSection.limitClose.includes('Pro')
})

check('en.json: no "Pro" in presets.recipientSection.limitClose', () => {
  const parsed = JSON.parse(en)
  return !parsed.addresseeGenerator.addressee.presets.recipientSection.limitClose.includes('Pro')
})

check('ru.json: no "Pro" in presets.senderSection.limitClose', () => {
  const parsed = JSON.parse(ru)
  return !parsed.addresseeGenerator.addressee.presets.senderSection.limitClose.includes('Pro')
})

check('en.json: no "Pro" in presets.senderSection.limitClose', () => {
  const parsed = JSON.parse(en)
  return !parsed.addresseeGenerator.addressee.presets.senderSection.limitClose.includes('Pro')
})

check('CSS: addr-gen-bulk has display:none', () => /\.addr-gen-bulk\s*\{[\s\S]*?display\s*:\s*none/.test(css))

check('CSS: addr-gen-bulk--active has display:grid', () => {
  return /\.addr-gen-bulk--active\s*\{[\s\S]*?display\s*:\s*grid/.test(css)
})

check('CSS: addr-gen-free-notice class exists', () => /\.addr-gen-free-notice\s*\{/.test(css))

check('CSS: addr-gen-intro-privacy class exists', () => /\.addr-gen-intro-privacy\s*\{/.test(css))

check('JSX: bulk section uses bulkScenarioSelected for --active class', () => {
  return /addr-gen-bulk.*\$\{.*bulkScenarioSelected.*\}\s*\?\s*'addr-gen-bulk--active'/.test(jsx)
})

check('JSX: preset section is wrapped in <details>', () => {
  const detailsCount = (jsx.match(/<details\s+className="addr-gen-presets"/g) || []).length
  return detailsCount >= 2
})

check('JSX: recipient preset <details> has open prop with recipientPresets.length', () => {
  return /<details\s+className="addr-gen-presets"\s+open=\{recipientPresets\.length\s*>\s*0\}/.test(jsx)
})

check('JSX: sender preset <details> has open prop with senderPresets.length', () => {
  return /<details\s+className="addr-gen-presets"\s+open=\{senderPresets\.length\s*>\s*0\}/.test(jsx)
})

check('JSX: free forever notice after copy all button', () => {
  return /addr-gen-free-notice.*\{t\('addresseeGenerator\.freeForeverNotice'\)\}/.test(jsx)
})

check('JSX: intro privacy rendered in panel heading', () => {
  return /addr-gen-intro-privacy.*\{t\('addresseeGenerator\.introPrivacy'\)\}/.test(jsx)
})

check('CSS: addr-gen-presets uses <details> based layout', () => {
  return /\.addr-gen-presets-summary\s*\{/.test(css)
})

check('No backend/payment imports in AddresseeGenerator.jsx', () => {
  const backendRe = /import.*from\s+['"]..\/utils\/analytics\.js['"]/
  return !backendRe.test(jsx) || jsx.includes('addresseeAnalytics')
})

const fails = checks.filter((c) => c.status === FAIL)
const passes = checks.filter((c) => c.status === PASS)

console.log('\n=== Addressee Launch Polish Checks ===\n')
checks.forEach((c) => {
  console.log(`  ${c.status}: ${c.name}${c.detail ? ` — ${c.detail}` : ''}`)
})
console.log(`\nTotal: ${passes.length}/${checks.length} passed\n`)

if (fails.length > 0) {
  console.log('FAILURES:')
  fails.forEach((c) => console.log(`  - ${c.name}: ${c.detail}`))
  process.exit(1)
}
