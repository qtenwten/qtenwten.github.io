const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const failures = []

function fail(message) {
  failures.push(message)
  console.error(`  FAIL: ${message}`)
}

function pass(message) {
  console.log(`  PASS: ${message}`)
}

function assertIncludes(html, marker, context) {
  if (!html.includes(marker)) {
    fail(`${context} missing marker: ${marker}`)
    return
  }

  pass(`${context} contains: ${marker}`)
}

const pages = [
  {
    route: 'ru/generator-adresata',
    canonical: 'https://qsen.ru/ru/generator-adresata/',
    hreflang: 'https://qsen.ru/en/generator-adresata/',
    articleHref: '/ru/articles/generator-adresata-kak-pravilno-ukazat-adresata/',
    markers: [
      'addressee-prerender-page',
      'Генератор адресата и обращения',
      'Что делает генератор адресата',
      'Когда пригодится инструмент',
      'Пример результата',
      'Что важно проверить вручную',
      'Экспорт документов',
      'Полезная статья',
      'FAQ',
      'Кому: Генеральному директору ООО',
    ],
  },
  {
    route: 'en/generator-adresata',
    canonical: 'https://qsen.ru/en/generator-adresata/',
    hreflang: 'https://qsen.ru/ru/generator-adresata/',
    articleHref: '/en/articles/how-to-write-addressee-in-business-letter/',
    markers: [
      'addressee-prerender-page',
      'Addressee &amp; Salutation Generator',
      'What the addressee generator does',
      'When to use this tool',
      'Example result',
      'What to review manually',
      'Document export',
      'Useful article',
      'FAQ',
      'To: CEO of Acme Ltd',
    ],
  },
]

console.log('\n=== Addressee Prerender Content Checks ===')

pages.forEach((page) => {
  const htmlPath = path.join(distDir, ...page.route.split('/'), 'index.html')
  const context = page.route

  if (!fs.existsSync(htmlPath)) {
    fail(`${context} generated HTML is missing: ${path.relative(rootDir, htmlPath)}`)
    return
  }

  const html = fs.readFileSync(htmlPath, 'utf-8')

  assertIncludes(html, 'data-no-hydrate="true"', context)
  assertIncludes(html, `<link rel="canonical" href="${page.canonical}" />`, context)
  assertIncludes(html, `href="${page.hreflang}"`, context)
  assertIncludes(html, `href="${page.articleHref}"`, context)
  assertIncludes(html, '<div class="related-tools">', context)

  page.markers.forEach((marker) => assertIncludes(html, marker, context))

  if (html.includes('prerender-tool-setting')) {
    fail(`${context} still contains the generic tool shell placeholder`)
  } else {
    pass(`${context} does not contain the generic tool shell placeholder`)
  }
})

if (failures.length) {
  console.error(`\nAddressee prerender content checks failed: ${failures.length} issue(s)`)
  process.exit(1)
}

console.log('\nAll addressee prerender content checks passed.')
