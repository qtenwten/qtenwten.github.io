# Article publish queue for external agents

Use this workflow when an external ChatGPT agent can write to GitHub but cannot
reach the Worker API directly.

The agent does **not** need `ARTICLE_ADMIN_TOKEN`.

## How it works

1. The agent creates daily JSON files in a tracked queue directory:

```text
BD/article-publish-queue/daily-YYYY-MM-DD/
```

2. The agent commits the 6 JSON files to `main`.
3. GitHub Actions runs `.github/workflows/publish-article-queue.yml`.
4. The GitHub runner reads repository secrets:

```text
ARTICLE_API_BASE_URL
ARTICLE_ADMIN_TOKEN
```

5. The runner validates the batch, publishes to Worker/D1, builds the site, and
deploys GitHub Pages from `main`.

## Daily batch rules

All article text must follow `BD/ARTICLE_EDITORIAL_STANDARD.md`.

Each queue directory must contain exactly:

- 3 RU JSON articles
- 3 EN JSON articles
- 3 RU/EN pairs

Every pair must share one `translation_key`.

Each article must have:

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

- `language` is only `ru` or `en`.
- `status` must be `published`.
- RU content uses only `/ru/...` CTA/tool links.
- EN content uses only `/en/...` CTA/tool links.
- Each article has CTA near the top and near the end.
- Do not commit secrets.
- Do not commit `BD/article-publisher.env`.
- Do not use `BD/content-staging/` for the GitHub queue.
- Do not touch `gh-pages`.

## Small test batch

For a one-time publishing smoke test, use a directory whose name starts with
`test-`:

```text
BD/article-publish-queue/test-YYYY-MM-DD-short-topic/
```

Test batches must contain exactly:

- 1 RU JSON article
- 1 EN JSON article
- 1 RU/EN pair with one shared `translation_key`

The GitHub Actions workflow detects `test-*` directories and validates them as
1 RU + 1 EN. Normal `daily-*` directories are still validated as 3 RU + 3 EN.

## Manual test command

The queue uses the same validator/publisher:

```powershell
node scripts/article-agent/publish-daily-batch.mjs --dir "BD/article-publish-queue/daily-YYYY-MM-DD" --dry-run
```

GitHub Actions publishes with:

```powershell
node scripts/article-agent/publish-daily-batch.mjs --dir "BD/article-publish-queue/daily-YYYY-MM-DD" --publish --skip-existing
```

`--skip-existing` makes reruns safe if a previous workflow already published
some or all articles.

## What to give the external agent

Tell the agent:

```text
Use fresh main only.
Read BD/ARTICLE_PUBLISH_QUEUE.md, BD/DAILY_ARTICLE_AUTOMATION.md, and BD/ARTICLE_EDITORIAL_STANDARD.md.
Create exactly 3 RU + 3 EN articles in BD/article-publish-queue/daily-YYYY-MM-DD/.
Commit and push those JSON files to main.
Do not touch BD/content-staging, BD/article-publisher.env, or gh-pages.
Do not ask for ARTICLE_ADMIN_TOKEN; GitHub Actions owns publishing secrets.
```

## Fully automated daily mode

The queue is only for external agents that need to commit prepared JSON files.
For hands-off publishing without OpenAI API, use the dated publish calendar in
`BD/article-publish-calendar/YYYY-MM-DD/`. The scheduled workflow
`.github/workflows/daily-article-agent.yml` publishes the current Moscow date
folder automatically through the Worker API.

See `BD/ARTICLE_PUBLISH_CALENDAR.md`. This calendar mode needs only
`ARTICLE_API_BASE_URL` and `ARTICLE_ADMIN_TOKEN` as repository secrets.
