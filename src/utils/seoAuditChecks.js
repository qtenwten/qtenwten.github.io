import { AUDIT_UI_COPY, AUDIT_CATEGORY_ORDER } from './seoAuditUiCopy'
import { normalizeAuditData } from './seoAuditNormalize'

function truncateText(value, limit = 88) {
  if (!value) return value
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value
}

function createCheck({ id, categoryId, label, weight, status, value, summary, whyItMatters, recommendation = '', benchmark = '', scoreEarned = null }) {
  const resolvedScore = scoreEarned ?? (status === 'pass'
    ? weight
    : status === 'warning'
      ? Math.max(1, Math.round(weight * 0.5))
      : status === 'fail'
        ? 0
        : null)

  return {
    id,
    categoryId,
    label,
    weight,
    status,
    value,
    summary,
    whyItMatters,
    recommendation,
    benchmark,
    scoreEarned: resolvedScore,
  }
}

function getCategoryStatus(checks) {
  const checked = checks.filter((check) => check.status !== 'na')
  if (!checked.length) return 'na'
  if (checked.some((check) => check.status === 'fail')) return 'fail'
  if (checked.some((check) => check.status === 'warning')) return 'warning'
  return 'pass'
}

function buildAuditReport(rawData, language) {
  const ui = AUDIT_UI_COPY[language] || AUDIT_UI_COPY.ru
  const data = normalizeAuditData(rawData)
  const values = {
    title: (data.title || '').trim(),
    description: (data.description || '').trim(),
    h1Text: (data.h1Text || '').trim(),
  }

  const checks = []

  const safeParseUrl = (value) => {
    try {
      if (!value || typeof value !== 'string') return null
      return new URL(value)
    } catch {
      return null
    }
  }

  const makeNotChecked = ({ id, categoryId, label, weight, whyItMatters, benchmark }) => createCheck({
    id,
    categoryId,
    label,
    weight,
    status: 'na',
    value: ui.status.na,
    summary: ui.notChecked,
    whyItMatters,
    recommendation: '',
    benchmark,
    scoreEarned: null,
  })

  const ctx = { language, ui, data, values, safeParseUrl, makeNotChecked }

  const CHECK_CATALOG = [
    (ctx) => {
      const { data, language, ui } = ctx
      const hasStatus = typeof data.status === 'number'
      const httpStatusOk = hasStatus && data.status >= 200 && data.status < 300 && data.ok !== false
      const httpStatusRedirect = hasStatus && data.status >= 300 && data.status < 400
      return createCheck({
        id: 'http-status',
        categoryId: 'technical',
        label: ui.labels.httpStatus,
        weight: 8,
        status: !hasStatus ? 'na' : httpStatusOk ? 'pass' : httpStatusRedirect ? 'warning' : 'fail',
        value: !hasStatus ? ui.status.na : `HTTP ${data.status}`,
        summary: !hasStatus
          ? ui.notChecked
          : httpStatusOk
            ? (language === 'en' ? 'The page returned a successful status code.' : 'Страница вернула успешный код ответа.')
            : httpStatusRedirect
              ? (language === 'en' ? 'The URL redirects before the final page resolves.' : 'URL сначала отдает редирект перед финальной страницей.')
              : (language === 'en' ? 'The page did not return a successful status code.' : 'Страница не вернула успешный код ответа.'),
        whyItMatters: ui.why.httpStatus,
        recommendation: !hasStatus || httpStatusOk
          ? ''
          : (language === 'en' ? 'Review redirects or server responses so the page resolves with a clean 2xx status.' : 'Проверьте редиректы и ответы сервера, чтобы страница открывалась с чистым 2xx-статусом.'),
        benchmark: '2xx',
      })
    },
    (ctx) => {
      const { data, language, ui } = ctx
      if (data.contentType === undefined) {
        return ctx.makeNotChecked({
          id: 'html-content',
          categoryId: 'technical',
          label: ui.labels.htmlContent,
          weight: 4,
          whyItMatters: ui.why.htmlContent,
          benchmark: 'text/html',
        })
      }
      const contentType = typeof data.contentType === 'string' ? data.contentType : ''
      const isHtml = contentType.toLowerCase().includes('text/html')
      return createCheck({
        id: 'html-content',
        categoryId: 'technical',
        label: ui.labels.htmlContent,
        weight: 4,
        status: isHtml ? 'pass' : 'fail',
        value: contentType || (language === 'en' ? 'Unknown' : 'Неизвестно'),
        summary: isHtml
          ? (language === 'en' ? 'The URL points to an HTML document.' : 'URL ведет на HTML-документ.')
          : (language === 'en' ? 'The response is not a standard HTML page.' : 'Ответ не является обычной HTML-страницей.'),
        whyItMatters: ui.why.htmlContent,
        recommendation: isHtml
          ? ''
          : (language === 'en' ? 'Use a canonical page URL that returns an HTML document.' : 'Используйте URL страницы, который отдает обычный HTML-документ.'),
        benchmark: 'text/html',
      })
    },
    (ctx) => {
      const { data, language, ui } = ctx
      if (data.finalUrl === undefined) {
        return ctx.makeNotChecked({
          id: 'https-url',
          categoryId: 'technical',
          label: ui.labels.httpsUrl,
          weight: 4,
          whyItMatters: ui.why.httpsUrl,
          benchmark: 'https://',
        })
      }
      const finalUrl = typeof data.finalUrl === 'string' ? data.finalUrl : ''
      const isHttps = finalUrl.startsWith('https://')
      return createCheck({
        id: 'https-url',
        categoryId: 'technical',
        label: ui.labels.httpsUrl,
        weight: 4,
        status: isHttps ? 'pass' : 'warning',
        value: finalUrl || (language === 'en' ? 'Unknown' : 'Неизвестно'),
        summary: isHttps
          ? (language === 'en' ? 'The final URL uses HTTPS.' : 'Итоговый URL использует HTTPS.')
          : (language === 'en' ? 'The final URL is not using HTTPS.' : 'Итоговый URL не использует HTTPS.'),
        whyItMatters: ui.why.httpsUrl,
        recommendation: isHttps
          ? ''
          : (language === 'en' ? 'Serve the public page over HTTPS and update internal links to the secure version.' : 'Отдавайте страницу по HTTPS и обновите внутренние ссылки на безопасную версию.'),
        benchmark: 'https://',
      })
    },
    (ctx) => {
      const { data, language, ui } = ctx
      if (data.robots === undefined) {
        return ctx.makeNotChecked({
          id: 'robots',
          categoryId: 'technical',
          label: ui.labels.robots,
          weight: 5,
          whyItMatters: ui.why.robots,
          benchmark: language === 'en' ? 'Indexable page' : 'Индексируемая страница',
        })
      }
      const robotsValue = typeof data.robots === 'string' ? data.robots : ''
      const robotsLower = robotsValue.toLowerCase()
      const hasNoindex = robotsLower.includes('noindex')
      const hasNofollow = robotsLower.includes('nofollow')
      const status = hasNoindex ? 'fail' : hasNofollow ? 'warning' : 'pass'
      return createCheck({
        id: 'robots',
        categoryId: 'technical',
        label: ui.labels.robots,
        weight: 5,
        status,
        value: robotsValue || (language === 'en' ? 'No explicit robots tag' : 'Явный robots-тег не найден'),
        summary: status === 'pass'
          ? (language === 'en' ? 'No restrictive robots instructions were detected.' : 'Ограничивающих robots-директив не обнаружено.')
          : status === 'warning'
            ? (language === 'en' ? 'The robots directive contains nofollow.' : 'В robots есть директива nofollow.')
            : (language === 'en' ? 'The robots directive contains noindex.' : 'В robots есть директива noindex.'),
        whyItMatters: ui.why.robots,
        recommendation: status === 'pass'
          ? ''
          : (language === 'en' ? 'Review the robots directive if the page is expected to be indexed.' : 'Проверьте robots-директиву, если страница должна индексироваться.'),
        benchmark: language === 'en' ? 'Indexable page' : 'Индексируемая страница',
        scoreEarned: status === 'pass' ? 5 : status === 'warning' ? 2 : 0,
      })
    },
    (ctx) => {
      const { data, language } = ctx
      if (data.lang === undefined) {
        return ctx.makeNotChecked({
          id: 'html-lang',
          categoryId: 'technical',
          label: language === 'en' ? 'HTML language' : 'Язык HTML (lang)',
          weight: 2,
          whyItMatters: language === 'en'
            ? 'The lang attribute helps search engines and assistive tech interpret language and locale.'
            : 'Атрибут lang помогает поисковикам и технологиям доступности корректно интерпретировать язык страницы.',
          benchmark: language === 'en' ? 'Present (BCP 47)' : 'Наличие (BCP 47)',
        })
      }
      const langValue = typeof data.lang === 'string' ? data.lang : ''
      const looksValid = /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i.test(langValue)
      return createCheck({
        id: 'html-lang',
        categoryId: 'technical',
        label: language === 'en' ? 'HTML language' : 'Язык HTML (lang)',
        weight: 2,
        status: looksValid ? 'pass' : 'warning',
        value: langValue || (language === 'en' ? 'Missing' : 'Отсутствует'),
        summary: looksValid
          ? (language === 'en' ? 'The page declares an HTML language.' : 'У страницы указан язык в атрибуте lang.')
          : (language === 'en' ? 'The HTML language value looks unusual.' : 'Значение lang выглядит необычно.'),
        whyItMatters: language === 'en'
          ? 'The lang attribute helps search engines and assistive tech interpret language and locale.'
          : 'Атрибут lang помогает поисковикам и технологиям доступности корректно интерпретировать язык страницы.',
        recommendation: looksValid
          ? ''
          : (language === 'en' ? 'Use a standard language tag like en, en-US, ru, etc.' : 'Используйте стандартный языковой тег: ru, en, en-US и т.д.'),
        benchmark: language === 'en' ? 'Present (BCP 47)' : 'Наличие (BCP 47)',
        scoreEarned: looksValid ? 2 : 1,
      })
    },
    (ctx) => {
      const { data, language } = ctx
      if (data.viewport === undefined) {
        return ctx.makeNotChecked({
          id: 'viewport',
          categoryId: 'technical',
          label: language === 'en' ? 'Viewport meta tag' : 'Viewport meta-тег',
          weight: 2,
          whyItMatters: language === 'en'
            ? 'Mobile usability impacts crawling, rankings, and conversion.'
            : 'Мобильная удобство влияет на индексацию, ранжирование и конверсию.',
          benchmark: 'width=device-width',
        })
      }
      const viewport = typeof data.viewport === 'string' ? data.viewport : ''
      const looksResponsive = viewport.toLowerCase().includes('width=device-width')
      return createCheck({
        id: 'viewport',
        categoryId: 'technical',
        label: language === 'en' ? 'Viewport meta tag' : 'Viewport meta-тег',
        weight: 2,
        status: looksResponsive ? 'pass' : 'warning',
        value: viewport ? truncateText(viewport, 60) : (language === 'en' ? 'Missing' : 'Отсутствует'),
        summary: looksResponsive
          ? (language === 'en' ? 'The page declares a responsive viewport.' : 'У страницы указан адаптивный viewport.')
          : (language === 'en' ? 'A viewport tag was found, but it may not be configured for responsive layouts.' : 'Viewport найден, но он может быть настроен не для адаптивной верстки.'),
        whyItMatters: language === 'en'
          ? 'Mobile usability impacts crawling, rankings, and conversion.'
          : 'Мобильная удобство влияет на индексацию, ранжирование и конверсию.',
        recommendation: looksResponsive ? '' : (language === 'en' ? 'Use `width=device-width, initial-scale=1` as a baseline.' : 'Используйте базово `width=device-width, initial-scale=1`.'),
        benchmark: 'width=device-width',
        scoreEarned: looksResponsive ? 2 : 1,
      })
    },
    (ctx) => createCheck({
      id: 'title-present',
      categoryId: 'metadata',
      label: ctx.ui.labels.titlePresence,
      weight: 10,
      status: ctx.values.title ? 'pass' : 'fail',
      value: ctx.values.title ? truncateText(ctx.values.title) : (ctx.language === 'en' ? 'Missing' : 'Отсутствует'),
      summary: ctx.values.title
        ? (ctx.language === 'en' ? 'The page has a title tag.' : 'У страницы есть тег title.')
        : (ctx.language === 'en' ? 'The page is missing a title tag.' : 'У страницы отсутствует тег title.'),
      whyItMatters: ctx.ui.why.titlePresence,
      recommendation: ctx.values.title ? '' : (ctx.language === 'en' ? 'Add a unique title that clearly reflects the page topic.' : 'Добавьте уникальный title, который ясно отражает тему страницы.'),
      benchmark: '1 title tag',
    }),
    (ctx) => {
      if (!ctx.values.title) {
        return ctx.makeNotChecked({
          id: 'title-length',
          categoryId: 'metadata',
          label: ctx.ui.labels.titleLength,
          weight: 8,
          whyItMatters: ctx.ui.why.titleLength,
          benchmark: ctx.language === 'en' ? '30–65 chars' : '30–65 символов',
        })
      }
      const ok = ctx.values.title.length >= 30 && ctx.values.title.length <= 65
      return createCheck({
        id: 'title-length',
        categoryId: 'metadata',
        label: ctx.ui.labels.titleLength,
        weight: 8,
        status: ok ? 'pass' : 'warning',
        value: `${ctx.values.title.length} ${ctx.language === 'en' ? 'chars' : 'симв.'}`,
        summary: ok
          ? (ctx.language === 'en' ? 'The title length is in a solid range.' : 'Длина title находится в хорошем диапазоне.')
          : (ctx.language === 'en' ? 'The title is likely too short or too long for a clean snippet.' : 'Title, вероятно, слишком короткий или слишком длинный для аккуратного сниппета.'),
        whyItMatters: ctx.ui.why.titleLength,
        recommendation: ok ? '' : (ctx.language === 'en' ? 'Aim for a title that is easy to scan and less likely to truncate.' : 'Сделайте title таким, чтобы его было легко читать и реже обрезало в выдаче.'),
        benchmark: ctx.language === 'en' ? '30–65 chars' : '30–65 символов',
        scoreEarned: ok ? 8 : 4,
      })
    },
    (ctx) => createCheck({
      id: 'description-present',
      categoryId: 'metadata',
      label: ctx.ui.labels.descriptionPresence,
      weight: 10,
      status: ctx.values.description ? 'pass' : 'fail',
      value: ctx.values.description ? truncateText(ctx.values.description) : (ctx.language === 'en' ? 'Missing' : 'Отсутствует'),
      summary: ctx.values.description
        ? (ctx.language === 'en' ? 'The page has a meta description.' : 'У страницы есть meta description.')
        : (ctx.language === 'en' ? 'The page is missing a meta description.' : 'У страницы отсутствует meta description.'),
      whyItMatters: ctx.ui.why.descriptionPresence,
      recommendation: ctx.values.description ? '' : (ctx.language === 'en' ? 'Add a description that explains the page value concisely.' : 'Добавьте описание, которое кратко объясняет ценность страницы.'),
      benchmark: '1 description tag',
    }),
    (ctx) => {
      if (!ctx.values.description) {
        return ctx.makeNotChecked({
          id: 'description-length',
          categoryId: 'metadata',
          label: ctx.ui.labels.descriptionLength,
          weight: 7,
          whyItMatters: ctx.ui.why.descriptionLength,
          benchmark: ctx.language === 'en' ? '120–170 chars' : '120–170 символов',
        })
      }
      const ok = ctx.values.description.length >= 120 && ctx.values.description.length <= 170
      return createCheck({
        id: 'description-length',
        categoryId: 'metadata',
        label: ctx.ui.labels.descriptionLength,
        weight: 7,
        status: ok ? 'pass' : 'warning',
        value: `${ctx.values.description.length} ${ctx.language === 'en' ? 'chars' : 'симв.'}`,
        summary: ok
          ? (ctx.language === 'en' ? 'The description length is in a practical range.' : 'Длина description находится в практичном диапазоне.')
          : (ctx.language === 'en' ? 'The description could be more balanced for search snippets.' : 'Description стоит сделать более сбалансированным для сниппета.'),
        whyItMatters: ctx.ui.why.descriptionLength,
        recommendation: ok ? '' : (ctx.language === 'en' ? 'Keep the description concise but descriptive for the snippet.' : 'Сделайте description кратким, но достаточно информативным для сниппета.'),
        benchmark: ctx.language === 'en' ? '120–170 chars' : '120–170 символов',
        scoreEarned: ok ? 7 : 4,
      })
    },
    (ctx) => {
      if (ctx.data.canonical === undefined) {
        return ctx.makeNotChecked({
          id: 'canonical-present',
          categoryId: 'metadata',
          label: ctx.ui.labels.canonical,
          weight: 5,
          whyItMatters: ctx.ui.why.canonical,
          benchmark: ctx.language === 'en' ? 'Present when needed' : 'Наличие при необходимости',
        })
      }
      const canonical = typeof ctx.data.canonical === 'string' ? ctx.data.canonical.trim() : ''
      const hasCanonical = canonical.length > 0
      return createCheck({
        id: 'canonical-present',
        categoryId: 'metadata',
        label: ctx.ui.labels.canonical,
        weight: 5,
        status: hasCanonical ? 'pass' : 'warning',
        value: hasCanonical ? truncateText(canonical, 88) : (ctx.language === 'en' ? 'Missing' : 'Отсутствует'),
        summary: hasCanonical
          ? (ctx.language === 'en' ? 'A canonical URL is declared.' : 'Canonical URL указан.')
          : (ctx.language === 'en' ? 'No canonical tag was found.' : 'Canonical-тег не найден.'),
        whyItMatters: ctx.ui.why.canonical,
        recommendation: hasCanonical ? '' : (ctx.language === 'en' ? 'Add a canonical URL if the page can have duplicate variants.' : 'Добавьте canonical URL, если у страницы есть дубли.'),
        benchmark: ctx.language === 'en' ? 'Present when needed' : 'Наличие при необходимости',
        scoreEarned: hasCanonical ? 5 : 2,
      })
    },
    (ctx) => {
      if (ctx.data.canonical === undefined) {
        return ctx.makeNotChecked({
          id: 'canonical-sanity',
          categoryId: 'metadata',
          label: ctx.language === 'en' ? 'Canonical sanity' : 'Проверка canonical',
          weight: 3,
          whyItMatters: ctx.ui.why.canonical,
          benchmark: ctx.language === 'en' ? 'Absolute URL (http/https)' : 'Абсолютный URL (http/https)',
        })
      }
      const canonical = typeof ctx.data.canonical === 'string' ? ctx.data.canonical.trim() : ''
      if (!canonical) {
        return ctx.makeNotChecked({
          id: 'canonical-sanity',
          categoryId: 'metadata',
          label: ctx.language === 'en' ? 'Canonical sanity' : 'Проверка canonical',
          weight: 3,
          whyItMatters: ctx.ui.why.canonical,
          benchmark: ctx.language === 'en' ? 'Absolute URL (http/https)' : 'Абсолютный URL (http/https)',
        })
      }
      const canonicalUrl = ctx.safeParseUrl(canonical)
      const finalUrl = ctx.safeParseUrl(ctx.data.finalUrl)
      const isHttp = canonicalUrl && ['http:', 'https:'].includes(canonicalUrl.protocol)
      const isBad = !canonicalUrl || !isHttp || canonical.startsWith('#') || canonical.toLowerCase().startsWith('javascript:')
      const differentHost = canonicalUrl && finalUrl && canonicalUrl.hostname !== finalUrl.hostname
      const status = isBad ? 'fail' : differentHost ? 'warning' : 'pass'
      return createCheck({
        id: 'canonical-sanity',
        categoryId: 'metadata',
        label: ctx.language === 'en' ? 'Canonical sanity' : 'Проверка canonical',
        weight: 3,
        status,
        value: truncateText(canonical, 60),
        summary: status === 'pass'
          ? (ctx.language === 'en' ? 'Canonical looks like a valid absolute URL.' : 'Canonical выглядит как корректный абсолютный URL.')
          : status === 'warning'
            ? (ctx.language === 'en' ? 'Canonical points to a different host than the final URL.' : 'Canonical указывает на другой домен по сравнению с итоговым URL.')
            : (ctx.language === 'en' ? 'Canonical value does not look like a valid absolute page URL.' : 'Значение canonical не похоже на корректный абсолютный URL страницы.'),
        whyItMatters: ctx.ui.why.canonical,
        recommendation: status === 'pass'
          ? ''
          : (ctx.language === 'en'
              ? 'Use an absolute canonical URL that matches the preferred public version of the page.'
              : 'Укажите абсолютный canonical URL, который соответствует основной публичной версии страницы.'),
        benchmark: ctx.language === 'en' ? 'Absolute URL (http/https)' : 'Абсолютный URL (http/https)',
        scoreEarned: status === 'pass' ? 3 : status === 'warning' ? 1 : 0,
      })
    },
    (ctx) => {
      const count = typeof ctx.data.h1Count === 'number' ? ctx.data.h1Count : null
      const hasSignal = count !== null || !!ctx.values.h1Text
      if (!hasSignal) {
        return ctx.makeNotChecked({
          id: 'h1-presence',
          categoryId: 'content',
          label: ctx.ui.labels.h1Presence,
          weight: 10,
          whyItMatters: ctx.ui.why.h1Presence,
          benchmark: '1 H1',
        })
      }
      const computedCount = count ?? (ctx.values.h1Text ? 1 : 0)
      const status = computedCount > 1 ? 'warning' : ctx.values.h1Text ? 'pass' : 'fail'
      return createCheck({
        id: 'h1-presence',
        categoryId: 'content',
        label: ctx.ui.labels.h1Presence,
        weight: 10,
        status,
        value: computedCount > 1 ? `${computedCount} H1` : (ctx.values.h1Text ? truncateText(ctx.values.h1Text) : (ctx.language === 'en' ? 'Missing' : 'Отсутствует')),
        summary: status === 'pass'
          ? (ctx.language === 'en' ? 'The page has one clear H1 heading.' : 'На странице есть один понятный H1.')
          : status === 'warning'
            ? (ctx.language === 'en' ? 'Multiple H1 headings were detected.' : 'Обнаружено несколько H1-заголовков.')
            : (ctx.language === 'en' ? 'The page is missing an H1 heading.' : 'На странице отсутствует H1-заголовок.'),
        whyItMatters: ctx.ui.why.h1Presence,
        recommendation: status === 'pass' ? '' : (ctx.language === 'en' ? 'Keep one primary H1 that reflects the page topic clearly.' : 'Оставьте один основной H1, который ясно отражает тему страницы.'),
        benchmark: '1 H1',
        scoreEarned: status === 'pass' ? 10 : status === 'warning' ? 4 : 0,
      })
    },
    (ctx) => {
      if (!ctx.values.h1Text) {
        return ctx.makeNotChecked({
          id: 'h1-length',
          categoryId: 'content',
          label: ctx.ui.labels.h1Length,
          weight: 4,
          whyItMatters: ctx.ui.why.h1Length,
          benchmark: ctx.language === 'en' ? '10–70 chars' : '10–70 символов',
        })
      }
      const ok = ctx.values.h1Text.length >= 10 && ctx.values.h1Text.length <= 70
      return createCheck({
        id: 'h1-length',
        categoryId: 'content',
        label: ctx.ui.labels.h1Length,
        weight: 4,
        status: ok ? 'pass' : 'warning',
        value: `${ctx.values.h1Text.length} ${ctx.language === 'en' ? 'chars' : 'симв.'}`,
        summary: ok
          ? (ctx.language === 'en' ? 'The H1 length looks balanced.' : 'Длина H1 выглядит сбалансированной.')
          : (ctx.language === 'en' ? 'The H1 may be too short or too long.' : 'H1 может быть слишком коротким или слишком длинным.'),
        whyItMatters: ctx.ui.why.h1Length,
        recommendation: ok ? '' : (ctx.language === 'en' ? 'Use a concise H1 that explains the topic without stuffing extra phrases.' : 'Сделайте H1 кратким и понятным, без лишнего набора фраз.'),
        benchmark: ctx.language === 'en' ? '10–70 chars' : '10–70 символов',
        scoreEarned: ok ? 4 : 2,
      })
    },
    (ctx) => {
      if (ctx.data.h2Count === undefined) {
        return ctx.makeNotChecked({
          id: 'h2-coverage',
          categoryId: 'content',
          label: ctx.ui.labels.h2Coverage,
          weight: 6,
          whyItMatters: ctx.ui.why.h2Coverage,
          benchmark: ctx.language === 'en' ? 'At least 1 H2' : 'Минимум 1 H2',
        })
      }
      const count = typeof ctx.data.h2Count === 'number' ? ctx.data.h2Count : 0
      const ok = count > 0
      return createCheck({
        id: 'h2-coverage',
        categoryId: 'content',
        label: ctx.ui.labels.h2Coverage,
        weight: 6,
        status: ok ? 'pass' : 'warning',
        value: `${count} H2`,
        summary: ok
          ? (ctx.language === 'en' ? 'Supporting H2 headings were found.' : 'Поддерживающие H2-заголовки найдены.')
          : (ctx.language === 'en' ? 'No H2 headings were found.' : 'H2-заголовки не найдены.'),
        whyItMatters: ctx.ui.why.h2Coverage,
        recommendation: ok ? '' : (ctx.language === 'en' ? 'Add H2 subheadings to structure key sections of the page.' : 'Добавьте H2-подзаголовки, чтобы структурировать ключевые разделы страницы.'),
        benchmark: ctx.language === 'en' ? 'At least 1 H2' : 'Минимум 1 H2',
        scoreEarned: ok ? 6 : 2,
      })
    },
    (ctx) => {
      if (ctx.data.wordCount === undefined) {
        return ctx.makeNotChecked({
          id: 'word-count',
          categoryId: 'content',
          label: ctx.language === 'en' ? 'Word count (signal)' : 'Количество слов (сигнал)',
          weight: 2,
          whyItMatters: ctx.language === 'en'
            ? 'Extremely thin pages can struggle to satisfy search intent unless the page type is intentionally minimal.'
            : 'Слишком "тонкие" страницы хуже закрывают интент, если только страница не должна быть минимальной по типу.',
          benchmark: ctx.language === 'en' ? 'Context-dependent' : 'Зависит от типа страницы',
        })
      }
      const wc = typeof ctx.data.wordCount === 'number' ? ctx.data.wordCount : 0
      const status = wc >= 250 ? 'pass' : wc >= 120 ? 'warning' : 'fail'
      return createCheck({
        id: 'word-count',
        categoryId: 'content',
        label: ctx.language === 'en' ? 'Word count (signal)' : 'Количество слов (сигнал)',
        weight: 2,
        status,
        value: `${wc}`,
        summary: status === 'pass'
          ? (ctx.language === 'en' ? 'The page has a reasonable amount of text content.' : 'На странице достаточно текста для большинства сценариев.')
          : status === 'warning'
            ? (ctx.language === 'en' ? 'The page looks relatively thin on text content.' : 'Страница выглядит относительно "тонкой" по объёму текста.')
            : (ctx.language === 'en' ? 'The page looks extremely thin on text content.' : 'Страница выглядит слишком "тонкой" по объёму текста.'),
        whyItMatters: ctx.language === 'en'
          ? 'Extremely thin pages can struggle to satisfy search intent unless the page type is intentionally minimal.'
          : 'Слишком "тонкие" страницы хуже закрывают интент, если только страница не должна быть минимальной по типу.',
        recommendation: status === 'pass'
          ? ''
          : (ctx.language === 'en'
              ? 'Ensure the page answers the query thoroughly (examples, explanations, FAQs), or clarify the intent if it is a utility page.'
              : 'Проверьте, что страница полно отвечает на запрос (примеры, объяснения, FAQ), либо уточните интент, если это утилита.'),
        benchmark: ctx.language === 'en' ? '250+ words (heuristic)' : '250+ слов (эвристика)',
        scoreEarned: status === 'pass' ? 2 : status === 'warning' ? 1 : 0,
      })
    },
    (ctx) => {
      if (ctx.data.openGraph === undefined) {
        return ctx.makeNotChecked({
          id: 'open-graph',
          categoryId: 'enhancements',
          label: ctx.ui.labels.openGraph,
          weight: 8,
          whyItMatters: ctx.ui.why.openGraph,
          benchmark: '3/3',
        })
      }
      const og = ctx.data.openGraph
      const count = og ? ['title', 'description', 'image'].filter((key) => og?.[key]).length : 0
      const status = count === 3 ? 'pass' : count > 0 ? 'warning' : 'fail'
      return createCheck({
        id: 'open-graph',
        categoryId: 'enhancements',
        label: ctx.ui.labels.openGraph,
        weight: 8,
        status,
        value: `${count}/3`,
        summary: status === 'pass'
          ? (ctx.language === 'en' ? 'Open Graph tags are complete.' : 'Open Graph-теги заполнены полностью.')
          : status === 'warning'
            ? (ctx.language === 'en' ? 'Open Graph is present but incomplete.' : 'Open Graph есть, но заполнен не полностью.')
            : (ctx.language === 'en' ? 'Open Graph tags were not found.' : 'Open Graph-теги не найдены.'),
        whyItMatters: ctx.ui.why.openGraph,
        recommendation: status === 'pass' ? '' : (ctx.language === 'en' ? 'Add og:title, og:description, and og:image for consistent previews.' : 'Добавьте og:title, og:description и og:image для стабильных превью.'),
        benchmark: '3/3',
        scoreEarned: status === 'pass' ? 8 : status === 'warning' ? 4 : 0,
      })
    },
    (ctx) => {
      if (ctx.data.twitter === undefined) {
        return ctx.makeNotChecked({
          id: 'twitter-cards',
          categoryId: 'enhancements',
          label: ctx.ui.labels.twitter,
          weight: 4,
          whyItMatters: ctx.ui.why.twitter,
          benchmark: '3+/4',
        })
      }
      const tw = ctx.data.twitter
      const count = tw ? ['card', 'title', 'description', 'image'].filter((key) => tw?.[key]).length : 0
      const status = count >= 3 ? 'pass' : count > 0 ? 'warning' : 'fail'
      return createCheck({
        id: 'twitter-cards',
        categoryId: 'enhancements',
        label: ctx.ui.labels.twitter,
        weight: 4,
        status,
        value: `${count}/4`,
        summary: status === 'pass'
          ? (ctx.language === 'en' ? 'Twitter/X card tags are in place.' : 'Twitter/X card-теги на месте.')
          : status === 'warning'
            ? (ctx.language === 'en' ? 'Twitter/X card tags are only partially present.' : 'Twitter/X card-теги заполнены частично.')
            : (ctx.language === 'en' ? 'Twitter/X card tags were not found.' : 'Twitter/X card-теги не найдены.'),
        whyItMatters: ctx.ui.why.twitter,
        recommendation: status === 'pass' ? '' : (ctx.language === 'en' ? 'Add card type, title, description, and image for stronger previews.' : 'Добавьте тип карточки, title, description и image для более сильного превью.'),
        benchmark: '3+/4',
        scoreEarned: status === 'pass' ? 4 : status === 'warning' ? 2 : 0,
      })
    },
    (ctx) => {
      if (ctx.data.hasStructuredData === undefined) {
        return ctx.makeNotChecked({
          id: 'structured-data',
          categoryId: 'enhancements',
          label: ctx.ui.labels.structuredData,
          weight: 3,
          whyItMatters: ctx.ui.why.structuredData,
          benchmark: ctx.language === 'en' ? 'Present when applicable' : 'Наличие при необходимости',
        })
      }
      const present = ctx.data.hasStructuredData === true
      return createCheck({
        id: 'structured-data',
        categoryId: 'enhancements',
        label: ctx.ui.labels.structuredData,
        weight: 3,
        status: present ? 'pass' : 'warning',
        value: present ? (ctx.language === 'en' ? 'Present' : 'Есть') : (ctx.language === 'en' ? 'Missing' : 'Нет'),
        summary: present
          ? (ctx.language === 'en' ? 'Structured data was detected.' : 'Структурированные данные обнаружены.')
          : (ctx.language === 'en' ? 'Structured data was not detected.' : 'Структурированные данные не обнаружены.'),
        whyItMatters: ctx.ui.why.structuredData,
        recommendation: present ? '' : (ctx.language === 'en' ? 'Consider adding Schema.org markup where it fits the page type.' : 'Рассмотрите добавление Schema.org-разметки, если она подходит типу страницы.'),
        benchmark: ctx.language === 'en' ? 'Present when applicable' : 'Наличие при необходимости',
        scoreEarned: present ? 3 : 1,
      })
    },
    (ctx) => {
      const hasSignals = typeof ctx.data.imagesTotal === 'number' && typeof ctx.data.imagesWithoutAlt === 'number'
      if (!hasSignals) {
        return ctx.makeNotChecked({
          id: 'alt-coverage',
          categoryId: 'accessibility',
          label: ctx.ui.labels.altCoverage,
          weight: 8,
          whyItMatters: ctx.ui.why.altCoverage,
          benchmark: ctx.language === 'en' ? '100% covered' : '100% покрытие',
        })
      }
      const total = ctx.data.imagesTotal
      const withoutAlt = ctx.data.imagesWithoutAlt
      const ratio = total > 0 ? (total - withoutAlt) / total : 1
      const status = total === 0 || ratio === 1 ? 'pass' : ratio >= 0.7 ? 'warning' : 'fail'
      return createCheck({
        id: 'alt-coverage',
        categoryId: 'accessibility',
        label: ctx.ui.labels.altCoverage,
        weight: 8,
        status,
        value: total === 0 ? (ctx.language === 'en' ? 'No images' : 'Нет изображений') : `${total - withoutAlt}/${total}`,
        summary: total === 0
          ? (ctx.language === 'en' ? 'The page has no images that need alt coverage.' : 'На странице нет изображений, требующих alt-атрибутов.')
          : ratio === 1
            ? (ctx.language === 'en' ? 'All detected images have alt attributes.' : 'У всех найденных изображений есть alt-атрибуты.')
            : (ctx.language === 'en' ? 'Some images are missing alt attributes.' : 'У части изображений отсутствуют alt-атрибуты.'),
        whyItMatters: ctx.ui.why.altCoverage,
        recommendation: status === 'pass' ? '' : (ctx.language === 'en' ? 'Add descriptive alt text to informative images; keep decorative images intentionally empty.' : 'Добавьте описательные alt к информативным изображениям; декоративные оставляйте осознанно пустыми.'),
        benchmark: ctx.language === 'en' ? '100% covered' : '100% покрытие',
        scoreEarned: status === 'pass' ? 8 : status === 'warning' ? 4 : 0,
      })
    },
    (ctx) => {
      const hasSignals = typeof ctx.data.internalLinks === 'number' || typeof ctx.data.externalLinks === 'number'
      if (!hasSignals) {
        return ctx.makeNotChecked({
          id: 'link-signals',
          categoryId: 'accessibility',
          label: ctx.ui.labels.linkMix,
          weight: 2,
          whyItMatters: ctx.ui.why.linkMix,
          benchmark: ctx.language === 'en' ? 'At least one crawlable link' : 'Хотя бы одна сканируемая ссылка',
        })
      }
      const internal = typeof ctx.data.internalLinks === 'number' ? ctx.data.internalLinks : 0
      const external = typeof ctx.data.externalLinks === 'number' ? ctx.data.externalLinks : 0
      const total = internal + external
      const status = total > 0 ? 'pass' : 'warning'
      return createCheck({
        id: 'link-signals',
        categoryId: 'accessibility',
        label: ctx.ui.labels.linkMix,
        weight: 2,
        status,
        value: `${internal} / ${external}`,
        summary: total > 0
          ? (ctx.language === 'en' ? 'The page exposes crawlable link signals.' : 'На странице есть сканируемые ссылочные сигналы.')
          : (ctx.language === 'en' ? 'No internal or external links were detected.' : 'Внутренние и внешние ссылки не обнаружены.'),
        whyItMatters: ctx.ui.why.linkMix,
        recommendation: total > 0 ? '' : (ctx.language === 'en' ? 'Ensure important pages include meaningful internal navigation or supporting links.' : 'Проверьте, что важная страница содержит внутреннюю навигацию или полезные ссылки.'),
        benchmark: ctx.language === 'en' ? 'At least one crawlable link' : 'Хотя бы одна сканируемая ссылка',
        scoreEarned: total > 0 ? 2 : 1,
      })
    },
  ]

  CHECK_CATALOG.forEach((factory) => {
    const check = factory(ctx)
    if (check) checks.push(check)
  })

  const categories = AUDIT_CATEGORY_ORDER.map((categoryConfig) => {
    const categoryChecks = checks.filter((check) => check.categoryId === categoryConfig.id)
    const checkedItems = categoryChecks.filter((check) => check.status !== 'na')
    const earned = checkedItems.reduce((sum, check) => sum + (check.scoreEarned || 0), 0)
    const available = checkedItems.reduce((sum, check) => sum + check.weight, 0)
    const percent = available ? Math.round((earned / available) * 100) : 0

    return {
      id: categoryConfig.id,
      label: ui.categories[categoryConfig.id],
      maxScore: available || 0,
      earned,
      available,
      score: available ? earned : null,
      percent,
      status: getCategoryStatus(categoryChecks),
      checks: categoryChecks,
      counts: {
        pass: categoryChecks.filter((check) => check.status === 'pass').length,
        warning: categoryChecks.filter((check) => check.status === 'warning').length,
        fail: categoryChecks.filter((check) => check.status === 'fail').length,
        na: categoryChecks.filter((check) => check.status === 'na').length,
      },
    }
  })

  const checkedChecks = checks.filter((check) => check.status !== 'na')
  const totalAvailableWeight = checkedChecks.reduce((sum, check) => sum + check.weight, 0)
  const totalEarnedWeight = checkedChecks.reduce((sum, check) => sum + (check.scoreEarned || 0), 0)
  const score = totalAvailableWeight ? Math.round((totalEarnedWeight / totalAvailableWeight) * 100) : 0
  const issueChecks = checks.filter((check) => check.status === 'fail' || check.status === 'warning')
  const suggestions = Array.from(new Set(issueChecks.map((check) => check.recommendation).filter(Boolean)))
  const issues = issueChecks.map((check) => ({
    type: check.status === 'fail' ? 'error' : 'warning',
    text: `${check.label}: ${check.summary}`,
  }))
  const topFixes = [...issueChecks]
    .sort((a, b) => ((b.weight - (b.scoreEarned || 0)) - (a.weight - (a.scoreEarned || 0))))
    .slice(0, 5)
  const passedHighlights = checks.filter((check) => check.status === 'pass').slice(0, 5)

  return {
    score,
    issues,
    suggestions,
    data,
    summary: {
      score,
      source: data.source,
      checkedCount: checkedChecks.length,
      totalChecks: checks.length,
      coveragePercent: checks.length ? Math.round((checkedChecks.length / checks.length) * 100) : 0,
      totalAvailableWeight,
      totalEarnedWeight,
    },
    categories,
    checks,
    highlights: {
      topFixes,
      passedHighlights,
    },
  }
}

