# Database and article publishing context

## Overview
Articles are NOT stored in the frontend code as the source of truth.
Articles are stored in Cloudflare D1 and served through a separate Cloudflare Worker API.

Frontend pages render article content, but the source of truth is D1.

---

## Storage
Database: Cloudflare D1

Main table:
- `articles`

Expected article fields include:
- `id`
- `language` (`ru` / `en`)
- `translation_key` (stable shared translation group id)
- `slug`
- `title`
- `excerpt`
- `content`
- `status`
- `author`
- `cover_image`
- `seo_title`
- `seo_description`
- `published_at`
- `updated_at`

---

## Worker API
The Worker API is separate from the frontend repository.

Public routes:
- `GET /articles`
- `GET /articles/:slug`

Admin routes:
- `POST /admin/articles`
- `PATCH /admin/articles/:id`
- `POST /admin/articles/:id/publish`

The Worker uses:
- D1 binding
- ADMIN_TOKEN secret
- CORS allowlist for localhost and production domains

Important:
The Worker code is not stored in this frontend repo.
Do not search for Worker implementation in the frontend repo and assume it exists here.

---

## Local publishing files
The following files are used for local article publishing:

- `BD/article-publisher.env` — local secrets, must never be committed
- `BD/article.template.json` — template for article payloads
- `BD/content-staging/` — temporary article JSON files
- `BD/publish-article.ps1` — publishes article to Worker API
- `BD/check-article.ps1` — checks article by slug
- `BD/ARTICLE_PUBLISHING_RUNBOOK.md` — full agent runbook from planning through live verification and repair

---

## Secret file
Expected local env file:
- `BD/article-publisher.env`

Example content:

ARTICLE_API_BASE_URL=https://fancy-scene-deeb.qten.workers.dev
ARTICLE_ADMIN_TOKEN=YOUR_REAL_TOKEN

Never commit this file.

---

## Publishing workflow
1. Create article JSON in `BD/content-staging/`
2. Use `BD/article.template.json` as schema reference
3. Publish with:

powershell -ExecutionPolicy Bypass -File ".\BD\publish-article.ps1" ".\BD\content-staging\<file>.json"

4. Check with:

powershell -ExecutionPolicy Bypass -File ".\BD\check-article.ps1" "<slug>"

## Multilingual rules (required)
- `language` must be set to `ru` or `en`
- `translation_key` must be set for every article
- RU/EN versions of the same article must share the same `translation_key`
- RU/EN slugs can differ; pairing is done via `translation_key`

---

## Frontend article system
The frontend already includes:
- article list page
- article detail page
- prerender article index data
- prerender article detail pages
- sessionStorage fallback cache
- SEO integration
- sitemap integration
- related articles
- homepage latest articles block

Important:
Do not break the current article routing or prerender flow.

---

## Current routing
Article routes include:
- `/ru/articles`
- `/en/articles`
- `/ru/articles/:slug`
- `/en/articles/:slug`

There may also be language redirects from `/articles`.

---

## Reliability architecture
The article system no longer depends entirely on live browser fetch to `workers.dev`.

Current behavior:
- build-time prerender fetches article data
- initial payload is embedded into prerendered HTML
- browser reads initial data first
- sessionStorage cache is used as fallback
- live fetch is delayed/background and not required for first render

Do not accidentally remove this architecture.

---

## UI notes
Articles:
- use CTA links to real tools
- should not show debug links like Worker API links in production UI

QR Code Generator:
- has already received multiple UX/UI fixes
- do not break sticky preview behavior
- do not reintroduce layout shifts when logo is uploaded
- metric cards are fixed-height and should remain stable
- preview should feel premium and stable

---

## Git branch safety for publishing workflow

All repository changes related to articles, publishing scripts, configs, checks, content preparation, or frontend integration must be made only in:

- `main`

Rules:

- Never commit publishing-related changes to `gh-pages`
- Never push publishing-related changes to `gh-pages`
- Never switch to `gh-pages` for article work, script edits, checks, or deployment preparation
- Never replace `main` files with content from `gh-pages`
- Always verify the active branch before running git commands
- If the active branch is not `main`, stop and return to `main`

Important:
Even if GitHub Pages uses `gh-pages`, that branch is not the editable source of truth for article or frontend work. The editable source of truth is always `main`.

## Safe rules for future agents
When editing article-related code:
- preserve prerender
- preserve initial data injection
- preserve sessionStorage cache fallback
- preserve sitemap article routes
- preserve related articles
- preserve SEO title/description behavior

When editing publishing workflow:
- do not expose token values
- do not commit local env files
- do not replace D1 as source of truth

When editing QR generator:
- preserve live preview
- preserve stable preview layout
- preserve fixed metric-card geometry
- preserve logo upload without layout shift
