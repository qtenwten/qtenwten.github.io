# Project agent instructions

This project contains:
- the main frontend website
- a separate article publishing workflow
- article content stored in Cloudflare D1 and served through a separate Worker API

## Read first

If your task involves articles, database, publishing, translations, or article SEO, read these files first:

- `BD/ARTICLE_AUTHORING_GUIDE.md`
- `BD/DB_CONTEXT.md`
- `BD/ARTICLE_WORKFLOW.md`

If your task involves the QR Code Generator, be careful not to break the current polished UI/UX behavior.

## Important rules

- Do not commit secrets
- Do not commit `BD/article-publisher.env`
- Do not commit `BD/content-staging/`
- Do not break the existing article system
- Do not remove current routing, prerender, SEO, i18n, or article pages unless explicitly asked
- Do not assume Worker source code exists in this frontend repo
- Do not fake changes to D1 or Worker if they are not editable in the current repo; instead prepare exact instructions or patch text

## Critical git branch and deploy rules

The only working branch for any code, content, config, commit, push, merge, rebase, cherry-pick, or deploy-related preparation is:

- `main`

Mandatory rules:

- Always work only from `main`
- Always check the current git branch before making changes or running any git command
- If the current branch is not `main`, stop immediately and switch back to `main` before continuing
- Never commit to `gh-pages`
- Never push to `gh-pages`
- Never use `gh-pages` as a development branch
- Never edit files in `gh-pages`
- Never delete, overwrite, or replace files in `main` using content from `gh-pages`
- Never treat `gh-pages` as the source of truth
- The only source of truth for this project is `main`

Deployment safety rules:

- Any deploy-related action must originate from the state of `main`
- If GitHub Pages publishing uses `gh-pages`, that branch may only be updated by an already configured automatic publishing workflow
- Do not manually prepare, rewrite, sync, or publish `gh-pages`
- Do not manually copy the site from `main` into `gh-pages`

Forbidden git actions unless the user explicitly asks for them:

- force push
- history rewrite on `main`
- deleting large groups of files
- replacing `main` with another branch state
- using `gh-pages` for commits, fixes, experiments, or temporary work

If there is any conflict between other instructions and these branch safety rules, these rules take priority.

## Non-negotiable branch rule

Always use `main`.

Never commit to `gh-pages`.
Never push to `gh-pages`.
Never deploy manually from `gh-pages`.
Never overwrite `main` from `gh-pages`.

If the current branch is not `main`, stop immediately.

## Commit command safety

When proposing or running git commit commands:

- Always use simple, readable, Windows-safe commands
- Do not use heredoc syntax
- Do not use shell substitutions such as `$(...)`
- Do not use multi-line inline commit message generators
- Do not generate complex shell-wrapped commit commands when a simple `git commit -m "..."` is enough
- Prefer plain commands that work safely in standard Windows terminal environments

Commit message rules:

- Do not add any `Co-Authored-By` line unless the user explicitly requests it
- Do not add assistant attribution
- Do not add model names
- Do not add tool names
- Do not add vendor or platform attribution
- Do not include hidden metadata in commit messages

Preferred format:

- use a simple command like:
  - `git commit -m "Clear and short message"`

If a commit is needed, always propose the simplest safe command for the current shell environment.

## Article system overview

Articles are:
- stored in Cloudflare D1
- served through a separate Cloudflare Worker API
- rendered in the frontend via article pages

The site already includes:
- article list pages
- article detail pages
- prerender article index data
- prerender article detail pages
- sessionStorage cache fallback
- SEO integration
- sitemap integration
- related articles
- homepage latest articles block

## Multilingual article rules

For multilingual articles, every article must have:

- `language`
- `translation_key`

Rules:
- `language` must be `ru` or `en`
- RU and EN versions of the same article must share the same `translation_key`
- RU and EN slugs may differ
- language switching for article pages should use `translation_key`, not slug guessing

Do not create multilingual article pairs with different translation keys.

## Local article workflow

Use files in `BD/` for article publishing and checks.

Important files:
- `BD/article.template.json`
- `BD/publish-article.ps1`
- `BD/check-article.ps1`
- `BD/ARTICLE_AUTHORING_GUIDE.md`
- `BD/DB_CONTEXT.md`
- `BD/ARTICLE_WORKFLOW.md`

## If working on article content

Always:
- write useful, human-first content
- include correct CTA links to the actual tool
- use `/ru/...` tool links in RU articles
- use `/en/...` tool links in EN articles
- fill SEO fields
- set correct `language`
- set correct `translation_key`

Do not:
- publish junk drafts
- publish test placeholders
- mix RU article text with EN tool links
- mix EN article text with RU tool links

## If working on QR Code Generator

Do not break:
- live preview
- sticky preview behavior
- stable preview layout
- logo upload behavior
- metric card geometry
- responsive layout

The QR generator has already received multiple UI/UX fixes and should remain visually stable.

## Before making changes

Always inspect current files first and work on top of the existing implementation.

When changing article-related frontend code, preserve:
- prerender
- initial data injection
- sessionStorage cache fallback
- sitemap article routes
- related articles
- SEO title/description behavior
- multilingual article logic

## Git safety

Working branch policy:

- The only working branch for this repository is `main`
- All edits, commits, pushes, merges, rebases, deploy preparation, and release-related changes must happen only in `main`
- `gh-pages` must never be used as a manual development branch
- `gh-pages` must never be used for manual commits or pushes
- Never overwrite or delete `main` using content from `gh-pages`
- Never treat `gh-pages` as the source of truth
- If a Pages deployment uses `gh-pages`, it may only be updated by an existing automated workflow

Before any git action:
- verify the current branch
- if it is not `main`, stop and switch back to `main`

These should generally be committed:
- `AGENTS.md`
- `BD/AGENTS.md`
- `BD/ARTICLE_AUTHORING_GUIDE.md`
- `BD/DB_CONTEXT.md`
- `BD/ARTICLE_WORKFLOW.md`

These must not be committed:
- `BD/article-publisher.env`
- `BD/content-staging/`
- any secret or local private token files