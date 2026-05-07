const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.PRODUCTION_URL || 'https://qsen.ru';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const INDEXNOW_HOST = process.env.INDEXNOW_HOST || 'qsen.ru';
const DRY_RUN = !process.argv.includes('--submit');
const PRIORITY = process.argv.includes('--priority');
const BATCH_SIZE = 500;

function getSitemapUrls() {
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) return [];
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const locMatches = sitemap.match(/<loc>([^<]+)<\/loc>/g) || [];
  return locMatches.map(m => m.replace(/<\/?loc>/g, ''));
}

function getPriorityUrls() {
  const priorityFile = path.join(process.cwd(), 'reports', 'indexation-priority-urls.json');
  if (!fs.existsSync(priorityFile)) return null;
  const data = JSON.parse(fs.readFileSync(priorityFile, 'utf8'));
  return [
    ...data.priorities.P0.map(u => u.url),
    ...data.priorities.P1.map(u => u.url),
    ...data.priorities.P2.map(u => u.url),
  ];
}

function submitToIndexNow(urls) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      host: INDEXNOW_HOST,
      key: INDEXNOW_KEY,
      urlList: urls,
    });

    const options = {
      hostname: 'api.indexnow.org',
      path: '/SubmitURL',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('=== IndexNow URL Submission ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no --submit)' : 'LIVE SUBMIT (--submit provided)'}`);
  console.log(`Key: ${INDEXNOW_KEY ? INDEXNOW_KEY.substring(0, 8) + '...' : 'NOT SET (set INDEXNOW_KEY env)'}`);
  console.log(`Host: ${INDEXNOW_HOST}\n`);

  let urls = [];
  if (PRIORITY) {
    const priorityUrls = getPriorityUrls();
    if (priorityUrls) {
      urls = priorityUrls;
      console.log(`Using priority URLs from indexation-priority-urls.json: ${urls.length}`);
    } else {
      console.log('No priority URLs found. Falling back to sitemap.');
      urls = getSitemapUrls();
    }
  } else {
    urls = getSitemapUrls();
    console.log(`Using sitemap URLs: ${urls.length}`);
  }

  if (urls.length === 0) {
    console.log('No URLs to submit.');
    return;
  }

  console.log(`\nURLs to submit: ${urls.length}`);

  if (DRY_RUN) {
    console.log('\nDry run - first 10 URLs:');
    urls.slice(0, 10).forEach(url => console.log(`  ${url}`));
    if (urls.length > 10) console.log(`  ... and ${urls.length - 10} more`);
    console.log('\nRun with --submit to actually submit to IndexNow.');
    return;
  }

  if (!INDEXNOW_KEY) {
    console.error('INDEXNOW_KEY env is not set. Cannot submit.');
    process.exit(1);
  }

  const batches = [];
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    batches.push(urls.slice(i, i + BATCH_SIZE));
  }

  console.log(`Submitting in ${batches.length} batch(es)...`);
  const results = [];
  for (let i = 0; i < batches.length; i++) {
    process.stdout.write(`Batch ${i + 1}/${batches.length}...`);
    try {
      const res = await submitToIndexNow(batches[i]);
      results.push({ batch: i + 1, status: res.status, ok: res.status === 200 });
      console.log(` HTTP ${res.status}`);
    } catch (e) {
      results.push({ batch: i + 1, error: e.message });
      console.log(` ERROR: ${e.message}`);
    }
  }

  const succeeded = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;

  console.log(`\n=== Summary ===`);
  console.log(`Total batches: ${results.length} | Succeeded: ${succeeded} | Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed batches:');
    results.filter(r => !r.ok).forEach(r => {
      if (r.error) console.log(`  Batch ${r.batch}: ${r.error}`);
      else console.log(`  Batch ${r.batch}: HTTP ${r.status}`);
    });
  }

  const report = {
    timestamp: new Date().toISOString(),
    mode: 'submit',
    host: INDEXNOW_HOST,
    totalUrls: urls.length,
    batches: results.length,
    succeeded,
    failed,
    results,
  };

  const reportPath = path.join(process.cwd(), 'reports', 'indexnow-submission-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved: ${reportPath}`);
}

main().catch(console.error);
