# Backend Worker scenarioCta patch

## 1. Why

- Frontend `articleFunnel.js` already supports `scenarioCta` field for routing article CTAs to specific generator scenarios
- Published articles 75 and 76 needed `scenarioCta` to route users to the correct generator scenario
- Worker PATCH endpoint reject requests containing `scenarioCta` — the field was not in the allowlist
- Worker D1 storage did not have a column for this field
- This blocked the article → tool funnel for addressee-cluster SEO articles

## 2. D1 migration

```sql
PRAGMA table_info(articles);
ALTER TABLE articles ADD COLUMN scenario_cta TEXT;
```

### Expected columns after migration

| Column | Type |
|--------|------|
| id | INTEGER |
| language | TEXT |
| translation_key | TEXT |
| tool_slug | TEXT |
| slug | TEXT |
| title | TEXT |
| excerpt | TEXT |
| content | TEXT |
| status | TEXT |
| author | TEXT |
| cover_image | TEXT |
| seo_title | TEXT |
| seo_description | TEXT |
| published_at | TEXT |
| updated_at | TEXT |
| scenario_cta | TEXT |

## 3. Worker changes

### 3.1 Accept in POST/PATCH

POST and PATCH handlers now accept `scenarioCta` (camelCase) and `scenario_cta` (underscore) in the request body.

### 3.2 Validation

PATCH validates:
- `scenario` — string, one of VALID_SCENARIO_QUERY_VALUES
- `focus` — string (optional), one of `to`, `from`, `salutation`
- `source` — string (optional)
- `translation_key` — string (optional)

### 3.3 Storage

Stored in D1 as JSON string in `scenario_cta` column.

### 3.4 API response

Returned externally as camelCase `scenarioCta` in JSON responses.

### 3.5 Endpoints affected

- `GET /articles` — includes `scenarioCta` in each article object
- `GET /articles/:slug` — includes `scenarioCta` in article object
- `PATCH /admin/articles/:id` — accepts `scenarioCta`
- `POST /admin/articles` — accepts `scenarioCta`

## 4. Frontend compatibility

- Frontend `articleFunnel.js` already handles `scenarioCta` from API responses
- `getArticleToolCta()` reads `article.scenarioCta` and appends `?scenario=<value>&focus=<value>&source=article&article=<key>` to tool URLs
- No frontend code changes were needed

## 5. Files changed

This document is the only artifact in the frontend repo. The actual Worker code change is stored separately in the Worker repository.