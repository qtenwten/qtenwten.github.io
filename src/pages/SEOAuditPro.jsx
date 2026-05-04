import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect, useMemo } from 'react'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import Icon from '../components/Icon'
import { seoAuditCache } from '../utils/apiCache'
import { analyzeSEO } from '../utils/seoAudit'
import InlineSpinner from '../components/InlineSpinner'
import { useAsyncRequest } from '../hooks/useAsyncRequest'
import { ResultActions, ResultDetails, ResultNotice, ResultSection, ResultSummary } from '../components/ResultSection'
import ToolPageShell, { ToolControls, ToolHelp, ToolPageHero, ToolPageLayout, ToolRelated, ToolResult } from '../components/ToolPageShell'
import { analytics } from '../utils/analytics'
import './SEOAuditPro.css'

import { normalizeAuditUrl, requestWorkerAudit } from '../utils/seoAuditApi'
import { AUDIT_UI_COPY } from '../utils/seoAuditUiCopy'
import {
  createWorkerAnalysis,
  createFallbackAnalysis,
  getDefaultExpandedCheckIds,
  getScoreColor,
  getVisibleAuditCategories,
  getVisibleAuditCheckCount,
} from '../utils/seoAuditChecks'

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
  const [checkFilter, setCheckFilter] = useState('issues')
  const [activeCategoryId, setActiveCategoryId] = useState(null)
  const [expandedCheckIds, setExpandedCheckIds] = useState(() => new Set())
  const [rawOpen, setRawOpen] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const auditUi = AUDIT_UI_COPY[language] || AUDIT_UI_COPY.ru

  const applyAnalysisResult = (analysis) => {
    setResult(analysis)
    setCheckFilter('issues')
    setActiveCategoryId(null)
    setExpandedCheckIds(getDefaultExpandedCheckIds(analysis))
    setRawOpen(false)
  }

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
      applyAnalysisResult(cachedResult)
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setActiveCategoryId(null)
    setExpandedCheckIds(new Set())

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
      applyAnalysisResult(outcome.result.analysis)
      const analysis = outcome.result.analysis
      let urlDomain = ''
      try { urlDomain = new URL(normalizedUrl).hostname } catch {}
      analytics.trackSEOAuditCompleted(analysis.score, urlDomain, {
        issues_count: analysis.issues?.length || 0,
        method: outcome.result.type, // 'worker' | 'fallback'
      })
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
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 3000)
       }).catch(() => {
         prompt(t('seoAuditPro.sharePrompt'), shareUrl)
       })
     } else {
       prompt(t('seoAuditPro.sharePrompt'), shareUrl)
     }

    analytics.trackSEOAuditCompleted(result.score, url, {
      issues_count: result.issues.length,
      shared: true,
    })
  }

  const isFallbackResult = result?.data?.source === 'browser'
  const visibleCategories = useMemo(() => {
    return getVisibleAuditCategories(result, { checkFilter, activeCategoryId })
  }, [result, checkFilter, activeCategoryId])

  const visibleCheckCount = getVisibleAuditCheckCount(visibleCategories)
  const activeCategory = result?.categories?.find((category) => category.id === activeCategoryId) || null

  const filterOptions = [
    { key: 'issues', label: auditUi.filterIssues },
    { key: 'all', label: auditUi.filterAll },
    { key: 'errors', label: auditUi.filterErrors },
    { key: 'warnings', label: auditUi.filterWarnings },
    { key: 'passed', label: auditUi.filterPassed },
    { key: 'na', label: auditUi.filterUnavailable },
  ]

  const toggleCategoryFilter = (categoryId) => {
    setActiveCategoryId(prev => (prev === categoryId ? null : categoryId))
  }

  const toggleCheckDetails = (checkId) => {
    setExpandedCheckIds(prev => {
      const next = new Set(prev)

      if (next.has(checkId)) {
        next.delete(checkId)
      } else {
        next.add(checkId)
      }

      return next
    })
  }

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
            <div className="seo-audit-pro-error-bar">
              <p>{error}</p>
              <button
                onClick={handleAnalyze}
                className="btn-primary seo-audit-pro-error-action"
              >
                {t('seoAuditPro.retry')}
              </button>
            </div>
          )}

          <div className="field seo-audit-pro-action-row">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="btn-primary seo-audit-pro-analyze-btn"
            >
              {loading ? <><InlineSpinner /> {t('seoAuditPro.analyzing')}</> : t('seoAuditPro.analyze')}
            </button>
            {result && (
              <button onClick={handleShare} className="btn-secondary seo-audit-pro-share-btn">
                <Icon name="content_copy" size={16} />
                {t('seoAuditPro.share')}
              </button>
            )}
            {shareSuccess && (
              <ResultNotice tone="success">
                {t('seoAuditPro.shareSuccess')}
              </ResultNotice>
            )}
          </div>
        </ToolControls>

        {loading && (
          <ToolResult>
            <ResultSection>
              <ResultSummary>
                <div className="seo-audit-pro-loading">
                  <div className="seo-audit-pro-spinner" />
                  <p>{t('seoAuditPro.analyzing')}</p>
                </div>
              </ResultSummary>
            </ResultSection>
          </ToolResult>
        )}

        {!loading && result && (
          <ToolPageLayout>
            <ToolResult>
              <ResultSection>

                {isFallbackResult && (
                  <ResultNotice tone="warning">
                    <p>{auditUi.fallbackNoticeBody}</p>
                  </ResultNotice>
                )}

                <div className="seo-audit-pro-hero">
                  <div className="seo-audit-pro-hero-left">
                    <div className="seo-audit-pro-score-ring">
                      <svg viewBox="0 0 120 120" className="seo-audit-pro-score-ring-svg">
                        <circle className="seo-audit-pro-score-ring-track" cx="60" cy="60" r="54" />
                        <circle
                          className="seo-audit-pro-score-ring-fill"
                          cx="60" cy="60" r="54"
                          strokeDasharray={`${2 * Math.PI * 54}`}
                          strokeDashoffset={`${2 * Math.PI * 54 * (1 - result.score / 100)}`}
                          style={{ stroke: getScoreColor(result.score) }}
                        />
                      </svg>
                      <div className="seo-audit-pro-score-ring-label">
                        <span className="seo-audit-pro-score-number" style={{ color: getScoreColor(result.score) }}>{result.score}</span>
                        <span className="seo-audit-pro-score-label">
                          {result.score >= 80 ? t('seoAuditPro.excellent') :
                           result.score >= 60 ? t('seoAuditPro.good') :
                           t('seoAuditPro.poor')}
                        </span>
                      </div>
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

              <div className="seo-audit-pro-section-block">
                <div className="seo-audit-pro-section-header">
                  <h3 className="seo-audit-pro-section-title">{auditUi.categoryScores}</h3>
                  <span className="seo-audit-pro-section-meta">{auditUi.checksCount(result.summary.checkedCount, result.summary.totalChecks)}</span>
                </div>
                <div className="seo-audit-pro-category-overview">
                  {result.categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={`seo-audit-pro-category-card seo-audit-pro-category-card--${category.status} ${activeCategoryId === category.id ? 'is-active' : ''}`.trim()}
                      onClick={() => toggleCategoryFilter(category.id)}
                      aria-pressed={activeCategoryId === category.id}
                    >
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
                    </button>
                  ))}
                </div>
              </div>

              <div className="seo-audit-pro-section-block">
                <div className="seo-audit-pro-filters-bar">
                  <strong className="seo-audit-pro-filters-label">{auditUi.scoreBreakdown}</strong>
                  <span className="seo-audit-pro-filters-count">
                    {activeCategory ? `${activeCategory.label}: ` : ''}
                    {auditUi.checksCount(visibleCheckCount, result.checks.length)}
                  </span>
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

              {visibleCategories.map((category) => (
                <ResultDetails key={category.id} title={category.label} className="seo-audit-pro-section">
                  <div className="seo-audit-pro-check-list">
                    {category.visibleChecks.map((check) => {
                      const isExpanded = expandedCheckIds.has(check.id)
                      const detailsId = `seo-audit-pro-check-${check.id}`

                      return (
                        <article key={check.id} className={`seo-audit-pro-check seo-audit-pro-check--${check.status}`}>
                          <button
                            type="button"
                            className="seo-audit-pro-check__toggle"
                            onClick={() => toggleCheckDetails(check.id)}
                            aria-expanded={isExpanded}
                            aria-controls={detailsId}
                          >
                            <span className="seo-audit-pro-check__row">
                          <span className="seo-audit-pro-check__name">
                            <span className={`seo-audit-pro-status seo-audit-pro-status--${check.status}`}>{auditUi.status[check.status]}</span>
                            <strong>{check.label}</strong>
                          </span>
                          <span className="seo-audit-pro-check__value-block">
                            <span className="seo-audit-pro-check__value">{check.value}</span>
                            <span className="seo-audit-pro-points">{check.status === 'na' ? '—' : auditUi.scoreOutOf(check.scoreEarned ?? 0, check.weight)}</span>
                            <ChevronIcon className={isExpanded ? 'seo-audit-pro-raw-toggle-icon--open' : ''} />
                          </span>
                        </span>
                        <span className="seo-audit-pro-check__summary">{check.summary}</span>
                          </button>
                        {isExpanded && (
                        <div id={detailsId} className="seo-audit-pro-check__details">
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
                        )}
                        </article>
                      )
                    })}
                  </div>
                </ResultDetails>
              ))}

              {!visibleCategories.length && (
                <div className="seo-audit-pro-empty-state">
                  <p>{language === 'en' ? 'No checks match the selected filter.' : 'Для выбранного фильтра нет подходящих проверок.'}</p>
                </div>
              )}

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
                    {result.data.h1Text && (
                      <div className="meta-item">
                        <strong>H1</strong>
                        <div className="meta-item-value">{renderSignal(result.data.h1Text)}</div>
                      </div>
                    )}
                    {typeof result.data.h1Count === 'number' && (
                      <div className="meta-item">
                        <strong>{t('seoAuditPro.h1Count')}</strong>
                        <div className="meta-item-value">{result.data.h1Count}</div>
                      </div>
                    )}
                    {typeof result.data.h2Count === 'number' && (
                      <div className="meta-item">
                        <strong>H2</strong>
                        <div className="meta-item-value">{result.data.h2Count}</div>
                      </div>
                    )}
                    {typeof result.data.h3Count === 'number' && (
                      <div className="meta-item">
                        <strong>H3</strong>
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

              <ResultActions align="center">
                <button onClick={handleShare} className="seo-share-button">
                  <Icon name="content_copy" size={16} />
                  {t('seoAuditPro.share')}
                </button>
              </ResultActions>

            </ResultSection>
          </ToolResult>
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
