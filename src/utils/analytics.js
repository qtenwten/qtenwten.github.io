const ANALYTICS_EVENTS = {
  TOOL_USED: 'tool_used',
  QR_GENERATED: 'qr_generated',
  LINK_COPIED: 'link_copied',
  PASSWORD_GENERATED: 'password_generated',
  SEO_AUDIT_COMPLETED: 'seo_audit_completed',
  CALCULATOR_USED: 'calculator_used',
  ARTICLE_VIEWED: 'article_viewed',
  ARTICLE_LIST_VIEWED: 'article_list_viewed',
  FEEDBACK_SENT: 'feedback_sent',
  SEARCH_PERFORMED: 'search_performed',
  LANGUAGE_SWITCHED: 'language_switched',
  THEME_SWITCHED: 'theme_switched',
  OUTBOUND_LINK_CLICKED: 'outbound_link_clicked',
}

class AnalyticsService {
  constructor() {
    this.handlers = []
    this.sessionId = this.generateSessionId()
    this.initialized = false
  }

  generateSessionId() {
    return `qsen_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }

  init() {
    this.initialized = true
  }

  on(event, handler) {
    this.handlers.push({ event, handler })
    return () => {
      this.handlers = this.handlers.filter((h) => h.event !== event || h.handler !== handler)
    }
  }

  emit(event, properties = {}) {
    const payload = {
      event,
      properties: {
        ...properties,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        url: typeof window !== 'undefined' ? window.location.pathname : '',
        language: typeof window !== 'undefined' ? (window.__QSEN_INITIAL_LANGUAGE__ || 'ru') : 'ru',
      },
    }

    if (!this.initialized) return

    this.handlers.forEach(({ event: e, handler }) => {
      if (e === event || e === '*') {
        try {
          handler(payload)
        } catch (err) {
          console.error('[Analytics] Handler error:', err)
        }
      }
    })

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, payload.properties)
    }

    if (typeof window !== 'undefined' && window.ym) {
      try {
        window.ym(108416207, 'reachGoal', event, payload.properties)
      } catch {}
    }
  }

  trackToolUsed(toolSlug, properties = {}) {
    this.emit(ANALYTICS_EVENTS.TOOL_USED, {
      tool_slug: toolSlug,
      ...properties,
    })
  }

  trackQRGenerated(format, hasLogo, properties = {}) {
    this.emit(ANALYTICS_EVENTS.QR_GENERATED, {
      format,
      has_logo: hasLogo,
      ...properties,
    })
  }

  trackLinkCopied(toolSlug, linkType = 'result', properties = {}) {
    this.emit(ANALYTICS_EVENTS.LINK_COPIED, {
      tool_slug: toolSlug,
      link_type: linkType,
      ...properties,
    })
  }

  trackPasswordGenerated(length, hasSymbols, hasNumbers, properties = {}) {
    this.emit(ANALYTICS_EVENTS.PASSWORD_GENERATED, {
      length,
      has_symbols: hasSymbols,
      has_numbers: hasNumbers,
      ...properties,
    })
  }

  trackSEOAuditCompleted(score, url, properties = {}) {
    this.emit(ANALYTICS_EVENTS.SEO_AUDIT_COMPLETED, {
      score,
      url: typeof url === 'string' ? url.slice(0, 200) : '',
      ...properties,
    })
  }

  trackArticleViewed(slug, translationKey, properties = {}) {
    this.emit(ANALYTICS_EVENTS.ARTICLE_VIEWED, {
      slug,
      translation_key: translationKey,
      ...properties,
    })
  }

  trackArticleListViewed(properties = {}) {
    this.emit(ANALYTICS_EVENTS.ARTICLE_LIST_VIEWED, properties)
  }

  trackSearchPerformed(query, resultCount, properties = {}) {
    this.emit(ANALYTICS_EVENTS.SEARCH_PERFORMED, {
      query: query.slice(0, 100),
      result_count: resultCount,
      ...properties,
    })
  }

  trackFeedbackSent(properties = {}) {
    this.emit(ANALYTICS_EVENTS.FEEDBACK_SENT, properties)
  }

  trackLanguageSwitched(fromLanguage, toLanguage, properties = {}) {
    this.emit(ANALYTICS_EVENTS.LANGUAGE_SWITCHED, {
      from_language: fromLanguage,
      to_language: toLanguage,
      ...properties,
    })
  }

  trackThemeSwitched(isDark, properties = {}) {
    this.emit(ANALYTICS_EVENTS.THEME_SWITCHED, {
      theme: isDark ? 'dark' : 'light',
      ...properties,
    })
  }

  trackCalculatorUsed(expression, result, properties = {}) {
    this.emit(ANALYTICS_EVENTS.CALCULATOR_USED, {
      expression: String(expression).slice(0, 200),
      result: String(result).slice(0, 200),
      ...properties,
    })
  }

  trackOutboundLinkClicked(properties = {}) {
    this.emit(ANALYTICS_EVENTS.OUTBOUND_LINK_CLICKED, properties)
  }
}

export const analytics = new AnalyticsService()

export { ANALYTICS_EVENTS }
