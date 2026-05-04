# Инструкция по публикации статей для ИИ-агентов

Это основной пошаговый runbook для создания, публикации, проверки и ремонта статей.

Используй этот файл для задач про:
- новые статьи;
- RU/EN пары;
- SEO-статьи для инструментов;
- публикацию в Cloudflare D1;
- обновление или исправление уже опубликованных статей;
- проверку live-страниц на `qsen.ru`.

Перед началом также прочитай:
- `BD/ARTICLE_AUTHORING_GUIDE.md`;
- `BD/DB_CONTEXT.md`;
- `BD/ARTICLE_WORKFLOW.md`.

Основные локальные файлы workflow:
- `BD/article.template.json`;
- `BD/publish-article.ps1`;
- `BD/check-article.ps1`;
- `BD/content-staging/`;
- `BD/article-publisher.env`.

---

## 1. Preflight

Перед созданием, публикацией или исправлением статей:

1. Проверь ветку:

```powershell
git rev-parse --abbrev-ref HEAD
```

Единственная допустимая ветка:

```text
main
```

Если текущая ветка не `main`, остановись и вернись на `main`.

2. Проверь рабочее дерево:

```powershell
git status --short
```

Не перезаписывай чужие или пользовательские изменения.

3. Не раскрывай и не коммить секреты:

- не коммить `BD/article-publisher.env`;
- не коммить `BD/content-staging/`;
- не выводи `ARTICLE_ADMIN_TOKEN`;
- не копируй секреты в документы, логи, коммиты или финальные отчеты.

4. Помни источник истины:

- статьи хранятся в Cloudflare D1;
- Worker API отдает статьи сайту;
- frontend только рендерит и пререндерит данные из API;
- Worker source code может не быть частью frontend repo.

---

## 2. D1-инвентаризация до написания

Перед созданием новых статей нужно понять, что уже есть в базе.

Если актуального вывода D1 нет в задаче, попроси пользователя выполнить эти SQL-запросы в Cloudflare D1 console и прислать результат:

```sql
PRAGMA table_info(articles);
```

```sql
SELECT id, language, translation_key, tool_slug, slug, title, status, published_at, updated_at
FROM articles
ORDER BY id DESC;
```

```sql
SELECT tool_slug, language, status, COUNT(*) AS count
FROM articles
GROUP BY tool_slug, language, status
ORDER BY tool_slug, language, status;
```

```sql
SELECT slug, COUNT(*) AS count
FROM articles
GROUP BY slug
HAVING COUNT(*) > 1;
```

```sql
SELECT translation_key, language, COUNT(*) AS count
FROM articles
GROUP BY translation_key, language
HAVING COUNT(*) > 1;
```

По инвентаризации определи:
- какие темы и search intent уже опубликованы;
- какие `tool_slug` реально используются;
- какие `slug` уже заняты;
- какие `translation_key` уже заняты;
- нужна новая статья или обновление существующей.

Не создавай новую статью, если такой же search intent уже закрыт опубликованной статьей.

---

## 3. Правила тем и переводов

Для публичной мультиязычной темы обычно нужны две статьи:
- RU версия;
- EN версия.

Исключение: пользователь явно просит только один язык.

Правила:
- RU и EN версии одной темы используют один общий `translation_key`;
- RU и EN `slug` могут отличаться;
- языковое переключение статей должно опираться на `translation_key`, а не на угадывание slug;
- `translation_key` должен быть коротким, стабильным и читаемым;
- не используй случайные строки, полные заголовки или разные ключи для переводов одной темы;
- не переиспользуй `translation_key` для другой темы.

Хорошо:

```text
qr-wifi-guest-access
amount-words-vat-clause
temporary-contractor-password
```

Плохо:

```text
article-2026-05-04-1
how-to-create-a-very-long-title-like-this
```

Темы должны быть:
- узкими;
- полезными;
- связанными с реальной поисковой задачей;
- не повторяющими уже опубликованный угол;
- естественно ведущими к инструменту.

Не публикуй:
- filler;
- keyword spam;
- тестовые черновики;
- слабые статьи ради количества;
- прямые дубли существующих материалов.

---

## 4. JSON-структура статьи

Используй `BD/article.template.json` как схему.

Обязательная структура:

```json
{
  "language": "ru",
  "translation_key": "stable-topic-key",
  "tool_slug": "tool-slug",
  "slug": "article-slug",
  "title": "Article title",
  "excerpt": "Short summary.",
  "content": "# Article heading\n\nArticle body.",
  "status": "published",
  "author": "Ars",
  "cover_image": null,
  "seo_title": "SEO title",
  "seo_description": "SEO description"
}
```

