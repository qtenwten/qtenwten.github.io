import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getAllLocalizedSeoPages, getLocalizedRouteUrl } from '../src/config/routeSeo.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../dist')
const publicPath = path.resolve(__dirname, '../public')
const templatePath = path.join(distPath, 'index.html')
const ROOT_REDIRECT_URL = 'https://qsen.ru/ru/'

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function replaceOrInsert(html, pattern, replacement, anchorPattern) {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement)
  }

  return html.replace(anchorPattern, `${replacement}\n$&`)
}

function buildStructuredData({ language, title, description, url }) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url,
    description,
    inLanguage: language,
    isPartOf: {
      '@type': 'WebSite',
      name: 'QSEN.RU',
      url: 'https://qsen.ru',
    },
  })
}

function buildAlternateLinks(pathName) {
  const ruUrl = getLocalizedRouteUrl('ru', pathName)
  const enUrl = getLocalizedRouteUrl('en', pathName)

  return [
    `<link rel="alternate" hreflang="ru" href="${ruUrl}" />`,
    `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
    `<link rel="alternate" hreflang="x-default" href="${ruUrl}" />`,
  ].join('\n    ')
}

function buildSeoTags(page) {
  const alternateLinks = buildAlternateLinks(page.path)

  return `
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="keywords" content="${escapeHtml(page.keywords)}" />
    <link rel="canonical" href="${page.url}" />
    ${alternateLinks}
    <meta property="og:site_name" content="QSEN.RU" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${page.url}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${page.image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="${page.locale}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${page.image}" />
    <meta name="robots" content="${page.robots}" />
    <meta name="googlebot" content="${page.robots}" />
    <meta name="yandex" content="${page.robots}" />
  `.trim()
}

function injectSeo(template, page) {
  const seoTags = buildSeoTags(page)
  const structuredData = buildStructuredData(page)

  let html = template
    .replace(/<html lang="[^"]*">/, `<html lang="${page.language}">`)
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`)

  html = html.replace(/<meta name="description" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="keywords" content=".*?" \/>\s*/g, '')
  html = html.replace(/<link rel="canonical" href=".*?" \/>\s*/g, '')
  html = html.replace(/<link rel="alternate" hreflang=".*?" href=".*?" \/>\s*/g, '')
  html = html.replace(/<meta property="og:(site_name|title|description|url|type|image|image:width|image:height|locale)" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="twitter:(card|title|description|image)" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="robots" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="googlebot" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="yandex" content=".*?" \/>\s*/g, '')

  html = replaceOrInsert(
    html,
    /<meta name="description" content=".*?" \/>/,
    seoTags,
    /<link rel="icon"/,
  )

  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${structuredData}</script>`)
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root"><div><h1>${escapeHtml(page.h1)}</h1><p>${escapeHtml(page.description)}</p></div></div>`
  )

  return html
}

function writeFileSafely(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf-8')
}

function generatePage(template, page) {
  const outputPath = path.join(distPath, page.route, 'index.html')
  writeFileSafely(outputPath, injectSeo(template, page))
  console.log(`✓ Generated: ${page.route}`)
}

function buildRootRedirectPage(template) {
  let html = template
    .replace(/<html lang="[^"]*">/, '<html lang="ru">')
    .replace(/<title>.*?<\/title>/, '<title>Redirecting to QSEN.RU</title>')

  html = html.replace(/<meta name="description" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="keywords" content=".*?" \/>\s*/g, '')
  html = html.replace(/<link rel="canonical" href=".*?" \/>\s*/g, '')
  html = html.replace(/<link rel="alternate" hreflang=".*?" href=".*?" \/>\s*/g, '')
  html = html.replace(/<meta property="og:(site_name|title|description|url|type|image|image:width|image:height|locale)" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="twitter:(card|title|description|image)" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="robots" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="googlebot" content=".*?" \/>\s*/g, '')
  html = html.replace(/<meta name="yandex" content=".*?" \/>\s*/g, '')
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')

  const redirectMeta = `
    <meta name="description" content="Redirecting to the default language version of QSEN.RU." />
    <link rel="canonical" href="${ROOT_REDIRECT_URL}" />
    <meta name="robots" content="noindex,follow" />
    <meta http-equiv="refresh" content="0; url=${ROOT_REDIRECT_URL}" />
    <script>window.location.replace('${ROOT_REDIRECT_URL}' + window.location.search + window.location.hash)</script>
  `.trim()

  html = replaceOrInsert(html, /<meta name="description" content=".*?" \/>/, redirectMeta, /<link rel="icon"/)
  html = html.replace(/<div id="root"><\/div>/, '<div id="root"></div>')

  return html
}

function buildSitemap(pages) {
  const items = pages
    .filter((page) => page.includeInSitemap !== false)
    .map((page) => {
    const cleanPath = page.path
    const ruUrl = getLocalizedRouteUrl('ru', cleanPath)
    const enUrl = getLocalizedRouteUrl('en', cleanPath)

    return `  <url>
    <loc>${page.url}</loc>
    <xhtml:link rel="alternate" hreflang="ru" href="${ruUrl}" />
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${ruUrl}" />
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>${cleanPath === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${cleanPath === '/' ? '1.0' : cleanPath === '/seo-audit-pro' ? '0.9' : '0.8'}</priority>
  </url>`
    }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${items}
</urlset>
`
}

function main() {
  console.log('🚀 Starting pre-render generation...\n')

  if (!fs.existsSync(distPath)) {
    console.error('❌ dist/ folder not found!')
    process.exit(1)
  }

  if (!fs.existsSync(templatePath)) {
    console.error('❌ dist/index.html not found!')
    process.exit(1)
  }

  const template = fs.readFileSync(templatePath, 'utf-8')
  const pages = getAllLocalizedSeoPages()

  pages.forEach((page) => generatePage(template, page))

  writeFileSafely(path.join(distPath, 'index.html'), buildRootRedirectPage(template))

  const sitemap = buildSitemap(pages)
  writeFileSafely(path.join(distPath, 'sitemap.xml'), sitemap)
  writeFileSafely(path.join(publicPath, 'sitemap.xml'), sitemap)

  console.log(`\n✅ Successfully generated ${pages.length} pages`)
  console.log('📁 Output: dist/ folder with pre-rendered HTML, redirect root, and sitemap\n')
}

main()
