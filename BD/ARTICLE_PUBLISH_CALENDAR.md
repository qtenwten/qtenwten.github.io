# Article publish calendar without OpenAI API

Use this mode when daily publishing must work without `OPENAI_API_KEY`.
Articles are written ahead of time by the editor/agent and stored in dated
calendar folders. GitHub Actions publishes the folder for the current
Europe/Moscow date.

## How it works

1. Create one folder per publishing date:

```text
BD/article-publish-calendar/YYYY-MM-DD/
```

2. Put exactly 6 JSON files into the folder:

- 3 Russian articles
- 3 English articles
- 3 RU/EN translation pairs

3. Every pair must share one `translation_key`.
4. Each JSON must have `status: "published"`.
5. `.github/workflows/daily-article-agent.yml` runs every day at 09:00
   Europe/Moscow, validates the date folder, publishes it through the Worker API,
   builds the site, and deploys GitHub Pages from `main`.

This mode needs only the existing publishing secrets:

```text
ARTICLE_API_BASE_URL
ARTICLE_ADMIN_TOKEN
```

It does not use or require `OPENAI_API_KEY`.

## Required article fields

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

## Quality rules

All content must follow `BD/ARTICLE_EDITORIAL_STANDARD.md`.

Do not publish weak, generic, or filler content. Each article must:

- answer a narrow practical search intent;
- include a CTA near the top and near the end;
- link RU articles only to `/ru/...` tool URLs;
- link EN articles only to `/en/...` tool URLs;
- avoid test/demo/placeholder wording;
- avoid duplicate slugs, duplicate topics, and duplicate translation keys.

## Local validation

Validate a specific date without hitting the Worker API:

```powershell
node scripts/article-agent/publish-calendar-batch.mjs --date YYYY-MM-DD --dry-run --skip-remote-duplicate-check --env-file /dev/null
```

Validate with the Worker public duplicate scan when network and environment are
available:

```powershell
node scripts/article-agent/publish-calendar-batch.mjs --date YYYY-MM-DD --dry-run
```

Publish manually from a trusted environment:

```powershell
node scripts/article-agent/publish-calendar-batch.mjs --date YYYY-MM-DD --publish --skip-existing
```

## GitHub Actions

The scheduled workflow is:

```text
.github/workflows/daily-article-agent.yml
```

Manual run:

1. Open GitHub Actions.
2. Select **Daily Qsen article calendar publisher**.
3. Click **Run workflow**.
4. Leave `article_date` empty to use today in Europe/Moscow, or enter
   `YYYY-MM-DD` for a specific prepared folder.

## Adding more days

To extend the no-API bank, add more dated folders:

```text
BD/article-publish-calendar/2026-05-18/
BD/article-publish-calendar/2026-05-19/
BD/article-publish-calendar/2026-05-20/
```

Each folder must pass local validation before it is pushed to `main`.
