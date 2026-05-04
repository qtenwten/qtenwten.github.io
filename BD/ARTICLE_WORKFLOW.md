# Article management quick guide

For the full production publishing process, including D1 inventory, duplicate checks, UTF-8 safety, pagination, repair, build, deploy, and live verification, read:

- `BD/ARTICLE_PUBLISHING_RUNBOOK.md`

## Где хранятся статьи
Статьи хранятся в **Cloudflare D1**.
Публично сайт показывает только статьи со статусом:

- `published`

Если статья имеет статус:

- `draft`

то на сайте она не отображается.

---

## Основные поля статьи
Обычно используются:

- `id`
- `language` (`ru` / `en`)
- `translation_key` (общий ID пары переводов)
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

## Что можно делать

### 1. Создать статью
Через локальный JSON + publish script:

- подготовить JSON в `BD/content-staging/`
- опубликовать через `BD/publish-article.ps1`

Важно для мультиязычности:

- каждая статья обязана иметь `language`
- если это перевод, RU и EN версии должны иметь одинаковый `translation_key`
- `slug` в RU/EN может быть разным

### 2. Проверить статью
Через:

- `BD/check-article.ps1`
- или через публичный URL `/articles/:slug`

### 3. Обновить статью
Через Worker API route:

- `PATCH /admin/articles/:id`

Можно менять:
- `title`
- `excerpt`
- `content`
- `seo_title`
- `seo_description`
- `status`
- другие подтверждённые поля

### 4. Опубликовать статью
Через Worker API route:

- `POST /admin/articles/:id/publish`

### 5. Снять статью с публикации
Самый безопасный способ:

- перевести статью в `draft`

Через SQL:

```sql
UPDATE articles
SET status = 'draft',
    updated_at = CURRENT_TIMESTAMP
WHERE id = ...;
