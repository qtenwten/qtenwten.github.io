# Addressee SEO Publishing Sprint

## D1 scenarioCta repair verification

### Articles patched

| id | slug | language | old scenarioCta | new scenarioCta |
|----|------|----------|-----------------|-----------------|
| 75 | generator-adresata-kak-pravilno-ukazat-adresata | ru | null | `{"scenario":"custom","source":"article","translation_key":"addressee-generator-how-to-write"}` |
| 76 | how-to-write-addressee-in-business-letter | en | null | `{"scenario":"business-letter","source":"article","translation_key":"addressee-generator-how-to-write"}` |
| 77 | kak-napisat-komu-v-zayavlenii | ru | null (stored internally) | unchanged |
| 78 | kak-oformit-ot-kogo-v-zayavlenii | ru | null (stored internally) | unchanged |
| 79 | obrazets-shapki-zayavleniya | ru | null (stored internally) | unchanged |
| 80 | how-to-write-to-field-in-russian-application | en | null (stored internally) | unchanged |
| 81 | how-to-format-from-field-in-russian-documents | en | null (stored internally) | unchanged |
| 82 | russian-application-header-example | en | null (stored internally) | unchanged |

### CTA URLs generated

- **75 RU:** `/ru/generator-adresata/?scenario=custom&source=article&article=addressee-generator-how-to-write`
- **76 EN:** `/en/generator-adresata/?scenario=business-letter&source=article&article=addressee-generator-how-to-write`

### Checks

| Check | Result |
|-------|--------|
| `check:addressee:article-cta` | 11/11 passed |
| `check:article-funnel` | passed |
| `check:addressee` | 621/621 passed |
| `check:addressee:scenario-ux` | 64/64 passed |
| `check:addressee:analytics` | 99/99 passed |
| `check:addressee:ui-i18n` | 152/152 passed |
| `npm run build` | succeeded |

### Sitemap status

- No `scenario=` or `focus=` params in sitemap
- `git restore public/sitemap.xml` applied — no diff

### Recommendation

**Ready for indexing.** Articles 75 and 76 now have correct `scenarioCta` values routing users to appropriate generator scenarios. Article 77 was not touched.

---

## Backend Worker scenarioCta patch

## 1. Why

- Articles 75/76 published in D1
- Frontend supports scenarioCta field
- Worker PATCH endpoint did not accept scenarioCta in allowlist

## 2. D1 Migration

```sql
ALTER TABLE articles ADD COLUMN scenario_cta TEXT;
```

## 3. Worker Changes

### 3.1 Accept in POST/PATCH

POST and PATCH handlers now accept `scenarioCta` / `scenario_cta` in request body.

### 3.2 Validation

PATCH validates: `scenario`, `focus`, `source`, `translation_key`.

### 3.3 Storage

Stored in DB as `scenario_cta` JSON string.

### 3.4 API Response

Returned externally as camelCase `scenarioCta`.

### 3.5 Endpoints Affected

- `GET /articles` — includes `scenarioCta`
- `GET /articles/:slug` — includes `scenarioCta`
- `PATCH /articles/:slug` — accepts `scenarioCta`
- `POST /articles` — accepts `scenarioCta`

## 4. Notes

- Frontend runtime code unchanged
- Worker live code managed separately outside this repo
- This document is a backup/inventory record of the changes applied to the Cloudflare Worker