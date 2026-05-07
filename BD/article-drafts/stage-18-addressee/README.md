# Stage 18 — Addressee Generator Draft Articles

These are reviewable draft article JSON files for the generator-adresata content cluster.

## Files

- `kak-napisat-komu-v-zayavlenii.json` — RU: Как написать «Кому» в заявлении
- `kak-oformit-ot-kogo-v-zayavlenii.json` — RU: Как оформить «От кого» в заявлении
- `obrazets-shapki-zayavleniya.json` — RU: Шапка заявления — готовые образцы
- `how-to-write-to-field-in-russian-application.json` — EN: How to write the "To" field
- `how-to-format-from-field-in-russian-documents.json` — EN: How to format the "From" field
- `russian-application-header-example.json` — EN: Russian application header example

## Translation key pairs

| Pair | RU slug | EN slug |
|------|---------|---------|
| addressee-to-field-application | kak-napisat-komu-v-zayavlenii | how-to-write-to-field-in-russian-application |
| addressee-from-field-application | kak-oformit-ot-kogo-v-zayavlenii | how-to-format-from-field-in-russian-documents |
| application-header-example | obrazets-shapki-zayavleniya | russian-application-header-example |

## Publishing workflow

1. Review drafts for quality and accuracy
2. Copy selected files to `BD/content-staging/`
3. Run: `powershell -ExecutionPolicy Bypass -File ".\BD\publish-article.ps1" ".\BD\content-staging\<file>.json"`
4. Check: `powershell -ExecutionPolicy Bypass -File ".\BD\check-article.ps1" "<slug>"`
5. Build and verify: `npm run build`

## Important rules

- Do NOT publish to D1 without user approval
- All files have `status: "draft"` — do not change to published
- All files have `tool_slug: "generator-adresata"` and link to `/ru/generator-adresata/` or `/en/generator-adresata/`
- All articles include practical examples, FAQ, and CTA near top and bottom
- Content is human-first, not SEO-padding