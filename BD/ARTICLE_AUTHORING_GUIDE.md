# Article authoring guide

## Purpose
This file defines how agents must create, translate, link, and publish articles for the site.

Use this guide for every article-related task:
- writing a new article
- creating RU and EN versions
- translating an article
- linking an article to a tool
- preparing article JSON
- publishing through the BD workflow

---

## Core rule
Articles are not random blog posts.
Each article must help:
1. answer a real search intent
2. solve a user problem
3. lead the user to a real tool on the site

An article should work as:
- search entry point
- helpful guide
- bridge to the tool

---

## Source of truth
Articles are stored in Cloudflare D1 and published through the Worker API.

Do not store article content as the primary source of truth in frontend code.

Use:
- `BD/article.template.json`
- `BD/content-staging/`
- `BD/publish-article.ps1`
- `BD/check-article.ps1`

---

## Required multilingual model
Every article must have:

- `language`
- `translation_key`
- `slug`
- `title`
- `excerpt`
- `content`
- `status`
- `author`
- `cover_image`
- `seo_title`
- `seo_description`

### `language`
Must be:
- `ru`
- `en`

### `translation_key`
Must be:
- stable
- short
- shared by RU and EN versions of the same article

Example:

RU:
- `language = ru`
- `translation_key = days-lived`
- `slug = skolko-dney-ya-zhivu`

EN:
- `language = en`
- `translation_key = days-lived`
- `slug = how-many-days-have-i-lived`

Important:
- RU and EN slugs may differ
- pairing is done by `translation_key`, not by slug

---

## Mandatory rule for RU and EN
If an article is created for one language and is intended to exist in both languages, the agent must create:

1. a Russian version
2. an English version

Both must:
- describe the same topic
- link to the correct language version of the tool
- share the same `translation_key`

Do not create mismatched RU/EN articles with different translation keys.

---

## Article quality standard
Articles must be:
- useful
- readable
- practical
- SEO-friendly
- written for people first

Do not write:
- keyword spam
- thin content
- meaningless filler
- obvious AI padding
- generic “blog for blog’s sake” content

Articles should feel like:
- real guide
- practical help
- trustworthy explanation
- clear entry point to the tool

---

## Article structure
A good article should usually contain:

1. CTA link to the tool near the top
2. H1
3. intro paragraph
4. practical explanation
5. list of use cases / benefits
6. step-by-step instructions when relevant
7. common mistakes / tips / lifehacks when relevant
8. FAQ
9. final CTA link to the tool

---

## CTA rules
Every article should link to the actual tool.

### RU article
Must use RU tool URL:
- `/ru/...`

### EN article
Must use EN tool URL:
- `/en/...`

CTA should appear:
- near the top
- near the end

CTA text must sound natural and useful.

Examples:
- `Попробовать инструмент`
- `Открыть калькулятор`
- `Сгенерировать пароль`
- `Рассчитать НДС`
- `Try the tool`
- `Open the calculator`
- `Generate a password`

Do not link RU articles to EN tools or EN articles to RU tools.

---

## SEO rules
Each article must have:

### `title`
Readable, useful, naturally searchable

### `excerpt`
Short human-friendly summary

### `seo_title`
Can be slightly more search-focused than the title

### `seo_description`
Should explain:
- what the article helps with
- what the user can do
- why the tool is useful

### Good SEO content principles
- match real search intent
- use natural wording
- cover the topic properly
- include helpful subtopics
- avoid over-optimization
- avoid stuffing keywords unnaturally

---

## Content strategy
Prefer article topics like:
- how to do something with the tool
- common mistakes
- practical examples
- lifehacks / tips
- comparison of approaches
- why an online tool is faster or safer
- FAQ around the task the tool solves

Avoid weak topics like:
- empty announcements
- filler opinion pieces
- generic motivational text unrelated to the tool

---

## Language and translation rules
EN article must not be a sloppy literal translation of RU.
It should:
- sound natural in English
- preserve the meaning
- keep the same tool purpose
- keep the same conversion intent

RU article should:
- sound natural for Russian-speaking users
- not be overloaded with English phrasing
- stay practical and clear

---

## Publishing status rules
### Use `published` only when:
- the article is complete
- the text is useful
- the CTA is correct
- SEO fields are filled
- language and translation_key are correct

### Use `draft` when:
- the article is incomplete
- it is a test
- it is a temporary draft
- translation is not ready
- content quality is not good enough yet

Do not publish junk test articles.

---

## Draft/test article rule
If an article is obviously:
- test content
- placeholder
- internal draft
- low-value content

Do not automatically create a translated public version of it.

Instead:
- keep it as draft
- mention in the report that it should not be published yet

---

## File workflow

For the complete publish-and-verify workflow, use:
- `BD/ARTICLE_PUBLISHING_RUNBOOK.md`

### 1. Create article JSON
Place it in:
- `BD/content-staging/`

### 2. Validate required fields
Must include:
- `language`
- `translation_key`
- `slug`
- `title`
- `excerpt`
- `content`
- `status`
- `author`
- `seo_title`
- `seo_description`

### 3. Publish
Use:
```powershell
powershell -ExecutionPolicy Bypass -File ".\BD\publish-article.ps1" ".\BD\content-staging\<file>.json"