Правила полей:
- `language` только `ru` или `en`;
- `translation_key` обязателен для каждой статьи;
- `tool_slug` должен соответствовать инструменту, например `qr-code-generator`, `random-number`, `vat-calculator`, `number-to-words`, `password-generator`;
- `slug` должен быть уникальным в таблице;
- `status = published` ставь только для готовой и проверенной статьи;
- `author` обычно `Ars`;
- `cover_image` может быть `null`;
- `seo_title` и `seo_description` обязательны.

---

## 5. CTA-ссылки

Каждая статья должна вести к реальному инструменту.

RU статья:

```markdown
[Открыть калькулятор](/ru/vat-calculator/)
```

EN статья:

```markdown
[Open the calculator](/en/vat-calculator/)
```

Правила:
- CTA near top;
- CTA near bottom;
- RU статья использует только `/ru/...`;
- EN статья использует только `/en/...`;
- не вставляй Worker API URL как пользовательскую ссылку;
- не смешивай языки в CTA.

После публикации проверь, что CTA отображается как кнопка или ссылка, а не как видимый Markdown-код вида:

```text
](/ru/...)
```

---

## 6. UTF-8 safety

Это критично на Windows.

Все staging JSON файлы должны быть UTF-8 и лежать здесь:

```text
BD/content-staging/
```

Эта папка игнорируется git и не должна коммититься.

Не создавай русские JSON так, чтобы кириллица проходила через небезопасный shell pipe. Особенно опасны сценарии, где PowerShell here-string с кириллицей передается в Node или другой процесс без проверки encoding path. Так текст может превратиться в `???` еще до отправки в D1.

Перед публикацией RU файла проверь его локально:

```powershell
Get-Content ".\BD\content-staging\<file>.json" -Raw -Encoding UTF8
```

Остановись, если видишь:
- `???` вместо кириллицы;
- битые заголовки;
- битый `content`;
- неправильные CTA ссылки.

Для batch-публикации проверь:
- каждый RU файл содержит кириллицу;
- RU файлы не содержат повторяющиеся `???`;
- каждый файл является валидным JSON;
- RU CTA используют `/ru/...`;
- EN CTA используют `/en/...`;
- RU/EN пары имеют одинаковый `translation_key`.

Никогда не публикуй файл с испорченной кириллицей.

---

## 7. Проверка дублей и качества

Перед публикацией проверь:

1. `slug` не существует в D1.
2. Пара `translation_key + language` не существует в D1.
3. Тема не повторяет уже опубликованный intent.
4. RU и EN версии одной темы имеют один `translation_key`.
5. RU и EN версии раскрывают один и тот же смысл.
6. У каждой статьи есть:
   - полезный H1;
   - практичный intro;
   - примеры, шаги, ошибки, FAQ или другой полезный блок;
   - верхний CTA;
   - нижний CTA;
   - заполненный `seo_title`;
   - заполненный `seo_description`.

Если контент слабый, тестовый или недоделанный, оставь `status = draft` и не публикуй.

---

## 8. Публикация новых статей

Публикуй каждый JSON через локальный script:

```powershell
powershell -ExecutionPolicy Bypass -File ".\BD\publish-article.ps1" ".\BD\content-staging\<file>.json"
```

Скрипт читает:
- `BD/article-publisher.env`;
- `ARTICLE_API_BASE_URL`;
- `ARTICLE_ADMIN_TOKEN`.

Не выводи и не раскрывай токен.

После публикации зафиксируй:
- `id`;
- `language`;
- `translation_key`;
- `tool_slug`;
- `slug`;
- `title`;
- `status`.

Проверь каждую статью по slug:

```powershell
powershell -ExecutionPolicy Bypass -File ".\BD\check-article.ps1" "<slug>"
```

Ответ должен содержать:
- правильный `language`;
- правильный `translation_key`;
- правильный `tool_slug`;
- ожидаемый `title`;
- ожидаемый `content`;
- `status = published`, если статья должна быть публичной.

Для RU статей дополнительно проверь, что публичный ответ содержит кириллицу и не содержит `???`.

---

## 9. Public API verification с пагинацией

Не предполагай, что `GET /articles` возвращает все статьи одним ответом.

Проверяй API с пагинацией:

