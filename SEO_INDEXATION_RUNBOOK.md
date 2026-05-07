# SEO Indexation Runbook

## Overview

This document describes the indexation acceleration workflow for qsen.ru, covering Google Search Console, Yandex.Webmaster, and IndexNow submission.

## Priority URL List

File: `reports/indexation-priority-urls.json`

Pre-computed list of all site URLs ranked by indexation priority:

- **P0** (22 URLs): Critical entry points — homepages, articles hubs, addressee tool + its 2 articles, QR generator, main business tools
- **P1** (22 URLs): Secondary tool pages — calculator, date tools, SEO tools, random tools, legal pages
- **P2** (60 URLs): Article content — all remaining articles from sitemap

## Daily Health Check

Run after deployment to verify pages return correct HTTP status and contain required SEO elements.

### Local check (fast, no network)

```powershell
npm run check:production-seo-health -- --local
```

Checks `dist/` files for:
- HTTP 200 status (inferred from file existence)
- `<link rel="canonical">` presence
- `<meta property="og:title">` presence
- `<meta name="description">` presence
- `hreflang` attributes presence

### Production check (real HTTP requests)

```powershell
npm run check:production-seo-health
```

Makes real HTTP requests to `https://qsen.ru` and validates:
- All above elements
- Title content
- Canonical URL value

### Check specific URLs only

The script reads from `reports/indexation-priority-urls.json` by default. Use `--priority` for all priority URLs or `--all` to check all sitemap URLs.

```powershell
npm run check:production-seo-health -- --local --all
```

## Google Search Console

### Submit sitemap

1. Go to https://search.google.com/search-console
2. Select property: qsen.ru
3. Navigate to Sitemaps
4. Submit/revalidate: `https://qsen.ru/sitemap.xml`

### Fetch as Google

For P0 pages that need immediate indexation:

1. Go to URL Inspection
2. Paste: `https://qsen.ru/ru/`
3. Click "Request indexing"

### Coverage report

Monitor the Coverage section after deployment:
- **Error** pages: Fix immediately
- **Valid with warnings**: Investigate hreflang/canonical issues
- **Valid**: No action needed

## Yandex.Webmaster

### Submit sitemap

1. Go to https://webmaster.yandex.com
2. Select site: qsen.ru
3. Navigate to Indexing → Sitemaps
4. Add sitemap: `https://qsen.ru/sitemap.xml`

### Fetch as Yandex

For P0 pages:

1. Go to Indexing → Fetch as bot
2. Enter URL: `https://qsen.ru/ru/`
3. Click "Fetch"

## IndexNow Integration

IndexNow (indexnow.org) allows simultaneous submission to multiple search engines (Bing, Yandex, Naver, etc.).

### Setup

1. Register at https://www.indexnow.org/ (optional — some engines accept submissions without registration)
2. Set environment variables:
   ```powershell
   $env:INDEXNOW_KEY = "your-key-from-indexnow"
   $env:INDEXNOW_HOST = "qsen.ru"
   ```

   Or add to `BD/article-publisher.env`:
   ```
   INDEXNOW_KEY=your-key-from-indexnow
   INDEXNOW_HOST=qsen.ru
   ```

3. Verify key file exists at your domain root:
   ```
   https://qsen.ru/your-indexnow-key.txt
   ```
   (Create this file manually in Cloudflare Pages deployment)

### Dry run (preview URLs only)

```powershell
npm run indexnow:prepare
```

Shows first 10 URLs that would be submitted without making any requests.

### Submit all sitemap URLs

```powershell
npm run indexnow:submit
```

Submits all URLs from `public/sitemap.xml` to IndexNow API.

### Submit priority URLs only (faster)

```powershell
npm run indexnow:submit -- --priority
```

Submits only P0 + P1 + P2 URLs from `reports/indexation-priority-urls.json`.

### Verify submission

Check the generated report:

```powershell
# View last submission report
Get-Content reports/indexnow-submission-report.json | ConvertFrom-Json | Select-Object -ExpandProperty results
```

## Deployment Checklist

After each deployment to production:

1. [ ] Run local SEO health check: `npm run check:production-seo-health -- --local`
2. [ ] Fix any FAILED checks before proceeding
3. [ ] Submit sitemap in Google Search Console
4. [ ] Submit sitemap in Yandex.Webmaster
5. [ ] For new tools/articles: Fetch as Google for P0 URLs
6. [ ] Run IndexNow submission: `npm run indexnow:submit -- --priority`
7. [ ] Monitor Coverage (GSC) and Indexing (Yandex) for errors

## Monitoring

### Weekly

- Review GSC Coverage report for new errors
- Check indexing speed for new pages in GSC Performance
- Review Yandex Webmaster for crawl errors

### After major content updates

- Re-submit affected P0 URLs via Fetch as Google / Yandex
- Run full health check: `npm run check:production-seo-health`
- If new articles added, update priority list:

```powershell
# Re-generate priority URLs after new article publishes
# (manual update to reports/indexation-priority-urls.json)
```

## Troubleshooting

### "HTTP_404" on health check

Page not found in production. Check:
- Build output includes the page
- Cloudflare Pages routing correct
- Sitemap URL matches actual page path

### "NO_CANONICAL" on health check

Page missing `<link rel="canonical">`. This is a bug — all pages must have canonical.

### IndexNow "400 Bad Request"

- Verify INDEXNOW_KEY is correct
- Verify key file exists at `https://qsen.ru/{INDEXNOW_KEY}.txt`
- Verify host matches the registered domain

### GSC "Blocked by robots.txt"

Check `public/robots.txt` — ensure page is not in `Disallow:` list.

### GSC "Duplicate, not selected as canonical"

- Check canonical tag points to correct URL
- Check hreflang annotations are symmetric (each language version lists all others)
- Ensure correct page is set as canonical (usually RU version for x-default)

## Scripts Reference

| Script | Command | Purpose |
|--------|---------|---------|
| SEO health local | `npm run check:production-seo-health -- --local` | Fast check of dist/ files |
| SEO health full | `npm run check:production-seo-health` | Production HTTP check |
| IndexNow prepare | `npm run indexnow:prepare` | Preview URLs (dry run) |
| IndexNow submit | `npm run indexnow:submit` | Submit sitemap to IndexNow |
| IndexNow priority | `npm run indexnow:submit -- --priority` | Submit priority URLs only |

## Reports

- `reports/seo-health-report.json` — output of health check
- `reports/indexnow-submission-report.json` — output of IndexNow submission
- `reports/indexation-priority-urls.json` — curated priority URL list

These files are git-tracked. Commit after any manual updates.
