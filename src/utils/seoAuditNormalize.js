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

export { normalizeAuditData }