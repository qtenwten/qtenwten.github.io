# Daily article automation for Qsen

This runbook is for the recurring ChatGPT/Codex agent that creates and publishes
daily Qsen articles.

## Goal

Every day at 09:00, prepare and publish exactly:

- 3 Russian articles
- 3 English articles
- 3 RU/EN translation pairs

Each RU/EN pair must share the same `translation_key`.

## Required preflight

1. Check the branch:

```powershell
git rev-parse --abbrev-ref HEAD
```

The only valid branch is `main`. If the branch is not `main`, stop.

2. Read these files before writing articles:

- `AGENTS.md`
- `BD/AGENTS.md`
- `BD/ARTICLE_AUTHORING_GUIDE.md`
- `BD/DB_CONTEXT.md`
- `BD/ARTICLE_WORKFLOW.md`
- `BD/ARTICLE_PUBLISHING_RUNBOOK.md`
- `BD/ARTICLE_PROMPT_SHORTCUTS.md`

3. Do not reveal, print, commit, or copy secrets:

- `BD/article-publisher.env`
- `ARTICLE_API_BASE_URL`
- `ARTICLE_ADMIN_TOKEN`

4. Do not commit or publish files from:

- `BD/content-staging/`

5. Do not use, edit, push, or deploy from `gh-pages`.

## Daily workspace

Create one isolated directory per run:

```text
BD/content-staging/daily-YYYY-MM-DD/
```

Put exactly 6 JSON files there.

Recommended filename format:

```text
ru-<slug>.json
en-<slug>.json
```

## Article requirements

Each JSON article must include:

- `language`
- `translation_key`
- `tool_slug`
- `slug`
- `title`
- `excerpt`
- `content`
- `status`
- `author`
- `cover_image`
- `seo_title`
- `seo_description`

Rules:

- `language` must be `ru` or `en`.
- `status` must be `published` only for complete, useful articles.
- RU and EN versions of one topic must share one `translation_key`.
- RU and EN slugs may differ.
- RU content must use only `/ru/...` CTA/internal tool links.
- EN content must use only `/en/...` CTA/internal tool links.
- Each article should include a CTA near the top and near the end.
- Do not create thin, filler, duplicate, or test content.
- Do not publish if UTF-8 looks broken or if RU text contains `???`.

## Validation and publishing

Dry run first:

```powershell
node scripts/article-agent/publish-daily-batch.mjs --dir "BD/content-staging/daily-YYYY-MM-DD" --dry-run
```

Publish only if dry run passes:

```powershell
node scripts/article-agent/publish-daily-batch.mjs --dir "BD/content-staging/daily-YYYY-MM-DD" --publish
```

The script:

- checks exactly 3 RU + 3 EN JSON files
- checks required fields
- checks translation pairing
- checks language-specific CTA links
- checks basic UTF-8 corruption patterns
- scans the Worker public API for duplicate slugs and duplicate `translation_key + language`
- posts to `POST /admin/articles`
- checks each result through `GET /articles/:slug`

The script reads secrets from environment variables and can also read the local
ignored file:

```text
BD/article-publisher.env
```

## Build and deploy refresh

After successful publish:

```powershell
npm run build
npm run verify:articles-html
```

If the repository can push to `main`, trigger a Pages deploy with a simple empty
commit only when the index is clean and no user changes are staged:

```powershell
git diff --cached --quiet
git commit --allow-empty -m "Refresh article prerender"
git push origin main
```

If pushing is unavailable, report that D1 publication succeeded but static
prerender deploy needs a refresh from `main`.

## Final report

Report:

- all 6 articles
- `id`, `language`, `translation_key`, `tool_slug`, `slug`, `title`, `status`
- public article URLs
- tool CTA URLs
- duplicate-check result
- UTF-8 check result
- build result
- deploy trigger result
- live verification result

Never include tokens or private env values in the report.
