const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.PRODUCTION_URL || 'https://qsen.ru';
const USE_LOCAL = process.argv.includes('--local');
const LOCAL_DIST = path.join(process.cwd(), 'dist');
const TIMEOUT_MS = 10000;

function fetchUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: TIMEOUT_MS }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
  });
}

function checkLocalFile(filePath) {
  const fullPath = path.join(LOCAL_DIST, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    return {
      exists: true,
      status: 200,
      size: content.length,
      hasCanonical: content.includes('<link rel="canonical"'),
      hasOgTitle: content.includes('<meta property="og:title"'),
      hasDescription: content.includes('<meta name="description"'),
      hasHreflang: content.includes('hreflang'),
    };
  }
  return { exists: false, status: 404 };
}

function extractMeta(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1] : null;
}

async function checkUrl(url) {
  const result = { url, status: 0, issues: [] };

  if (USE_LOCAL) {
    const pathname = new URL(url).pathname;
    const indexPath = pathname.endsWith('/') ? pathname + 'index.html' : pathname + '/index.html';
    const fileResult = checkLocalFile(indexPath);
    result.exists = fileResult.exists;
    result.status = fileResult.status;
    if (fileResult.exists) {
      result.hasCanonical = fileResult.hasCanonical;
      result.hasOgTitle = fileResult.hasOgTitle;
      result.hasDescription = fileResult.hasDescription;
      result.hasHreflang = fileResult.hasHreflang;
    }
  } else {
    const res = await fetchUrl(url);
    result.status = res.status;
    if (res.status === 200 && res.body) {
      result.hasCanonical = res.body.includes('<link rel="canonical"');
      result.hasOgTitle = res.body.includes('<meta property="og:title"');
      result.hasDescription = res.body.includes('<meta name="description"');
      result.hasHreflang = res.body.includes('hreflang');
      result.title = extractMeta(res.body, /<title>([^<]+)<\/title>/);
      result.ogTitle = extractMeta(res.body, /<meta property="og:title" content="([^"]+)"/);
      result.description = extractMeta(res.body, /<meta name="description" content="([^"]+)"/);
      result.canonical = extractMeta(res.body, /<link rel="canonical" href="([^"]+)"/);
    }
  }

  if (result.status === 0) result.issues.push('UNREACHABLE');
  else if (result.status !== 200) result.issues.push(`HTTP_${result.status}`);
  if (!result.hasCanonical) result.issues.push('NO_CANONICAL');
  if (!result.hasOgTitle) result.issues.push('NO_OG_TITLE');
  if (!result.hasDescription) result.issues.push('NO_DESCRIPTION');
  if (!result.hasHreflang) result.issues.push('NO_HREFLANG');

  return result;
}

async function main() {
  console.log('=== Production SEO Health Check ===');
  console.log(`Mode: ${USE_LOCAL ? 'LOCAL (dist/)' : 'HTTP (production)'}`);
  console.log(`Base URL: ${BASE_URL}\n`);

  const priorityFile = path.join(process.cwd(), 'reports', 'indexation-priority-urls.json');
  let priorityUrls = [];

  if (fs.existsSync(priorityFile)) {
    const data = JSON.parse(fs.readFileSync(priorityFile, 'utf8'));
    priorityUrls = [
      ...data.priorities.P0.map(u => u.url),
      ...data.priorities.P1.map(u => u.url),
      ...data.priorities.P2.slice(0, 20).map(u => u.url),
    ];
  }

  if (priorityUrls.length === 0) {
    console.log('No priority URLs found. Add --all to check sitemap URLs.');
    if (process.argv.includes('--all')) {
      const sitemapPath = path.join(LOCAL_DIST, 'sitemap.xml');
      if (fs.existsSync(sitemapPath)) {
        const sitemap = fs.readFileSync(sitemapPath, 'utf8');
        const locMatches = sitemap.match(/<loc>([^<]+)<\/loc>/g) || [];
        priorityUrls = locMatches.map(m => m.replace(/<\/?loc>/g, ''));
      }
    }
  }

  if (priorityUrls.length === 0) {
    console.log('No URLs to check. Run with --local or --all.');
    return;
  }

  console.log(`Checking ${priorityUrls.length} URLs...\n`);
  const results = [];
  for (const url of priorityUrls) {
    process.stdout.write('.');
    results.push(await checkUrl(url));
  }
  console.log('\n');

  const passed = results.filter(r => r.issues.length === 0);
  const failed = results.filter(r => r.issues.length > 0);

  console.log(`=== Summary ===`);
  console.log(`Total: ${results.length} | Passed: ${passed.length} | Failed: ${failed.length}\n`);

  if (failed.length > 0) {
    console.log('=== Failed Checks ===');
    failed.forEach(r => {
      console.log(`\n[${r.status}] ${r.url}`);
      console.log(`  Issues: ${r.issues.join(', ')}`);
      if (r.title) console.log(`  Title: ${r.title.substring(0, 60)}`);
      if (r.canonical) console.log(`  Canonical: ${r.canonical}`);
    });
  }

  const report = {
    timestamp: new Date().toISOString(),
    mode: USE_LOCAL ? 'local' : 'production',
    baseUrl: BASE_URL,
    total: results.length,
    passed: passed.length,
    failed: failed.length,
    results,
  };

  const reportPath = path.join(process.cwd(), 'reports', 'seo-health-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved: ${reportPath}`);

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(console.error);
