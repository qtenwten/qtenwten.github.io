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
import ToolPageShell, { ToolControls, ToolHelp, ToolPageHero, ToolPageLayout, ToolRelated, ToolResult } from '../components/ToolPageShell'
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
    badgeWorker: 'Remote audit',
    badgeFallback: 'Limited check',
    coverage: 'Coverage',
    checkedChecks: 'Verified',
    categoryScores: 'Category overview',
    scoreBreakdown: 'Scoring breakdown',
    topPriorities: 'Priority fixes',
    allGoodTitle: 'No active issues found',
    allGoodText: 'All verified checks passed. The breakdown below shows the full score picture.',
    filtersTitle: 'Show checks',
    filterAll: 'All',
    filterErrors: 'Errors',
    filterWarnings: 'Warnings',
    filterPassed: 'Passed',
    filterUnavailable: 'Not checked',
    whyItMatters: 'Why it matters',
    recommendation: 'How to improve',
    benchmark: 'Target',
    currentValue: 'Current',
    rawSignals: 'Raw audit data',
    rawHint: 'Technical snapshot returned by the audit source.',
    noRecommendation: 'No action needed.',
    notChecked: 'Signal unavailable in the current audit mode.',
    impact: 'Score impact',
    scoreOutOf: (earned, max) => `${earned}/${max}`,
    checksCount: (checked, total) => `${checked}/${total}`,
    scoreSummary: (score) => score >= 90
      ? 'Strong on-page signals across all verified checks.'
      : score >= 70
        ? 'Most signals look good. A few targeted improvements available.'
        : 'Several signals need work before the page looks fully optimized.',
    status: {
      pass: 'Pass',
      warning: 'Warn',
      fail: 'Error',
      na: 'N/A',
    },
    categories: {
      technical: 'Technical',
      metadata: 'Metadata',
      content: 'Content',
      enhancements: 'Enhancements',
      accessibility: 'Media',
    },
    labels: {
      httpStatus: 'HTTP status',
      htmlContent: 'HTML response',
      httpsUrl: 'HTTPS final URL',
      robots: 'Robots directives',
      titlePresence: 'Title tag',
      titleLength: 'Title length',
      descriptionPresence: 'Meta description',
      descriptionLength: 'Description length',
      canonical: 'Canonical URL',
      h1Presence: 'Primary H1',
      h1Length: 'H1 length',
      h2Coverage: 'H2 headings',
      openGraph: 'Open Graph',
      twitter: 'Twitter cards',
      structuredData: 'Structured data',
      altCoverage: 'Image alt',
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
    fallbackNoticeBody: 'The remote audit endpoint is temporarily unavailable. This is a limited browser-based check — some signals could not be evaluated. Try again in a moment.',
    workerIcon: 'worker',
  },
  ru: {
    badgeWorker: 'Удалённый аудит',
    badgeFallback: 'Ограниченная проверка',
    coverage: 'Покрытие',
    checkedChecks: 'Проверено',
    categoryScores: 'Обзор по категориям',
    scoreBreakdown: 'Детализация оценки',
    topPriorities: 'Приоритетные исправления',
    allGoodTitle: 'Все проверенные сигналы в порядке',
    allGoodText: 'Активных проблем не найдено. Ниже — полная картина оценки.',
    filtersTitle: 'Показать проверки',
    filterAll: 'Все',
    filterErrors: 'Ошибки',
    filterWarnings: 'Предупреждения',
    filterPassed: 'ОК',
    filterUnavailable: 'Не проверено',
    whyItMatters: 'Почему это важно',
    recommendation: 'Что улучшить',
    benchmark: 'Ориентир',
    currentValue: 'Текущее',
    rawSignals: 'Сырые данные аудита',
    rawHint: 'Технический снимок, возвращённый источником аудита.',
    noRecommendation: 'Доработка не требуется.',
    notChecked: 'Этот сигнал недоступен в текущем режиме аудита.',
    impact: 'Влияние на оценку',
    scoreOutOf: (earned, max) => `${earned}/${max}`,
    checksCount: (checked, total) => `${checked}/${total}`,
    scoreSummary: (score) => score >= 90
      ? 'Сильные on-page сигналы по всем проверенным проверкам.'
      : score >= 70
        ? 'Основные сигналы в порядке. Доступны точечные улучшения.'
        : 'Есть несколько проблем, которые заметно тянут оценку вниз.',
    status: {
      pass: 'ОК',
      warning: 'Вним.',
      fail: 'Ошибка',
      na: 'Н/Д',
    },
    categories: {
      technical: 'Техническое',
      metadata: 'Метаданные',
      content: 'Контент',
      enhancements: 'Расширения',
      accessibility: 'Медиа',
    },
    labels: {
      httpStatus: 'HTTP-статус',
      htmlContent: 'HTML-страница',
      httpsUrl: 'Итоговый URL (HTTPS)',
      robots: 'Robots-директивы',
      titlePresence: 'Тег title',
      titleLength: 'Длина title',
      descriptionPresence: 'Meta description',
      descriptionLength: 'Длина description',
      canonical: 'Canonical URL',
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
    fallbackNoticeBody: 'Удалённый эндпоинт SEO-аудита временно недоступен. Это ограниченная браузерная проверка — часть сигналов не могла быть оценена. Попробуйте ещё раз через некоторое время.',
    workerIcon: 'worker',
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

function WorkerIcon() {
  return (
    <svg className="seo-audit-pro-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

function FallbackIcon() {
  return (
    <svg className="seo-audit-pro-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

function ChevronIcon({ className }) {
  return (
    <svg className={`seo-audit-pro-raw-toggle-icon ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

function SEOAuditPro() {
  const { t, language } = useLanguage()
  const { runRequest } = useAsyncRequest()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [checkFilter, setCheckFilter] = useState('all')
  const [rawOpen, setRawOpen] = useState(false)
  const auditUi = AUDIT_UI_COPY[language] || AUDIT_UI_COPY.ru

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sharedUrl = params.get('url')
    const sharedScore = params.get('score')
    const sharedIssues = params.get('issues')

    if (sharedUrl) {
      setUrl(sharedUrl)
      if (sharedScore && sharedIssues) {
        setError(`${t('seoAuditPro.sharedPreview')}\n\n${t('seoAuditPro.score')}: ${sharedScore}/100\n${t('seoAuditPro.issues')}: ${sharedIssues}\n\n${language === 'en' ? 'Click "Analyze" to load the full report.' : 'Нажмите "Анализировать" для полного отчета'}`)
      }
    }
  }, [language])

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError(t('seoAuditPro.emptyUrl'))
      return
    }

    let normalizedUrl

    try {
      normalizedUrl = normalizeAuditUrl(url)
    } catch {
      setError(t('seoAuditPro.invalidUrl'))
      return
    }

    const cacheKey = `${language}:${normalizedUrl.toLowerCase()}`
    const cachedResult = seoAuditCache.get(cacheKey)

    if (cachedResult) {
      setError('')
      setResult(cachedResult)
      return
    }

    setLoading(true)
    setError('')
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

        const isNetworkFailure =
          err.code === 'HTML_RESPONSE' ||
          err.code === 'INVALID_JSON' ||
          err.name === 'TypeError'

        if (!isNetworkFailure) {
          const userMessage = err.message || t('seoAuditPro.genericRetry')
          const surfacedError = new Error(userMessage)
          surfacedError.code = 'WORKER_ERROR'
          throw surfacedError
        }

        const fallbackResult = await analyzeSEO(normalizedUrl, language)
        if (!isCurrent()) return null
        if (fallbackResult?.error) {
          const fallbackError = new Error(t('seoAuditPro.fallbackFailed'))
          fallbackError.code = 'FALLBACK_FAILED'
          throw fallbackError
        }

        if (!fallbackResult) {
          const invalidResponseError = new Error(t('seoAuditPro.invalidApiResponse'))
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
    } else if (outcome.status === 'error') {
      setError(outcome.error?.message || t('seoAuditPro.genericRetry'))
    }

    setLoading(false)
  }

  const handleShare = () => {
    if (!result) return
    const shareUrl = `${window.location.origin}/${language}/seo-audit-pro?url=${encodeURIComponent(url)}&score=${result.score}&issues=${result.issues.length}`

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(t('seoAuditPro.shareSuccess'))
       }).catch(() => {
         prompt(t('seoAuditPro.sharePrompt'), shareUrl)
       })
     } else {
       prompt(t('seoAuditPro.sharePrompt'), shareUrl)
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

  const renderSignal = (value, { missing = t('seoAuditPro.missing'), unknown = t('seoAuditPro.notAvailable') } = {}) => {
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
        prompt(t('seoAuditPro.sharePrompt'), text)
      })
      return
    }
    prompt(t('seoAuditPro.sharePrompt'), text)
  }

  return (
    <>
      <SEO
        title={t('seo.seoAuditPro.title')}
        description={t('seo.seoAuditPro.description')}
        path={`/${language}/seo-audit-pro`}
        keywords={t('seo.seoAuditPro.keywords')}
      />

      <ToolPageShell className="seo-audit-pro-page">
        <ToolPageHero title={t('seoAuditPro.title')} subtitle={t('seoAuditPro.subtitle')} />

        {/* === FORM — only in ToolControls === */}
        <ToolControls className="seo-audit-pro-form-shell">
          <div className="field">
            <label htmlFor="url">{t('seoAuditPro.urlLabel')}</label>
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="https://example.com"
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="seo-audit-pro-error">
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="seo-audit-pro-submit"
          >
            {loading ? (
              <span className="button-spinner">
                <InlineSpinner label={t('seoAuditPro.analyzing')} />
              </span>
            ) : t('seoAuditPro.analyze') }
          </button>
        </ToolControls>

        {/* === REPORT === */}
        {result && (
          <ToolPageLayout className="seo-audit-pro-workspace">

            {/* Fallback notice */}
            {isFallbackResult && (
              <ToolResult className="seo-audit-pro-notice">
                <div className="seo-audit-pro-source-notice">
                  <FallbackIcon />
                  <div className="seo-audit-pro-source-notice-text">
                    <strong>{auditUi.badgeFallback}</strong>
                    <span>{auditUi.fallbackNoticeBody}</span>
                  </div>
                </div>
              </ToolResult>
            )}

            {/* ===== EXECUTIVE ROW: Score + Badges + Priorities ===== */}
            <div className="seo-audit-pro-dashboard-row">

              {/* LEFT: Score hero — dominant visual anchor */}
              <div className="seo-audit-pro-score-panel">
                <div className="seo-audit-pro-score-hero">
                  <div className="seo-audit-pro-score-top">
                    <div className="seo-audit-pro-score-kicker">
                      <span>{t('seo.seoAuditPro.title')}</span>
                    </div>
                    <div className="seo-audit-pro-score-number" style={{ color: getScoreColor(result.score) }}>
                      {result.score}
                    </div>
                    <div className="seo-audit-pro-score-label">
                      {result.score >= 80 ? t('seoAuditPro.excellent') :
                       result.score >= 60 ? t('seoAuditPro.good') :
                       t('seoAuditPro.poor')}
                    </div>
                    <p className="seo-audit-pro-score-description">{auditUi.scoreSummary(result.score)}</p>
                  </div>

                  <div className="seo-audit-pro-badges">
                    <span className={`seo-audit-pro-badge ${isFallbackResult ? 'seo-audit-pro-badge--fallback' : 'seo-audit-pro-badge--worker'}`}>
                      {isFallbackResult ? <FallbackIcon /> : <WorkerIcon />}
                      {isFallbackResult ? auditUi.badgeFallback : auditUi.badgeWorker}
                    </span>
                    <span className="seo-audit-pro-badge">
                      {auditUi.coverage}: {result.summary.coveragePercent}%
                    </span>
                    <span className="seo-audit-pro-badge">
                      {auditUi.checkedChecks}: {auditUi.checksCount(result.summary.checkedCount, result.summary.totalChecks)}
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT: Priority action list */}
              <div className="seo-audit-pro-priorities-panel">
                <div className="seo-audit-pro-priorities-block">
                  <h3 className="seo-audit-pro-section-title">{auditUi.topPriorities}</h3>
                  {result.highlights.topFixes.length > 0 ? (
                    <div className="seo-audit-pro-priority-list">
                      {result.highlights.topFixes.map((check) => (
                        <div key={check.id} className={`seo-audit-pro-priority-item seo-audit-pro-priority-item--${check.status}`}>
                          <div className="seo-audit-pro-priority-item__left">
                            <span className={`seo-audit-pro-status seo-audit-pro-status--${check.status}`}>{auditUi.status[check.status]}</span>
                            <div className="seo-audit-pro-priority-item__content">
                              <strong className="seo-audit-pro-priority-item__label">{check.label}</strong>
                              <p className="seo-audit-pro-priority-item__summary">{check.summary}</p>
                              <div className="seo-audit-pro-priority-item__bench">
                                <span className="seo-audit-pro-priority-item__current">
                                  <strong>{auditUi.currentValue}:</strong> {check.value}
                                </span>
                                <span className="seo-audit-pro-priority-item__target">
                                  <strong>{auditUi.benchmark}:</strong> {check.benchmark || '—'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="seo-audit-pro-priority-item__right">
                            <span className="seo-audit-pro-points">{auditUi.scoreOutOf(check.scoreEarned ?? 0, check.weight)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="seo-audit-pro-success-state">
                      <strong>{auditUi.allGoodTitle}</strong>
                      <p>{auditUi.allGoodText}</p>
                      <div className="seo-audit-pro-success-list">
                        {result.highlights.passedHighlights.map((check) => (
                          <span key={check.id} className="seo-audit-pro-success-item">&#10003; {check.label}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ===== CATEGORY OVERVIEW ===== */}
            <div className="seo-audit-pro-section-block">
              <div className="seo-audit-pro-section-header">
                <h3 className="seo-audit-pro-section-title">{auditUi.categoryScores}</h3>
                <span className="seo-audit-pro-section-meta">{auditUi.checksCount(result.summary.checkedCount, result.summary.totalChecks)}</span>
              </div>
              <div className="seo-audit-pro-category-overview">
                {result.categories.map((category) => (
                  <article key={category.id} className={`seo-audit-pro-category-card seo-audit-pro-category-card--${category.status}`}>
                    <div className="seo-audit-pro-category-card__header">
                      <span className="seo-audit-pro-category-card__name">{category.label}</span>
                      <span className={`seo-audit-pro-status seo-audit-pro-status--${category.status}`}>{auditUi.status[category.status]}</span>
                    </div>
                    <div className="seo-audit-pro-category-card__score">
                      {category.score !== null ? `${category.score}` : '—'}
                    </div>
                    <div className="seo-audit-pro-category-card__bar">
                      <div className="seo-audit-pro-category-card__bar-fill" style={{ width: `${category.percent}%` }} />
                    </div>
                    <div className="seo-audit-pro-category-card__footer">
                      <div className="seo-audit-pro-category-card__chips">
                        {category.counts.fail > 0 ? <span className="seo-audit-pro-chip seo-audit-pro-chip--fail">{category.counts.fail} fail</span> : null}
                        {category.counts.warning > 0 ? <span className="seo-audit-pro-chip seo-audit-pro-chip--warning">{category.counts.warning} warn</span> : null}
                        {category.counts.pass > 0 ? <span className="seo-audit-pro-chip seo-audit-pro-chip--pass">{category.counts.pass} pass</span> : null}
                      </div>
                      <span className="seo-audit-pro-category-card__weight">{auditUi.scoreOutOf(category.earned, category.available || 0)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* ===== FILTERS ===== */}
            <div className="seo-audit-pro-section-block">
              <div className="seo-audit-pro-filters-bar">
                <strong className="seo-audit-pro-filters-label">{auditUi.scoreBreakdown}</strong>
                <span className="seo-audit-pro-filters-count">{auditUi.checksCount(visibleCheckCount, result.checks.length)}</span>
                <div className="seo-audit-pro-filter-row">
                  {filterOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={`seo-audit-pro-filter ${checkFilter === option.key ? 'is-active' : ''}`.trim()}
                      onClick={() => setCheckFilter(option.key)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ===== CHECK DETAILS ===== */}
            {visibleCategories.map((category) => (
              <ResultDetails key={category.id} title={category.label} className="seo-audit-pro-section">
                <div className="seo-audit-pro-check-list">
                  {category.visibleChecks.map((check) => (
                    <article key={check.id} className={`seo-audit-pro-check seo-audit-pro-check--${check.status}`}>
                      <div className="seo-audit-pro-check__row">
                        <div className="seo-audit-pro-check__name">
                          <span className={`seo-audit-pro-status seo-audit-pro-status--${check.status}`}>{auditUi.status[check.status]}</span>
                          <strong>{check.label}</strong>
                        </div>
                        <div className="seo-audit-pro-check__value-block">
                          <span className="seo-audit-pro-check__value">{check.value}</span>
                          <span className="seo-audit-pro-points">{check.status === 'na' ? '—' : auditUi.scoreOutOf(check.scoreEarned ?? 0, check.weight)}</span>
                        </div>
                      </div>
                      <p className="seo-audit-pro-check__summary">{check.summary}</p>
                      <div className="seo-audit-pro-check__details">
                        <div className="seo-audit-pro-check__detail">
                          <span className="seo-audit-pro-check__detail-label">{auditUi.whyItMatters}</span>
                          <p>{check.whyItMatters}</p>
                        </div>
                        <div className="seo-audit-pro-check__detail seo-audit-pro-check__detail--center">
                          <span className="seo-audit-pro-check__detail-label">{auditUi.benchmark}</span>
                          <p>{check.benchmark || '—'}</p>
                        </div>
                        <div className="seo-audit-pro-check__detail">
                          <span className="seo-audit-pro-check__detail-label">{auditUi.recommendation}</span>
                          <p>{check.recommendation || auditUi.noRecommendation}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </ResultDetails>
            ))}

            {!visibleCategories.length && (
              <div className="seo-audit-pro-empty-state">
                <p>{language === 'en' ? 'No checks match the selected filter.' : 'Для выбранного фильтра нет подходящих проверок.'}</p>
              </div>
            )}

            {/* ===== RAW DATA ===== */}
            <div className="seo-audit-pro-raw-wrapper">
              <button
                type="button"
                className="seo-audit-pro-raw-toggle"
                onClick={() => setRawOpen((o) => !o)}
                aria-expanded={rawOpen}
              >
                <ChevronIcon className={rawOpen ? 'seo-audit-pro-raw-toggle-icon--open' : ''} />
                {auditUi.rawSignals}
              </button>
              <div className={`seo-audit-pro-raw-panel ${rawOpen ? 'seo-audit-pro-raw-panel--open' : ''}`}>
                <p className="seo-audit-pro-raw-hint">{auditUi.rawHint}</p>
                <div className="seo-audit-pro-raw-grid">
                  <div className="meta-item">
                    <strong>Title</strong>
                    <div className="meta-item-value">{renderSignal(result.data.title)}</div>
                  </div>
                  <div className="meta-item">
                    <strong>Description</strong>
                    <div className="meta-item-value">{renderSignal(result.data.description)}</div>
                  </div>
                  <div className="meta-item">
                    <strong>{t('seoAuditPro.finalUrl')}</strong>
                    <div className="meta-item-value seo-audit-pro-raw-copy-row">
                      <span>{renderSignal(result.data.finalUrl, { missing: t('seoAuditPro.missing'), unknown: t('seoAuditPro.notAvailable') })}</span>
                      {typeof result.data.finalUrl === 'string' && result.data.finalUrl.length > 0 ? (
                        <button type="button" className="seo-audit-pro-raw-copy" onClick={() => copyToClipboard(result.data.finalUrl)}>
                          {language === 'en' ? 'Copy' : 'Копировать'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="meta-item">
                    <strong>{t('seoAuditPro.status')}</strong>
                    <div className="meta-item-value">{renderSignal(result.data.status, { missing: t('seoAuditPro.notAvailable'), unknown: t('seoAuditPro.notAvailable') })}</div>
                  </div>
                  <div className="meta-item">
                    <strong>{t('seoAuditPro.contentType')}</strong>
                    <div className="meta-item-value">{renderSignal(result.data.contentType, { missing: t('seoAuditPro.missing'), unknown: t('seoAuditPro.notAvailable') })}</div>
                  </div>
                  <div className="meta-item">
                    <strong>{t('seoAuditPro.canonical')}</strong>
                    <div className="meta-item-value seo-audit-pro-raw-copy-row">
                      <span>{renderSignal(result.data.canonical, { missing: t('seoAuditPro.missing'), unknown: t('seoAuditPro.notAvailable') })}</span>
                      {typeof result.data.canonical === 'string' && result.data.canonical.length > 0 ? (
                        <button type="button" className="seo-audit-pro-raw-copy" onClick={() => copyToClipboard(result.data.canonical)}>
                          {language === 'en' ? 'Copy' : 'Копировать'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="meta-item">
                    <strong>{t('seoAuditPro.robotsLabel')}</strong>
                    <div className="meta-item-value">{renderSignal(result.data.robots, { missing: t('seoAuditPro.missing'), unknown: t('seoAuditPro.notAvailable') })}</div>
                  </div>
                  <div className="meta-item">
                    <strong>{t('seoAuditPro.h1')}</strong>
                    <div className="meta-item-value">{result.data.h1Text ? renderSignal(result.data.h1Text) : renderSignal(result.data.h1Count)}</div>
                  </div>
                  {typeof result.data.h2Count === 'number' && (
                    <div className="meta-item">
                      <strong>{t('seoAuditPro.h2')}</strong>
                      <div className="meta-item-value">{result.data.h2Count}</div>
                    </div>
                  )}
                  {typeof result.data.h3Count === 'number' && (
                    <div className="meta-item">
                      <strong>{t('seoAuditPro.h3')}</strong>
                      <div className="meta-item-value">{result.data.h3Count}</div>
                    </div>
                  )}
                  {typeof result.data.imagesTotal === 'number' && typeof result.data.imagesWithoutAlt === 'number' && (
                    <div className="meta-item">
                      <strong>{t('seoAuditPro.images')}</strong>
                      <div className="meta-item-value">{result.data.imagesTotal} ({t('seoAuditPro.withoutAlt')}: {result.data.imagesWithoutAlt})</div>
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
                          : t('seoAuditPro.missing')}
                      </div>
                    </div>
                  )}
                  {result.data.twitter !== undefined && (
                    <div className="meta-item">
                      <strong>Twitter</strong>
                      <div className="meta-item-value">
                        {result.data.twitter
                          ? `${['card', 'title', 'description', 'image'].filter((key) => result.data.twitter?.[key]).length}/4`
                          : t('seoAuditPro.missing')}
                      </div>
                    </div>
                  )}
                  {result.data.hasStructuredData !== undefined && (
                    <div className="meta-item">
                      <strong>{language === 'en' ? 'Structured data' : 'Структурированные данные'}</strong>
                      <div className="meta-item-value">
                        {result.data.hasStructuredData === true
                          ? t('seoAuditPro.structuredYes')
                          : result.data.hasStructuredData === false
                            ? t('seoAuditPro.structuredNo')
                            : t('seoAuditPro.notAvailable')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ===== SHARE FOOTER ===== */}
            <ResultActions align="center">
              <button onClick={handleShare} className="seo-share-button">&#128228; {t('seoAuditPro.share')}</button>
            </ResultActions>

          </ToolPageLayout>
        )}

        <ToolHelp>
        <ToolDescriptionSection>
          <div className="tool-help-prose">
          <h2 className="tool-help-heading">{t('seoAuditPro.infoTitle')}</h2>
          <p>{t('seoAuditPro.infoDescription')}</p>

          <h3 className="tool-help-subheading">{t('seoAuditPro.checksTitle')}</h3>
          <ul>
            {Object.values(t('seoAuditPro.checks')).map((item) => <li key={item}>{item}</li>)}
          </ul>

          <h3 className="tool-help-subheading">{t('seoAuditPro.benefitsTitle')}</h3>
          <ul>
            {Object.values(t('seoAuditPro.benefits')).map((item) => <li key={item}>&#10003; {item}</li>)}
          </ul>

          <h3 className="tool-help-subheading">{t('seoAuditPro.ratingTitle')}</h3>
          <ul>
            {Object.values(t('seoAuditPro.rating')).map((item) => <li key={item}>{item}</li>)}
          </ul>

          <ToolFaq title={t('seoAuditPro.faqTitle')} items={Object.entries(t('seoAuditPro.faq')).reduce((acc, [key, val]) => { if (key.startsWith('q')) { const num = key.slice(1); const aKey = 'a' + num; const aVal = t('seoAuditPro.faq.' + aKey); acc.push({ q: val, a: aVal || '' }); } return acc; }, []).filter(item => item.q && item.a)} />
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