function getScoreColor(score) {
  if (score >= 80) return 'var(--success)'
  if (score >= 60) return '#f59e0b'
  return 'var(--error)'
}

function getScoreTone(score) {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'error'
}

function matchesCheckFilter(check, filter) {
  if (filter === 'issues') return check.status === 'fail' || check.status === 'warning'
  if (filter === 'all') return true
  if (filter === 'errors') return check.status === 'fail'
  if (filter === 'warnings') return check.status === 'warning'
  if (filter === 'passed') return check.status === 'pass'
  if (filter === 'na') return check.status === 'na'
  return true
}

function getVisibleAuditCategories(analysis, { checkFilter = 'all', activeCategoryId = null } = {}) {
  if (!analysis?.categories) return []

  return analysis.categories
    .filter((category) => !activeCategoryId || category.id === activeCategoryId)
    .map((category) => ({
      ...category,
      visibleChecks: category.checks.filter((check) => matchesCheckFilter(check, checkFilter)),
    }))
    .filter((category) => category.visibleChecks.length > 0)
}

function getVisibleAuditCheckCount(categories) {
  return categories.reduce((sum, category) => sum + category.visibleChecks.length, 0)
}

function getDefaultExpandedCheckIds(analysis) {
  return new Set((analysis?.highlights?.topFixes || []).map((check) => check.id))
}