```text
https://fancy-scene-deeb.qten.workers.dev/articles?limit=50&offset=0
```

```text
https://fancy-scene-deeb.qten.workers.dev/articles?limit=50&offset=50
```

Если `total` больше загруженного количества, продолжай увеличивать `offset`.

Проверь:
- все новые slugs есть в API;
- языковые counts совпадают с ожиданием;
- нет duplicate slugs;
- нет duplicate `translation_key + language`;
- новые статьи имеют `published`, если должны быть публичными;
- RU/EN пары имеют один `translation_key`.

---

## 10. Build и frontend-проверка

После публикации или ремонта статей запусти:

```powershell
npm run build
```

Ожидается:
- `/ru/articles/` содержит все published RU статьи;
- `/en/articles/` содержит все published EN статьи;
- detail pages сгенерированы для валидных slugs;
- sitemap содержит article URLs;
- SEO metadata подтягивается из article fields;
- hreflang для article detail строится по `translation_key`.

Если build пишет, что detail prerender был пропущен, проверь slug. Частая причина - старый невалидный slug с пробелом. Не считай это нормой для новых статей.

Локально проверь:
- `dist/ru/articles/<slug>/index.html` или `dist/en/articles/<slug>/index.html` существует;
- article index HTML содержит новые slugs;
- `dist/sitemap.xml` содержит новые slugs;
- RU detail HTML содержит кириллицу, а не `???`;
- CTA ссылки ведут на `/ru/...` или `/en/...`.

При необходимости проверь browser DOM через preview:

```powershell
npm run preview -- --host 127.0.0.1 --port 4176
```

В браузере проверь:
- количество карточек после React render;
- CTA внутри статьи;
- отсутствие видимого Markdown-кода `](/ru/...` или `](/en/...`.

---

## 11. Deploy и live-проверка

Любые git и deploy действия выполняй только из `main`.

Перед git action:

```powershell
git rev-parse --abbrev-ref HEAD
```

Если это не `main`, остановись.

После commit и push дождись успешного GitHub Pages workflow.

Live-проверка на `qsen.ru`:
- открой `/ru/articles/`;
- открой `/en/articles/`;
- проверь ожидаемое количество article links;
- открой representative RU и EN detail pages;
- проверь CTA кнопки или ссылки;
- RU CTA должны вести на `/ru/...`;
- EN CTA должны вести на `/en/...`;
- в статье не должен быть виден Markdown-код;
- RU контент не должен содержать `???`.

Если D1 изменился, но tracked-файлы не изменились, статический prerender на GitHub Pages все равно нужно обновить. В этом случае можно сделать пустой commit только из `main`:

```powershell
git commit --allow-empty -m "Refresh article prerender"
```

Делай это только когда свежий deploy реально нужен.

---

## 12. Repair flow для уже созданных статей

Если статья уже создана с ошибкой, не создавай дубль через `POST`.

Используй:

```text
PATCH /admin/articles/:id
```

PATCH нужен для исправления:
- испорченной кириллицы;
- неправильного title;
- неправильного excerpt;
- неправильного content;
- SEO fields;
- status;
- CTA links;
- `translation_key`, если нужно исправить идентичность пары.

Repair workflow:
1. Найди существующий `id`.
2. Подготовь PATCH payload только с нужными полями.
3. Отправь запрос в Worker admin API с токеном из `BD/article-publisher.env`.
4. Проверь public detail endpoint по slug.
5. Запусти `npm run build`.
6. Если нужно обновить static HTML, сделай deploy или пустой commit для fresh prerender.
7. Проверь live pages.

Для corrupted RU text:
- исправь D1 запись правильным UTF-8 content;
- проверь public API, что текст содержит кириллицу;
- rebuild и redeploy;
- проверь live HTML, что там кириллица и нет `???`.

---

## 13. Финальный отчет агента

После работы со статьями отчитайся кратко и конкретно.

Укажи:
- что создано или обновлено;
- сколько RU и EN статей;
- `id`, `language`, `translation_key`, `tool_slug`, `slug`, `title`, `status`;
- public article URLs;
- tool CTA URLs;
- какие duplicate checks выполнены;
- какие UTF-8 checks выполнены;
- как проверена API pagination;
- результат `npm run build`;
- результат live verification;
- skipped или failed items;
- известные unrelated issues, например старый невалидный slug.

Если тесты, build или live checks не запускались, скажи это явно и укажи причину.

Никогда не включай в отчет секреты, токены или private env values.
