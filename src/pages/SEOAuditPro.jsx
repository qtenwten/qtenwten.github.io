import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect, useMemo } from 'react'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import { seoAuditCache } from '../utils/apiCache'
import { analyzeSEO } from '../utils/seoAudit'
import InlineSpinner from '../components/InlineSpinner'
import { useAsyncRequest } from '../hooks/useAsyncRequest'
import { ResultActions, ResultDetails, ResultNotice, ResultSection, ResultSummary } from '../components/ResultSection'
import ToolPageShell, { ToolControls, ToolHelp, ToolPageHero, ToolRelated } from '../components/ToolPageShell'
import './SEOAuditPro.css'

const SEO_AUDIT_WORKER_URL = 'https://seo-audit-api.qten.workers.dev/'

async function readApiResponse(response) {
  const contentType = (response.headers.get('content-type') || '').toLowerCase()
  const bodyText = await response.text()
  const trimmedBody = bodyText.trim()

  const looksLikeHtml =
    contentType.includes('text/html') ||
    trimmedBody.startsWith('<!DOCTYPE') ||
    trimmedBody.startsWith('<html') ||
    trimmedBody.startsWith('<')

  if (looksLikeHtml) {
    const error = new Error('API returned HTML instead of JSON')
    error.code = 'HTML_RESPONSE'
    error.html = bodyText
    error.status = response.status
    throw error
  }

  try {
    return trimmedBody ? JSON.parse(bodyText) : {}
  } catch (error) {
    const parseError = new Error('API returned invalid JSON')
    parseError.code = 'INVALID_JSON'
    parseError.status = response.status
    parseError.cause = error
    throw parseError
  }
}

function normalizeAuditUrl(rawUrl) {
  const trimmedUrl = rawUrl.trim()

  if (!trimmedUrl) {
    return ''
  }

  const normalizedUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`
  const parsedUrl = new URL(normalizedUrl)

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Invalid URL protocol')
  }

  return parsedUrl.toString()
}

async function requestWorkerAudit(normalizedUrl, signal) {
  const response = await fetch(`${SEO_AUDIT_WORKER_URL}?url=${encodeURIComponent(normalizedUrl)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  const data = await readApiResponse(response)

  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Worker request failed')
    error.code = 'WORKER_ERROR'
    error.status = response.status
    throw error
  }

  if (data?.error) {
    const error = new Error(data.error)
    error.code = 'WORKER_ERROR'
    throw error
  }

  return data
}

