const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')

const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const sitemapPaths = [
  path.join(distDir, 'sitemap.xml'),
  path.join(rootDir, 'public', 'sitemap.xml'),
].filter((filePath) => fs.existsSync(filePath))

const failures = []

function fail(message) {
  failures.push(message)
  console.error(`  FAIL: ${message}`)
}

function pass(message) {
  console.log(`  PASS: ${message}`)
}

function extractAttributes(tag) {
  const attrs = {}
  const attrRe = /([a-zA-Z:-]+)="([^"]*)"/g
  let match

  while ((match = attrRe.exec(tag)) !== null) {
    attrs[match[1]] = match[2]
  }

  return attrs
}

function extractSeoLinks(html) {
  const links = []
  const linkRe = /<link\b[^>]*>/g
  let match

  while ((match = linkRe.exec(html)) !== null) {
    links.push(extractAttributes(match[0]))
  }

  return {
    canonical: links.find((link) => link.rel === 'canonical')?.href || '',
    alternates: links.filter((link) => link.rel === 'alternate' && link.href),
  }
}

function extractSitemapUrls(sitemap) {
  const urls = []
  const locRe = /<loc>([^<]+)<\/loc>/g
  const hrefRe = /<xhtml:link\b[^>]*\bhref="([^"]+)"/g
  let match

  while ((match = locRe.exec(sitemap)) !== null) {
    urls.push({ type: 'loc', url: match[1] })
  }

  while ((match = hrefRe.exec(sitemap)) !== null) {
    urls.push({ type: 'hreflang', url: match[1] })
  }

  return urls
}

function parseQsenUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.hostname === 'qsen.ru' ? parsed : null
  } catch {
    return null
  }
}

function hasTrailingSlash(value) {
  const parsed = parseQsenUrl(value)
  return Boolean(parsed && parsed.pathname.endsWith('/'))
}

function hasDoubleSlashInPath(value) {
  const parsed = parseQsenUrl(value)
  return Boolean(parsed && parsed.pathname.includes('//'))
}

function withoutTrailingSlash(value) {
  const parsed = parseQsenUrl(value)
  if (!parsed || parsed.pathname === '/') return value
  parsed.pathname = parsed.pathname.replace(/\/+$/, '')
  return parsed.toString()
}

function routeToHtmlPath(route) {
  const segments = route.split('/').filter(Boolean)
  return path.join(distDir, ...segments, 'index.html')
}

function htmlPathFromUrl(url) {
  const parsed = parseQsenUrl(url)
  if (!parsed) return null
  const segments = parsed.pathname.split('/').filter(Boolean)
  return path.join(distDir, ...segments, 'index.html')
}

function assertUrlHasTrailingSlash(url, context) {
  if (!hasTrailingSlash(url)) {
    fail(`${context} is missing trailing slash: ${url}`)
    return
  }

  if (hasDoubleSlashInPath(url)) {
    fail(`${context} has double slash in path: ${url}`)
  }
}