function createWorkerAnalysis(data, language) {
  return buildAuditReport({
    source: 'worker',
    ...data,
  }, language)
}

function createFallbackAnalysis(fallbackResult, normalizedUrl, language) {
  return buildAuditReport({
    source: 'browser',
    finalUrl: fallbackResult.details?.finalUrl || normalizedUrl,
    status: fallbackResult.details?.status ?? null,
    ok: fallbackResult.details?.ok ?? true,
    contentType: fallbackResult.details?.contentType || 'text/html (browser fallback)',
    title: fallbackResult.details?.title || null,
    description: fallbackResult.details?.description || null,
    keywords: fallbackResult.details?.keywords || null,
    robots: fallbackResult.details?.robots || null,
    canonical: fallbackResult.details?.canonical || null,
    h1Text: fallbackResult.details?.h1Text || null,
    h1Count: fallbackResult.details?.h1Count ?? 0,
    h2Count: fallbackResult.details?.h2Count ?? null,
    h3Count: fallbackResult.details?.h3Count ?? null,
    imagesTotal: fallbackResult.details?.imagesTotal ?? null,
    imagesWithoutAlt: fallbackResult.details?.imagesWithoutAlt ?? null,
    hasStructuredData: fallbackResult.details?.hasStructuredData ?? null,
    openGraph: fallbackResult.details?.openGraph || null,
    twitter: fallbackResult.details?.twitter || null,
    internalLinks: fallbackResult.details?.internalLinks ?? null,
    externalLinks: fallbackResult.details?.externalLinks ?? null,
    wordCount: fallbackResult.details?.wordCount ?? null,
    lang: fallbackResult.details?.lang || null,
    viewport: fallbackResult.details?.viewport || null,
  }, language)
}

export {
  buildAuditReport,
  createWorkerAnalysis,
  createFallbackAnalysis,
  getDefaultExpandedCheckIds,
  getScoreColor,
  getScoreTone,
  getVisibleAuditCategories,
  getVisibleAuditCheckCount,
  matchesCheckFilter,
}