const AUDIT_UI_COPY = {
  en: {
    sourceWorker: 'Worker audit',
    sourceFallback: 'Limited browser audit',
    coverage: 'Coverage',
    checkedChecks: 'Verified checks',
    categoryScores: 'Category scores',
    scoreBreakdown: 'Scoring breakdown',
    topPriorities: 'What to fix first',
    allGoodTitle: 'Everything checked passed',
    allGoodText: 'The audit did not find active issues in the verified checks. The breakdown below shows what contributed to the score.',
    filtersTitle: 'Show checks',
    filterAll: 'All',
    filterErrors: 'Errors',
    filterWarnings: 'Warnings',
    filterPassed: 'Passed',
    filterUnavailable: 'Not checked',
    whyItMatters: 'Why it matters',
    recommendation: 'How to improve',
    benchmark: 'Target',
    currentValue: 'Current value',
    rawSignals: 'Raw audit snapshot',
    rawHint: 'Use these values when you need the exact fields returned by the audit.',
    noRecommendation: 'No action needed.',
    notChecked: 'This signal was not available in the current audit source.',
    impact: 'Score',
    scoreOutOf: (earned, max) => `${earned}/${max}`,
    checksCount: (checked, total) => `${checked}/${total} checks`,
    scoreSummary: (score) => score >= 90
      ? 'Strong on-page SEO signals across the verified checks.'
      : score >= 70
        ? 'Most important signals look good, but there are clear improvements available.'
        : 'Several important signals need work before the page looks fully optimized.',
    status: {
      pass: 'OK',
      warning: 'Warning',
      fail: 'Error',
      na: 'Not checked',
    },
    categories: {
      technical: 'Technical SEO',
      metadata: 'Metadata',
      content: 'Content structure',
      enhancements: 'Rich results',
      accessibility: 'Media & accessibility',
    },
    labels: {
      httpStatus: 'HTTP status',
      htmlContent: 'HTML response',
      httpsUrl: 'HTTPS final URL',
      robots: 'Robots directives',
      titlePresence: 'Title tag present',
      titleLength: 'Title length',
      descriptionPresence: 'Meta description present',
      descriptionLength: 'Meta description length',
      canonical: 'Canonical tag',
      h1Presence: 'Primary H1',
      h1Length: 'H1 length',
      h2Coverage: 'Supporting H2 headings',
      openGraph: 'Open Graph',
      twitter: 'Twitter cards',
      structuredData: 'Structured data',
      altCoverage: 'Image alt coverage',
      linkMix: 'Link signals',
    },
    why: {
      httpStatus: 'Search engines need the page to resolve successfully before any other signal matters.',
      htmlContent: 'The audit should target a regular HTML page, not a file or API response.',
      httpsUrl: 'HTTPS is a basic trust and indexing expectation for public pages.',
      robots: 'Robots directives can block indexing even when everything else is correct.',
      titlePresence: 'The title tag is one of the strongest on-page signals and shapes the search snippet.',
      titleLength: 'A well-sized title is easier to read and less likely to be truncated in search results.',
      descriptionPresence: 'Meta descriptions influence snippet quality and click-through context.',
      descriptionLength: 'A balanced description is easier to display cleanly in search results.',
      canonical: 'Canonical tags help search engines understand which version of a page should rank.',
      h1Presence: 'A clear H1 helps align the page topic with search intent and document structure.',
      h1Length: 'An H1 should be specific enough to clarify the topic without becoming bloated.',
      h2Coverage: 'Subheadings help structure the content for both users and search engines.',
      openGraph: 'Open Graph tags improve link previews in messengers and social platforms.',
      twitter: 'Twitter/X cards add consistent preview data beyond default link scraping.',
      structuredData: 'Structured data can improve eligibility for enhanced search presentation.',
      altCoverage: 'Descriptive alt text improves accessibility and helps search engines understand images.',
      linkMix: 'A healthy link profile indicates crawl paths and page context.',
    },
  },
  ru: {
    sourceWorker: 'Проверка через worker',
    sourceFallback: 'Ограниченная браузерная проверка',
    coverage: 'Покрытие',
    checkedChecks: 'Проверено',
    categoryScores: 'Оценка по категориям',
    scoreBreakdown: 'Детальный разбор оценки',
    topPriorities: 'Что исправить в первую очередь',
    allGoodTitle: 'Все проверенные сигналы в порядке',
    allGoodText: 'Активных проблем в проверенных сигналах не найдено. Ниже видно, какие именно проверки дали итоговую оценку.',
    filtersTitle: 'Показать проверки',
    filterAll: 'Все',
    filterErrors: 'Ошибки',
    filterWarnings: 'Предупреждения',
    filterPassed: 'ОК',
    filterUnavailable: 'Не проверено',
    whyItMatters: 'Почему это важно',
    recommendation: 'Что улучшить',
    benchmark: 'Ориентир',
    currentValue: 'Текущее значение',
    rawSignals: 'Сырые сигналы аудита',
    rawHint: 'Этот блок показывает точные значения, которые вернул аудит.',
    noRecommendation: 'Доработка не требуется.',
    notChecked: 'Этот сигнал недоступен в текущем источнике аудита.',
    impact: 'Баллы',
    scoreOutOf: (earned, max) => `${earned}/${max}`,
    checksCount: (checked, total) => `${checked}/${total} проверок`,
    scoreSummary: (score) => score >= 90
      ? 'По проверенным сигналам страница выглядит сильно и аккуратно оптимизированной.'
      : score >= 70
        ? 'Основные сигналы в порядке, но остаются понятные точки роста.'
        : 'Есть несколько важных проблем, которые заметно тянут оценку вниз.',
    status: {
      pass: 'OK',
      warning: 'Предупреждение',
      fail: 'Ошибка',
      na: 'Не проверено',
    },
    categories: {
      technical: 'Техническое SEO',
      metadata: 'Метаданные',
      content: 'Структура контента',
      enhancements: 'Расширенные сниппеты',
      accessibility: 'Медиа и доступность',
    },
    labels: {
      httpStatus: 'HTTP-статус',
      htmlContent: 'HTML-страница',
      httpsUrl: 'HTTPS у итогового URL',
      robots: 'Robots-директива',
      titlePresence: 'Наличие title',
      titleLength: 'Длина title',
      descriptionPresence: 'Наличие description',
      descriptionLength: 'Длина description',
      canonical: 'Canonical',
      h1Presence: 'Основной H1',
      h1Length: 'Длина H1',
      h2Coverage: 'Подзаголовки H2',
      openGraph: 'Open Graph',
      twitter: 'Twitter cards',
      structuredData: 'Структурированные данные',
      altCoverage: 'Alt у изображений',
      linkMix: 'Ссылочные сигналы',
    },
    why: {
      httpStatus: 'Пока страница не отдает корректный ответ, остальные SEO-сигналы не имеют смысла.',
      htmlContent: 'Для индексации важна именно обычная HTML-страница, а не файл или API-ответ.',
      httpsUrl: 'HTTPS — базовый сигнал доверия и нормальная практика для индексируемых страниц.',
      robots: 'Robots может заблокировать индексацию даже при хороших остальных сигналах.',
      titlePresence: 'Title — один из главных on-page сигналов и основа поискового сниппета.',
      titleLength: 'Сбалансированный title читается лучше и реже обрезается в выдаче.',
      descriptionPresence: 'Meta description помогает контролировать смысл и привлекательность сниппета.',
      descriptionLength: 'Слишком короткое или длинное описание хуже работает в сниппете.',
      canonical: 'Canonical помогает поисковикам понять, какая версия страницы является основной.',
      h1Presence: 'Понятный H1 помогает связать тему страницы с поисковым интентом и структурой документа.',
      h1Length: 'H1 должен быть достаточно конкретным, но не перегруженным.',
      h2Coverage: 'Подзаголовки помогают структурировать контент и улучшают сканируемость страницы.',
      openGraph: 'Open Graph отвечает за качественный превью-блок в соцсетях и мессенджерах.',
      twitter: 'Twitter/X cards дополняют социальные превью и повышают консистентность ссылок.',
      structuredData: 'Структурированные данные повышают шанс на расширенное отображение в поиске.',
      altCoverage: 'Описательные alt улучшают доступность и помогают поисковикам понимать изображения.',
      linkMix: 'Ссылки помогают понять структуру страницы и её связь с другими документами.',
    },
  },
}

const AUDIT_CATEGORY_ORDER = [
  { id: 'technical' },
  { id: 'metadata' },
  { id: 'content' },
  { id: 'enhancements' },
  { id: 'accessibility' },
]

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