async function main() {
  console.log('\n=== SEO URL Consistency Checks ===')

  if (!sitemapPaths.length) {
    fail('sitemap.xml not found in dist/ or public/')
  }

  const routeSeo = await import(pathToFileURL(path.join(rootDir, 'src/config/routeSeo.js')).href)
  const routePages = routeSeo.getAllLocalizedSeoPages()
  const sitemapRoutePages = routePages.filter((page) => page.includeInSitemap !== false)

  for (const sitemapPath of sitemapPaths) {
    console.log(`\nSitemap: ${path.relative(rootDir, sitemapPath)}`)
    const sitemap = fs.readFileSync(sitemapPath, 'utf-8')
    const sitemapUrls = extractSitemapUrls(sitemap)
    const locUrls = sitemapUrls.filter((item) => item.type === 'loc').map((item) => item.url)
    const locSet = new Set(locUrls)
    const duplicatedLocs = locUrls.filter((url, index) => locUrls.indexOf(url) !== index)
    const articleLocs = locUrls.filter((url) => /https:\/\/qsen\.ru\/(ru|en)\/articles\/[^/]+\/$/.test(url))

    console.log(`  loc count: ${locUrls.length}`)
    console.log(`  article loc count: ${articleLocs.length}`)

    if (duplicatedLocs.length) {
      fail(`duplicate sitemap loc entries: ${[...new Set(duplicatedLocs)].join(', ')}`)
    } else {
      pass('sitemap has no duplicate loc entries')
    }

    sitemapUrls.forEach(({ type, url }) => {
      const parsed = parseQsenUrl(url)
      if (!parsed) return

      assertUrlHasTrailingSlash(url, `sitemap ${type}`)
    })
    pass('all qsen sitemap loc and hreflang URLs use trailing slash')

    sitemapRoutePages.forEach((page) => {
      const expectedUrl = routeSeo.addTrailingSlashToUrl(page.url)
      const noSlashUrl = withoutTrailingSlash(expectedUrl)

      if (!locSet.has(expectedUrl)) {
        fail(`routeSeo URL is missing from sitemap: ${expectedUrl}`)
      } else {
        pass(`routeSeo URL matches sitemap: ${expectedUrl}`)
      }

      if (noSlashUrl !== expectedUrl && locSet.has(noSlashUrl)) {
        fail(`sitemap contains no-slash duplicate: ${noSlashUrl}`)
      }
    })

    ;['https://qsen.ru/ru/', 'https://qsen.ru/en/'].forEach((homeUrl) => {
      if (!locSet.has(homeUrl)) {
        fail(`localized home URL missing from sitemap: ${homeUrl}`)
      } else {
        pass(`localized home URL present: ${homeUrl}`)
      }
    })

    articleLocs.forEach((url) => {
      assertUrlHasTrailingSlash(url, 'article sitemap loc')
    })
    pass('article sitemap URLs use trailing slash')
  }

  console.log('\nGenerated HTML')
  routePages.forEach((page) => {
    const htmlPath = routeToHtmlPath(page.route)
    if (!fs.existsSync(htmlPath)) {
      fail(`generated HTML missing for route ${page.route}`)
      return
    }

    const html = fs.readFileSync(htmlPath, 'utf-8')
    const { canonical, alternates } = extractSeoLinks(html)
    const expectedCanonical = routeSeo.addTrailingSlashToUrl(page.url)

    if (canonical !== expectedCanonical) {
      fail(`canonical mismatch for ${page.route}: expected ${expectedCanonical}, got ${canonical || '(missing)'}`)
    } else {
      pass(`canonical matches route URL for ${page.route}`)
    }

    alternates.forEach((alternate) => {
      assertUrlHasTrailingSlash(alternate.href, `hreflang ${alternate.hreflang || 'unknown'} for ${page.route}`)
    })
  })
  pass('generated route canonical and hreflang URLs use trailing slash')

  const distSitemapPath = path.join(distDir, 'sitemap.xml')
  if (fs.existsSync(distSitemapPath)) {
    const sitemap = fs.readFileSync(distSitemapPath, 'utf-8')
    const articleUrls = extractSitemapUrls(sitemap)
      .filter((item) => item.type === 'loc' && /https:\/\/qsen\.ru\/(ru|en)\/articles\/[^/]+\/$/.test(item.url))
      .map((item) => item.url)

    articleUrls.forEach((url) => {
      const htmlPath = htmlPathFromUrl(url)
      if (!htmlPath || !fs.existsSync(htmlPath)) {
        fail(`generated article HTML missing for sitemap URL: ${url}`)
        return
      }

      const html = fs.readFileSync(htmlPath, 'utf-8')
      const { canonical, alternates } = extractSeoLinks(html)

      assertUrlHasTrailingSlash(canonical, `article canonical for ${url}`)
      alternates.forEach((alternate) => {
        assertUrlHasTrailingSlash(alternate.href, `article hreflang ${alternate.hreflang || 'unknown'} for ${url}`)
      })
    })
    pass('generated article canonical and hreflang URLs use trailing slash')
  }

  if (failures.length) {
    console.error(`\nSEO URL consistency failed: ${failures.length} issue(s)`)
    process.exit(1)
  }

  console.log('\nAll SEO URL consistency checks passed.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