function normalizeAuditData(data) {
  const raw = data || {}

  const asTrimmedString = (value) => {
    if (value == null) return null
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }

  const asMaybeNumber = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }
    return null
  }

  const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)

  // NOTE: We treat `undefined` as "unknown / not provided by the source".
  // `null` means "known missing / empty".
  const normalized = {
    source: hasOwn(raw, 'source') ? (asTrimmedString(raw.source) || 'worker') : 'worker',
    finalUrl: hasOwn(raw, 'finalUrl') ? asTrimmedString(raw.finalUrl) : undefined,
    status: hasOwn(raw, 'status') ? asMaybeNumber(raw.status) : undefined,
    ok: hasOwn(raw, 'ok') ? raw.ok !== false : undefined,
    contentType: hasOwn(raw, 'contentType') ? (asTrimmedString(raw.contentType) || null) : undefined,
    title: hasOwn(raw, 'title') ? asTrimmedString(raw.title) : undefined,
    description: hasOwn(raw, 'description')
      ? asTrimmedString(raw.description)
      : hasOwn(raw, 'metaDescription')
        ? asTrimmedString(raw.metaDescription)
        : undefined,
    keywords: hasOwn(raw, 'keywords') ? asTrimmedString(raw.keywords) : undefined,
    robots: hasOwn(raw, 'robots') ? asTrimmedString(raw.robots) : undefined,
    canonical: hasOwn(raw, 'canonical') ? asTrimmedString(raw.canonical) : undefined,
    h1Text: hasOwn(raw, 'h1Text')
      ? asTrimmedString(raw.h1Text)
      : hasOwn(raw, 'h1')
        ? asTrimmedString(raw.h1)
        : undefined,
    h1Count: hasOwn(raw, 'h1Count')
      ? asMaybeNumber(raw.h1Count)
      : undefined,
    h2Count: hasOwn(raw, 'h2Count') ? asMaybeNumber(raw.h2Count) : undefined,
    h3Count: hasOwn(raw, 'h3Count') ? asMaybeNumber(raw.h3Count) : undefined,
    imagesTotal: hasOwn(raw, 'imagesTotal') ? asMaybeNumber(raw.imagesTotal) : undefined,
    imagesWithoutAlt: hasOwn(raw, 'imagesWithoutAlt') ? asMaybeNumber(raw.imagesWithoutAlt) : undefined,
    hasStructuredData: hasOwn(raw, 'hasStructuredData')
      ? (typeof raw.hasStructuredData === 'boolean' ? raw.hasStructuredData : null)
      : undefined,
    openGraph: hasOwn(raw, 'openGraph') ? raw.openGraph : undefined,
    twitter: hasOwn(raw, 'twitter') ? raw.twitter : undefined,
    lang: hasOwn(raw, 'lang') ? asTrimmedString(raw.lang) : undefined,
    viewport: hasOwn(raw, 'viewport') ? asTrimmedString(raw.viewport) : undefined,
    internalLinks: hasOwn(raw, 'internalLinks') ? asMaybeNumber(raw.internalLinks) : undefined,
    externalLinks: hasOwn(raw, 'externalLinks') ? asMaybeNumber(raw.externalLinks) : undefined,
    wordCount: hasOwn(raw, 'wordCount') ? asMaybeNumber(raw.wordCount) : undefined,
    evidenceRaw: raw,
  }

  const openGraphFromLegacy = (raw.ogTitle || raw.ogDescription || raw.ogImage)
    ? {
        title: asTrimmedString(raw.ogTitle),
        description: asTrimmedString(raw.ogDescription),
        image: asTrimmedString(raw.ogImage),
      }
    : null
  const twitterFromLegacy = (raw.twitterCard || raw.twitterTitle || raw.twitterDescription || raw.twitterImage)
    ? {
        card: asTrimmedString(raw.twitterCard),
        title: asTrimmedString(raw.twitterTitle),
        description: asTrimmedString(raw.twitterDescription),
        image: asTrimmedString(raw.twitterImage),
      }
    : null

  if (normalized.openGraph === undefined && openGraphFromLegacy) {
    normalized.openGraph = openGraphFromLegacy
  }
  if (normalized.twitter === undefined && twitterFromLegacy) {
    normalized.twitter = twitterFromLegacy
  }

  // Normalize known shapes to either an object or null, but keep undefined as "unknown".
  const normalizeSocialObject = (value, fields) => {
    if (value === undefined) return undefined
    if (value === null) return null
    if (typeof value !== 'object') return null
    const result = {}
    let hasAny = false
    fields.forEach((field) => {
      const fieldValue = asTrimmedString(value[field])
      result[field] = fieldValue
      if (fieldValue) hasAny = true
    })
    return hasAny ? result : null
  }

  normalized.openGraph = normalizeSocialObject(normalized.openGraph, ['title', 'description', 'image'])
  normalized.twitter = normalizeSocialObject(normalized.twitter, ['card', 'title', 'description', 'image'])

  // Fill derived counts only if the source provided enough evidence.
  if (normalized.h1Count === undefined) {
    if (normalized.h1Text) normalized.h1Count = 1
  }

  return normalized
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
    // TECHNICAL
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

    // METADATA
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

    // CONTENT
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
            : 'Слишком “тонкие” страницы хуже закрывают интент, если только страница не должна быть минимальной по типу.',
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
            ? (ctx.language === 'en' ? 'The page looks relatively thin on text content.' : 'Страница выглядит относительно “тонкой” по объёму текста.')
            : (ctx.language === 'en' ? 'The page looks extremely thin on text content.' : 'Страница выглядит слишком “тонкой” по объёму текста.'),
        whyItMatters: ctx.language === 'en'
          ? 'Extremely thin pages can struggle to satisfy search intent unless the page type is intentionally minimal.'
          : 'Слишком “тонкие” страницы хуже закрывают интент, если только страница не должна быть минимальной по типу.',
        recommendation: status === 'pass'
          ? ''
          : (ctx.language === 'en'
              ? 'Ensure the page answers the query thoroughly (examples, explanations, FAQs), or clarify the intent if it is a utility page.'
              : 'Проверьте, что страница полно отвечает на запрос (примеры, объяснения, FAQ), либо уточните интент, если это утилита.'),
        benchmark: ctx.language === 'en' ? '250+ words (heuristic)' : '250+ слов (эвристика)',
        scoreEarned: status === 'pass' ? 2 : status === 'warning' ? 1 : 0,
      })
    },

    // ENHANCEMENTS
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

    // ACCESSIBILITY
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
  if (filter === 'all') return true
  if (filter === 'errors') return check.status === 'fail'
  if (filter === 'warnings') return check.status === 'warning'
  if (filter === 'passed') return check.status === 'pass'
  if (filter === 'na') return check.status === 'na'
  return true
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

function SEOAuditPro() {
  const { t, language } = useLanguage()
  const { runRequest } = useAsyncRequest()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [checkFilter, setCheckFilter] = useState('all')
  const auditUi = AUDIT_UI_COPY[language] || AUDIT_UI_COPY.ru

  const copy = language === 'en'
    ? {
        seo: {
          title: 'SEO Audit Tool Online | Full On-Page SEO Checker',
          description: 'Run a full on-page SEO audit for any URL. Check titles, meta descriptions, headings, Open Graph tags, images, and page structure.',
          keywords: 'seo audit tool, on-page seo checker, website seo audit, seo checker online, technical seo audit'
        },
        title: 'SEO Audit Tool Online',
        subtitle: 'Run a deeper on-page SEO audit for any public URL',
        urlLabel: 'Website URL',
        emptyUrl: 'Enter a URL to analyze',
        invalidUrl: 'Enter a valid website URL',
        genericError: 'An error occurred while analyzing the website',
        genericRetry: 'An error occurred during the analysis. Check the URL and try again.',
        invalidApiResponse: 'The remote audit service returned an unexpected response.',
        fallbackNotice: 'The remote audit service could not be reached, so a limited browser-based audit was used instead.',
        fallbackFailed: 'The remote audit service is unavailable, and the page could not be checked from the browser because of cross-origin restrictions.',
        errorTitle: 'Error:',
        analyze: 'Analyze',
        analyzing: 'Analyzing page...',
        score: 'SEO Score',
        excellent: 'Excellent optimization',
        good: 'Good, but there is room to improve',
        poor: 'Optimization is needed',
        share: 'Share result',
        shareSuccess: '✅ Link copied to clipboard!\n\nSend it to someone so they can open the analysis result.',
        sharePrompt: 'Copy this link:',
        issues: 'Found issues',
        suggestions: 'Recommendations',
        details: 'Analysis details',
        missing: 'Missing',
        keywordsMissing: 'Missing',
        h1: 'H1 headings',
        h2: 'H2 headings',
        h3: 'H3 headings',
        images: 'Images',
        withoutAlt: 'without alt',
        finalUrl: 'Final URL',
        status: 'HTTP status',
        contentType: 'Content type',
        canonical: 'Canonical URL',
        robotsLabel: 'Robots',
        notAvailable: 'Not available',
        ogReady: 'Configured',
        ogPartial: 'Incomplete',
        structuredYes: 'Present',
        structuredNo: 'Missing',
        infoTitle: 'A deeper SEO audit for real page reviews',
        infoDescription: 'Use this SEO audit tool to review a public page the way you would during a real on-page audit. It is useful for competitor research, landing page reviews, client work, and quick technical checks before publishing.',
        checksTitle: 'What the audit checks:',
        checks: [
          'Title tags and meta descriptions',
          'Heading structure including H1, H2, and H3',
          'Image alt text coverage',
          'Open Graph tags for sharing',
          'Structured data where present',
          'Robots directives and basic crawl hints'
        ],
        benefitsTitle: 'Why use this audit tool:',
        benefits: [
          'Audit public pages without browser-side CORS limits',
          'Review metadata, headings, and structure in one report',
          'Spot quick wins before publishing or updating a page',
          'Use it for competitor reviews and landing page checks',
          'Get a simple score for prioritizing fixes'
        ],
        ratingTitle: 'How to read the score:',
        rating: ['80-100 points - strong on-page SEO signals', '60-79 points - solid, but there is room to improve', '0-59 points - several important issues need work'],
        faqTitle: 'FAQ',
        faq: [
          { q: 'How do I run an SEO audit for a page?', a: 'Enter the page URL and the tool will analyze key on-page elements such as titles, descriptions, headings, alt text, and social tags.' },
          { q: 'Can I audit competitor pages?', a: 'Yes. This tool works well for reviewing public competitor pages and comparing basic on-page SEO signals.' },
          { q: 'What is the difference between this tool and the quick audit?', a: 'This version is designed for deeper page-level checks on public URLs and is better suited for competitive review and detailed inspection.' },
          { q: 'Is this useful for landing pages and blog posts?', a: 'Yes. It works well for landing pages, product pages, blog posts, and other public URLs that need on-page SEO review.' }
        ],
        sharedPreview: (sharedUrl, sharedScore, sharedIssues) => `📊 SEO analysis preview for ${sharedUrl}\n\nScore: ${sharedScore}/100\nIssues: ${sharedIssues}\n\nClick "Analyze" to load the full report.`,
        analysis: {
          missingTitle: 'Missing <title> tag',
          addTitle: 'Add a unique page title (50-60 characters)',
          shortTitle: '<title> tag is too short',
          extendTitle: 'Increase the title length to 50-60 characters',
          longTitle: '<title> tag is too long',
          reduceTitle: 'Shorten the title to 50-60 characters',
          missingDescription: 'Missing meta description',
          addDescription: 'Add a page description (150-160 characters)',
          shortDescription: 'Meta description is too short',
          extendDescription: 'Increase the description to 150-160 characters',
          longDescription: 'Meta description is too long',
          reduceDescription: 'Shorten the description to 150-160 characters',
          missingKeywords: 'Missing meta keywords',
          addKeywords: 'Add meta keywords only if your workflow still uses them as supplemental metadata',
          missingH1: 'Missing <h1> tag',
          addH1: 'Add one main H1 heading to the page',
          badStatus: (status) => `Page returned HTTP ${status}`,
          reviewStatus: 'Check whether the page is reachable and returns a successful status code',
          nonHtmlContent: 'The response is not an HTML document',
          checkContentType: 'Verify that the URL points to a regular HTML page',
          missingCanonical: 'Missing canonical URL',
          addCanonical: 'Add a canonical URL to help search engines understand the preferred page version',
          noindexRobots: 'Robots tag contains noindex',
          reviewRobots: 'Review the robots directive if the page is meant to be indexed',
          manyH1: (count) => `Found ${count} <h1> tags`,
          oneH1: 'Use only one H1 on the page',
          missingH2: 'Missing <h2> tags',
          addH2: 'Add H2 subheadings to structure the content',
          imagesWithoutAlt: (count) => `${count} images without alt attributes`,
          addAlt: 'Add descriptive alt attributes to all images',
          missingOgTitle: 'Missing og:title',
          addOg: 'Add Open Graph tags for social sharing',
          missingOgDescription: 'Missing og:description',
          missingOgImage: 'Missing og:image',
          missingStructuredData: 'Missing structured data (JSON-LD)',
          addStructuredData: 'Add Schema.org markup to improve search appearance'
        }
      }
    : {
        seo: {
          title: 'SEO-аудит сайта онлайн — подробная проверка SEO страницы',
          description: 'Подробный SEO-аудит сайта онлайн: title, description, H1-H3, alt, robots, Open Graph, keywords и структура страницы. Подходит для технического анализа и быстрой проверки.',
          keywords: 'seo аудит сайта, seo аудит сайта онлайн, проверка seo сайта, аудит сайта онлайн, анализ страницы'
        },
        title: 'SEO-аудит сайта PRO',
        subtitle: 'Подробная проверка мета-тегов, заголовков и структуры любой страницы',
        urlLabel: 'URL сайта',
        emptyUrl: 'Введите URL для анализа',
        invalidUrl: 'Введите корректный URL сайта',
        genericError: 'Ошибка при анализе сайта',
        genericRetry: 'Ошибка при анализе сайта. Проверьте URL и попробуйте снова.',
        invalidApiResponse: 'Удалённый сервис SEO-аудита вернул неожиданный ответ.',
        fallbackNotice: 'Удалённый SEO-аудит временно недоступен, поэтому была использована ограниченная браузерная проверка страницы.',
        fallbackFailed: 'Удалённый SEO-аудит недоступен, а проверить страницу из браузера не удалось из-за ограничений CORS.',
        errorTitle: 'Ошибка:',
        analyze: 'Анализировать',
        analyzing: 'Анализируем страницу...',
        score: 'SEO Оценка',
        excellent: 'Отличная оптимизация',
        good: 'Хорошо, но есть что улучшить',
        poor: 'Требуется оптимизация',
        share: 'Поделиться результатом',
        shareSuccess: '✅ Ссылка скопирована в буфер обмена!\n\nОтправьте её другу, чтобы он увидел результаты анализа.',
        sharePrompt: 'Скопируйте эту ссылку:',
        issues: 'Найденные проблемы',
        suggestions: 'Рекомендации',
        details: 'Детали анализа',
        missing: 'Отсутствует',
        keywordsMissing: 'Отсутствуют',
        h1: 'H1 заголовков',
        h2: 'H2 заголовков',
        h3: 'H3 заголовков',
        images: 'Изображений',
        withoutAlt: 'без alt',
        finalUrl: 'Итоговый URL',
        status: 'HTTP статус',
        contentType: 'Тип контента',
        canonical: 'Canonical URL',
        robotsLabel: 'Robots',
        notAvailable: 'Нет данных',
        ogReady: 'Настроен',
        ogPartial: 'Не полностью',
        structuredYes: 'Есть',
        structuredNo: 'Нет',
        infoTitle: 'Что дает подробный SEO-аудит страницы',
        infoDescription: 'PRO-режим помогает проверить внешнюю страницу целиком и увидеть, как она подготовлена к индексации и сниппетам. Это удобно для аудита конкурентов, новых посадочных страниц, клиентских проектов и технической проверки перед публикацией.',
        checksTitle: 'Какие SEO-сигналы проверяются:',
        checks: [
          'Title и meta description — наличие, длина и базовая релевантность',
          'Meta keywords — дополнительный сигнал для Яндекса',
          'Структура заголовков H1, H2, H3 на странице',
          'Alt-атрибуты у изображений',
          'Open Graph для мессенджеров и соцсетей',
          'Структурированные данные (JSON-LD)',
          'Robots meta-тег и технические подсказки для индексации'
        ],
        benefitsTitle: 'Почему этот формат полезен:',
        benefits: [
          'Проверяет внешние сайты без ограничений браузера',
          'Показывает ключевые SEO-ошибки на одной странице',
          'Подходит для аудита конкурентов и новых посадочных страниц',
          'Дает понятные рекомендации по доработке',
          'Помогает быстро понять приоритет исправлений'
        ],
        ratingTitle: 'Как трактовать оценку:',
        rating: ['80-100 баллов - отличная SEO оптимизация', '60-79 баллов - хорошо, но есть что улучшить', '0-59 баллов - требуется серьезная оптимизация'],
        faqTitle: 'FAQ',
        faq: [
          { q: 'Как сделать SEO-аудит сайта онлайн?', a: 'Введите URL страницы, и сервис выполнит подробную проверку title, description, H1-H3, alt, Open Graph и других базовых SEO-сигналов.' },
          { q: 'Можно ли проверить чужой сайт?', a: 'Да, PRO-режим рассчитан на аудит внешних страниц и анализ конкурентов.' },
          { q: 'Для чего нужен такой аудит?', a: 'Он помогает быстро найти ошибки в мета-тегах, структуре заголовков и оформлении страницы перед SEO-доработкой.' },
          { q: 'Подходит ли инструмент для технического SEO-анализа?', a: 'Да, это удобный стартовый инструмент для технической проверки страницы и первичного SEO-скрининга.' }
        ],
        sharedPreview: (sharedUrl, sharedScore, sharedIssues) => `📊 Результат SEO анализа для ${sharedUrl}\n\nОценка: ${sharedScore}/100\nПроблем: ${sharedIssues}\n\nНажмите "Анализировать" для полного отчета`,
        analysis: {
          missingTitle: 'Отсутствует тег <title>',
          addTitle: 'Добавьте уникальный заголовок страницы (50-60 символов)',
          shortTitle: 'Тег <title> слишком короткий',
          extendTitle: 'Увеличьте длину заголовка до 50-60 символов',
          longTitle: 'Тег <title> слишком длинный',
          reduceTitle: 'Сократите заголовок до 50-60 символов',
          missingDescription: 'Отсутствует meta description',
          addDescription: 'Добавьте описание страницы (150-160 символов)',
          shortDescription: 'Meta description слишком короткое',
          extendDescription: 'Увеличьте описание до 150-160 символов',
          longDescription: 'Meta description слишком длинное',
          reduceDescription: 'Сократите описание до 150-160 символов',
          missingKeywords: 'Отсутствуют meta keywords',
          addKeywords: 'Добавьте ключевые слова (важно для Яндекса)',
          missingH1: 'Отсутствует тег <h1>',
          addH1: 'Добавьте один главный заголовок H1 на страницу',
          badStatus: (status) => `Страница вернула HTTP ${status}`,
          reviewStatus: 'Проверьте, что страница открывается и возвращает успешный код ответа',
          nonHtmlContent: 'Ответ не является HTML-страницей',
          checkContentType: 'Убедитесь, что URL ведёт на обычную HTML-страницу',
          missingCanonical: 'Отсутствует canonical URL',
          addCanonical: 'Добавьте canonical URL, чтобы указать поисковикам предпочтительную версию страницы',
          noindexRobots: 'В robots указан noindex',
          reviewRobots: 'Проверьте robots-директиву, если страница должна индексироваться',
          manyH1: (count) => `Найдено ${count} тегов <h1>`,
          oneH1: 'Используйте только один H1 на странице',
          missingH2: 'Отсутствуют теги <h2>',
          addH2: 'Добавьте подзаголовки H2 для структурирования контента',
          imagesWithoutAlt: (count) => `${count} изображений без атрибута alt`,
          addAlt: 'Добавьте описательные alt-атрибуты ко всем изображениям',
          missingOgTitle: 'Отсутствует og:title',
          addOg: 'Добавьте Open Graph теги для соцсетей',
          missingOgDescription: 'Отсутствует og:description',
          missingOgImage: 'Отсутствует og:image',
          missingStructuredData: 'Отсутствуют структурированные данные (JSON-LD)',
          addStructuredData: 'Добавьте Schema.org разметку для улучшения отображения в поиске'
        }
      }

  useEffect(() => {
    // Check if URL parameters exist (shared link)
    const params = new URLSearchParams(window.location.search)
    const sharedUrl = params.get('url')
    const sharedScore = params.get('score')
    const sharedIssues = params.get('issues')

    if (sharedUrl) {
      setUrl(sharedUrl)
      // Auto-analyze if shared link
      if (sharedScore && sharedIssues) {
        setError(copy.sharedPreview(sharedUrl, sharedScore, sharedIssues))
      }
    }
  }, [language])

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError(copy.emptyUrl)
      return
    }

    let normalizedUrl

    try {
      normalizedUrl = normalizeAuditUrl(url)
    } catch {
      setError(copy.invalidUrl)
      return
    }

    // Check cache first
    const cacheKey = `${language}:${normalizedUrl.toLowerCase()}`
    const cachedResult = seoAuditCache.get(cacheKey)

    if (cachedResult) {
      setError('')
      setNotice('')
      setResult(cachedResult)
      return
    }

    setLoading(true)
    setError('')
    setNotice('')
    setResult(null)

    const outcome = await runRequest(async ({ isCurrent, signal }) => {
      try {
        const data = await requestWorkerAudit(normalizedUrl, signal)
        if (!isCurrent()) return null
        return { type: 'worker', analysis: createWorkerAnalysis(data, language) }
      } catch (err) {
        if (signal.aborted || !isCurrent()) {
          throw err
        }

        if (!(err.code === 'HTML_RESPONSE' || err.code === 'INVALID_JSON' || err.code === 'WORKER_ERROR' || err.name === 'TypeError')) {
          throw err
        }

        const fallbackResult = await analyzeSEO(normalizedUrl, language)
        if (!isCurrent()) return null
        if (fallbackResult?.error) {
          const fallbackError = new Error(copy.fallbackFailed)
          fallbackError.code = 'FALLBACK_FAILED'
          throw fallbackError
        }

        if (!fallbackResult) {
          const invalidResponseError = new Error(copy.invalidApiResponse)
          invalidResponseError.code = 'INVALID_FALLBACK'
          throw invalidResponseError
        }

        if (!isCurrent()) return null
        return { type: 'fallback', analysis: createFallbackAnalysis(fallbackResult, normalizedUrl, language) }
      }
    })

    if (outcome.status === 'success' && outcome.result?.analysis) {
      seoAuditCache.set(cacheKey, outcome.result.analysis)
      setResult(outcome.result.analysis)
      setNotice(outcome.result.type === 'fallback' ? copy.fallbackNotice : '')
    } else if (outcome.status === 'error') {
      setError(outcome.error?.message || copy.genericRetry)
    }

    setLoading(false)
  }

  const handleShare = () => {
    if (!result) return

    // Create shareable URL with encoded parameters
    const shareUrl = `${window.location.origin}/${language}/seo-audit-pro?url=${encodeURIComponent(url)}&score=${result.score}&issues=${result.issues.length}`

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(copy.shareSuccess)
       }).catch(() => {
         prompt(copy.sharePrompt, shareUrl)
       })
     } else {
       prompt(copy.sharePrompt, shareUrl)
      }
  }

  const isFallbackResult = result?.data?.source === 'browser'
  const visibleCategories = useMemo(() => {
    if (!result) return []

    return result.categories
      .map((category) => ({
        ...category,
        visibleChecks: category.checks.filter((check) => matchesCheckFilter(check, checkFilter)),
      }))
      .filter((category) => category.visibleChecks.length > 0)
  }, [result, checkFilter])

  const visibleCheckCount = visibleCategories.reduce((sum, category) => sum + category.visibleChecks.length, 0)

  const filterOptions = [
    { key: 'all', label: auditUi.filterAll },
    { key: 'errors', label: auditUi.filterErrors },
    { key: 'warnings', label: auditUi.filterWarnings },
    { key: 'passed', label: auditUi.filterPassed },
    { key: 'na', label: auditUi.filterUnavailable },
  ]

  const renderSignal = (value, { missing = copy.missing, unknown = copy.notAvailable } = {}) => {
    if (value === undefined) return unknown
    if (value === null) return missing
    if (typeof value === 'string') return value.length ? value : missing
    if (typeof value === 'number') return Number.isFinite(value) ? String(value) : unknown
    if (typeof value === 'boolean') return value ? (language === 'en' ? 'Yes' : 'Да') : (language === 'en' ? 'No' : 'Нет')
    return unknown
  }

  const copyToClipboard = (value) => {
    const text = typeof value === 'string' ? value : ''
    if (!text) return
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        prompt(copy.sharePrompt, text)
      })
      return
    }
    prompt(copy.sharePrompt, text)
  }

  return (
    <>
      <SEO
        title={copy.seo.title}
        description={copy.seo.description}
        path={`/${language}/seo-audit-pro`}
        keywords={copy.seo.keywords}
      />

      <ToolPageShell>
        <ToolPageHero title={copy.title} subtitle={copy.subtitle} />

        <ToolControls>
        <div className="field">
          <label htmlFor="url">{copy.urlLabel}</label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="https://example.com"
            autoComplete="off"
          />
        </div>

        {error && (
          <ResultNotice tone="error" title={`⚠️ ${copy.errorTitle}`} className="status-panel--error" style={{ marginBottom: '1rem' }}>
            <p>{error}</p>
          </ResultNotice>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="seo-audit-pro-submit"
        >
          {loading ? (
            <span className="button-spinner">
              <InlineSpinner label={copy.analyzing} />
            </span>
          ) : copy.analyze}
        </button>

        {result && (
          <>
            <ResultSection tone={getScoreTone(result.score)} className="seo-audit-pro-report">
              <div className="seo-audit-pro-overview">
                <div className="surface-panel seo-audit-pro-overview-card seo-audit-pro-score-card">
                  <ResultSummary
                    kicker={copy.score}
                    title={
                      result.score >= 80 ? copy.excellent :
                      result.score >= 60 ? copy.good :
                      copy.poor
                    }
                    score={result.score}
                    scoreColor={getScoreColor(result.score)}
                    description={auditUi.scoreSummary(result.score)}
                    centered
                  />
                  <div className="seo-audit-pro-pill-row">
                    <span className="seo-audit-pro-pill">{auditUi.coverage}: {result.summary.coveragePercent}%</span>
                    <span className="seo-audit-pro-pill">{auditUi.checkedChecks}: {auditUi.checksCount(result.summary.checkedCount, result.summary.totalChecks)}</span>
                    <span className="seo-audit-pro-pill">{isFallbackResult ? auditUi.sourceFallback : auditUi.sourceWorker}</span>
                  </div>
                </div>

                <div className="surface-panel seo-audit-pro-overview-card seo-audit-pro-priority-card">
                  <h3>{auditUi.topPriorities}</h3>
                  {result.highlights.topFixes.length > 0 ? (
                    <div className="seo-audit-pro-priority-list">
                      {result.highlights.topFixes.map((check) => (
                        <div key={check.id} className="seo-audit-pro-priority-item">
                          <span className={`seo-audit-pro-status seo-audit-pro-status--${check.status}`}>{auditUi.status[check.status]}</span>
                          <div className="seo-audit-pro-priority-copy">
                            <strong>{check.label}</strong>
                            <p>{check.summary}</p>
                            <div className="seo-audit-pro-priority-meta">
                              <span><strong>{auditUi.currentValue}:</strong> {check.value}</span>
                              <span><strong>{auditUi.benchmark}:</strong> {check.benchmark || '—'}</span>
                            </div>
                          </div>
                          <div className="seo-audit-pro-priority-points">
                            <span className="seo-audit-pro-points">{auditUi.scoreOutOf(check.scoreEarned ?? 0, check.weight)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="seo-audit-pro-success-copy">
                      <strong>{auditUi.allGoodTitle}</strong>
                      <p>{auditUi.allGoodText}</p>
                      <div className="seo-audit-pro-success-list">
                        {result.highlights.passedHighlights.map((check) => (
                          <span key={check.id} className="seo-audit-pro-success-item">✔ {check.label}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="seo-audit-pro-block-heading">
                <h3>{auditUi.categoryScores}</h3>
                <p>{auditUi.checksCount(result.summary.checkedCount, result.summary.totalChecks)}</p>
              </div>

              <div className="seo-audit-pro-category-grid">
                {result.categories.map((category) => (
                  <article key={category.id} className={`seo-audit-pro-category-card seo-audit-pro-category-card--${category.status}`}>
                    <div className="seo-audit-pro-category-card__top">
                      <span className="seo-audit-pro-category-card__title">{category.label}</span>
                      <span className={`seo-audit-pro-status seo-audit-pro-status--${category.status}`}>{auditUi.status[category.status]}</span>
                    </div>
                    <div className="seo-audit-pro-category-card__score">
                      {category.score !== null ? `${category.score}/${category.maxScore}` : '—'}
                    </div>
                    <div className="seo-audit-pro-progress">
                      <span style={{ width: `${category.percent}%` }} />
                    </div>
                    <div className="seo-audit-pro-category-card__meta">
                      <span>{auditUi.checksCount(category.checks.length - category.counts.na, category.checks.length)}</span>
                      <span>{auditUi.scoreOutOf(category.earned, category.available || 0)}</span>
                    </div>
                  </article>
                ))}
              </div>

              <div className="seo-audit-pro-report__footer">
                <ResultActions align="center">
                  <button onClick={handleShare} className="seo-share-button">📤 {copy.share}</button>
                </ResultActions>

                {notice && (
                  <ResultNotice tone="warning" className="seo-audit-pro-notice-panel">
                    <p>{notice}</p>
                  </ResultNotice>
                )}
              </div>
            </ResultSection>

            <ResultSection className="seo-audit-pro-filters-panel">
              <div className="seo-audit-pro-filters-head">
                <strong>{auditUi.scoreBreakdown}</strong>
                <span>{auditUi.checksCount(visibleCheckCount, result.checks.length)}</span>
              </div>
              <div className="seo-audit-pro-filter-group">
                <span className="seo-audit-pro-filter-group__label">{auditUi.filtersTitle}</span>
                <div className="seo-audit-pro-filter-row">
                {filterOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`secondary seo-audit-pro-filter ${checkFilter === option.key ? 'is-active' : ''}`.trim()}
                    onClick={() => setCheckFilter(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
                </div>
              </div>
            </ResultSection>

            {visibleCategories.map((category) => (
              <ResultDetails key={category.id} title={category.label} className="seo-audit-pro-section">
                <div className="surface-panel surface-panel--subtle seo-audit-pro-category-panel">
                  <div className="seo-audit-pro-category-panel__header">
                    <div className="seo-audit-pro-category-panel__summary">
                      <p>{auditUi.checksCount(category.checks.length - category.counts.na, category.checks.length)}</p>
                      <div className="seo-audit-pro-category-panel__chips">
                        {category.counts.fail > 0 ? <span className="seo-audit-pro-chip seo-audit-pro-chip--fail">{auditUi.status.fail}: {category.counts.fail}</span> : null}
                        {category.counts.warning > 0 ? <span className="seo-audit-pro-chip seo-audit-pro-chip--warning">{auditUi.status.warning}: {category.counts.warning}</span> : null}
                        {category.counts.pass > 0 ? <span className="seo-audit-pro-chip seo-audit-pro-chip--pass">{auditUi.status.pass}: {category.counts.pass}</span> : null}
                        {category.counts.na > 0 ? <span className="seo-audit-pro-chip seo-audit-pro-chip--na">{auditUi.status.na}: {category.counts.na}</span> : null}
                      </div>
                    </div>
                    <div className="seo-audit-pro-category-panel__score">
                      <span>{category.score !== null ? `${category.score}/${category.maxScore}` : '—'}</span>
                      <span className={`seo-audit-pro-status seo-audit-pro-status--${category.status}`}>{auditUi.status[category.status]}</span>
                    </div>
                  </div>

                  <div className="seo-audit-pro-check-list">
                    {category.visibleChecks.map((check) => (
                      <article key={check.id} className={`seo-audit-pro-check seo-audit-pro-check--${check.status}`}>
                        <div className="seo-audit-pro-check__top">
                          <div className="seo-audit-pro-check__heading">
                            <span className={`seo-audit-pro-status seo-audit-pro-status--${check.status}`}>{auditUi.status[check.status]}</span>
                            <strong>{check.label}</strong>
                          </div>
                          <div className="seo-audit-pro-check__meta">
                            <span className="seo-audit-pro-check__value">{check.value}</span>
                            <span className="seo-audit-pro-points">{check.status === 'na' ? '—' : auditUi.scoreOutOf(check.scoreEarned ?? 0, check.weight)}</span>
                          </div>
                        </div>

                        <p className="seo-audit-pro-check__summary">{check.summary}</p>

                        <div className="seo-audit-pro-check__details">
                          <div className="seo-audit-pro-check__detail-card">
                            <span className="seo-audit-pro-check__label">{auditUi.whyItMatters}</span>
                            <p>{check.whyItMatters}</p>
                          </div>
                          <div className="seo-audit-pro-check__detail-card">
                            <span className="seo-audit-pro-check__label">{auditUi.benchmark}</span>
                            <p>{check.benchmark || '—'}</p>
                          </div>
                          <div className="seo-audit-pro-check__detail-card">
                            <span className="seo-audit-pro-check__label">{auditUi.recommendation}</span>
                            <p>{check.recommendation || auditUi.noRecommendation}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </ResultDetails>
            ))}

            {!visibleCategories.length && (
              <ResultNotice tone="info" className="seo-audit-pro-empty-filter">
                <p>{language === 'en' ? 'No checks match the selected filter.' : 'Для выбранного фильтра нет подходящих проверок.'}</p>
              </ResultNotice>
            )}

            <ResultDetails title={auditUi.rawSignals} className="seo-audit-pro-section">
              <div className="surface-panel surface-panel--subtle seo-audit-pro-raw-panel">
                <p className="seo-audit-pro-raw-hint">{auditUi.rawHint}</p>
                <div className="meta-grid seo-audit-pro-raw-grid">
                  <div className="meta-item">
                    <strong>Title</strong>
                    <div className="meta-item-value">{renderSignal(result.data.title)}</div>
                  </div>
                  <div className="meta-item">
                    <strong>Description</strong>
                    <div className="meta-item-value">{renderSignal(result.data.description)}</div>
                  </div>
                  <div className="meta-item">
                    <strong>{copy.finalUrl}</strong>
                    <div className="meta-item-value seo-audit-pro-raw-copy-row">
                      <span>{renderSignal(result.data.finalUrl, { missing: copy.missing, unknown: copy.notAvailable })}</span>
                      {typeof result.data.finalUrl === 'string' && result.data.finalUrl.length > 0 ? (
                        <button type="button" className="seo-audit-pro-raw-copy" onClick={() => copyToClipboard(result.data.finalUrl)}>
                          {language === 'en' ? 'Copy' : 'Копировать'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="meta-item">
                    <strong>{copy.status}</strong>
                    <div className="meta-item-value">{renderSignal(result.data.status, { missing: copy.notAvailable, unknown: copy.notAvailable })}</div>
                  </div>
                  <div className="meta-item">
                    <strong>{copy.contentType}</strong>
                    <div className="meta-item-value">{renderSignal(result.data.contentType, { missing: copy.missing, unknown: copy.notAvailable })}</div>
                  </div>
                  <div className="meta-item">
                    <strong>{copy.canonical}</strong>
                    <div className="meta-item-value seo-audit-pro-raw-copy-row">
                      <span>{renderSignal(result.data.canonical, { missing: copy.missing, unknown: copy.notAvailable })}</span>
                      {typeof result.data.canonical === 'string' && result.data.canonical.length > 0 ? (
                        <button type="button" className="seo-audit-pro-raw-copy" onClick={() => copyToClipboard(result.data.canonical)}>
                          {language === 'en' ? 'Copy' : 'Копировать'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="meta-item">
                    <strong>{copy.robotsLabel}</strong>
                    <div className="meta-item-value">{renderSignal(result.data.robots, { missing: copy.missing, unknown: copy.notAvailable })}</div>
                  </div>
                  <div className="meta-item">
                    <strong>{copy.h1}</strong>
                    <div className="meta-item-value">{result.data.h1Text ? renderSignal(result.data.h1Text) : renderSignal(result.data.h1Count)}</div>
                  </div>
                  {typeof result.data.h2Count === 'number' && (
                    <div className="meta-item">
                      <strong>{copy.h2}</strong>
                      <div className="meta-item-value">{result.data.h2Count}</div>
                    </div>
                  )}
                  {typeof result.data.h3Count === 'number' && (
                    <div className="meta-item">
                      <strong>{copy.h3}</strong>
                      <div className="meta-item-value">{result.data.h3Count}</div>
                    </div>
                  )}
                  {typeof result.data.imagesTotal === 'number' && typeof result.data.imagesWithoutAlt === 'number' && (
                    <div className="meta-item">
                      <strong>{copy.images}</strong>
                      <div className="meta-item-value">{result.data.imagesTotal} ({copy.withoutAlt}: {result.data.imagesWithoutAlt})</div>
                    </div>
                  )}
                  {typeof result.data.internalLinks === 'number' && (
                    <div className="meta-item">
                      <strong>{language === 'en' ? 'Internal links' : 'Внутренние ссылки'}</strong>
                      <div className="meta-item-value">{result.data.internalLinks}</div>
                    </div>
                  )}
                  {typeof result.data.externalLinks === 'number' && (
                    <div className="meta-item">
                      <strong>{language === 'en' ? 'External links' : 'Внешние ссылки'}</strong>
                      <div className="meta-item-value">{result.data.externalLinks}</div>
                    </div>
                  )}
                  {typeof result.data.wordCount === 'number' && (
                    <div className="meta-item">
                      <strong>{language === 'en' ? 'Word count' : 'Количество слов'}</strong>
                      <div className="meta-item-value">{result.data.wordCount}</div>
                    </div>
                  )}
                  {result.data.openGraph !== undefined && (
                    <div className="meta-item">
                      <strong>Open Graph</strong>
                      <div className="meta-item-value">
                        {result.data.openGraph
                          ? `${['title', 'description', 'image'].filter((key) => result.data.openGraph?.[key]).length}/3`
                          : copy.missing}
                      </div>
                    </div>
                  )}
                  {result.data.twitter !== undefined && (
                    <div className="meta-item">
                      <strong>Twitter</strong>
                      <div className="meta-item-value">
                        {result.data.twitter
                          ? `${['card', 'title', 'description', 'image'].filter((key) => result.data.twitter?.[key]).length}/4`
                          : copy.missing}
                      </div>
                    </div>
                  )}
                  {result.data.hasStructuredData !== undefined && (
                    <div className="meta-item">
                      <strong>{language === 'en' ? 'Structured data' : 'Структурированные данные'}</strong>
                      <div className="meta-item-value">
                        {result.data.hasStructuredData === true
                          ? copy.structuredYes
                          : result.data.hasStructuredData === false
                            ? copy.structuredNo
                            : copy.notAvailable}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ResultDetails>
          </>
        )}

        </ToolControls>

        <ToolHelp>
        <ToolDescriptionSection>
          <div className="tool-help-prose">
          <h2 className="tool-help-heading">{copy.infoTitle}</h2>
          <p>
            {copy.infoDescription}
          </p>

          <h3 className="tool-help-subheading">{copy.checksTitle}</h3>
          <ul>
            {copy.checks.map((item) => <li key={item}>{item}</li>)}
          </ul>

          <h3 className="tool-help-subheading">{copy.benefitsTitle}</h3>
          <ul>
            {copy.benefits.map((item) => <li key={item}>✅ {item}</li>)}
          </ul>

          <h3 className="tool-help-subheading">{copy.ratingTitle}</h3>
          <ul>
            {copy.rating.map((item) => <li key={item}>{item}</li>)}
          </ul>

          <ToolFaq title={copy.faqTitle} items={copy.faq || []} />
          </div>
        </ToolDescriptionSection>

        </ToolHelp>

        <ToolRelated>
          <RelatedTools currentPath={`/${language}/seo-audit-pro`} />
        </ToolRelated>
      </ToolPageShell>
    </>
  )
}

export default SEOAuditPro
