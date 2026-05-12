export const OFFER_STATUS = {
  AVAILABLE: 'available',
  COMING_SOON: 'comingSoon',
  INTEREST_ONLY: 'interestOnly',
}

export const ANALYTICS_KEYS = {
  FREE: 'free',
  STARTER: 'starter',
  OFFICE: 'office',
}

export const PREMIUM_OFFERS = [
  {
    id: 'clean-docx',
    titleKey: 'addresseeGenerator.premium.offers.cleanDocx.title',
    descriptionKey: 'addresseeGenerator.premium.offers.cleanDocx.description',
    featuresKey: 'addresseeGenerator.premium.offers.cleanDocx.features',
    ctaLabelKey: 'addresseeGenerator.premium.offers.cleanDocx.cta',
    badgeLabelKey: 'addresseeGenerator.premium.offers.cleanDocx.badge',
    status: OFFER_STATUS.AVAILABLE,
    analyticsKey: ANALYTICS_KEYS.FREE,
  },
  {
    id: 'office-pack',
    titleKey: 'addresseeGenerator.premium.offers.officePack.title',
    descriptionKey: 'addresseeGenerator.premium.offers.officePack.description',
    featuresKey: 'addresseeGenerator.premium.offers.officePack.features',
    ctaLabelKey: 'addresseeGenerator.premium.offers.officePack.cta',
    badgeLabelKey: 'addresseeGenerator.premium.offers.officePack.badge',
    status: OFFER_STATUS.AVAILABLE,
    analyticsKey: ANALYTICS_KEYS.FREE,
  },
  {
    id: 'batch-csv',
    titleKey: 'addresseeGenerator.premium.offers.batchCsv.title',
    descriptionKey: 'addresseeGenerator.premium.offers.batchCsv.description',
    featuresKey: 'addresseeGenerator.premium.offers.batchCsv.features',
    ctaLabelKey: 'addresseeGenerator.premium.offers.batchCsv.cta',
    badgeLabelKey: 'addresseeGenerator.premium.offers.batchCsv.badge',
    status: OFFER_STATUS.INTEREST_ONLY,
    analyticsKey: ANALYTICS_KEYS.FREE,
  },
  {
    id: 'saved-presets',
    titleKey: 'addresseeGenerator.premium.offers.savedPresets.title',
    descriptionKey: 'addresseeGenerator.premium.offers.savedPresets.description',
    featuresKey: 'addresseeGenerator.premium.offers.savedPresets.features',
    ctaLabelKey: 'addresseeGenerator.premium.offers.savedPresets.cta',
    badgeLabelKey: 'addresseeGenerator.premium.offers.savedPresets.badge',
    status: OFFER_STATUS.COMING_SOON,
    analyticsKey: ANALYTICS_KEYS.FREE,
  },
]

export function getOfferById(offerId) {
  return PREMIUM_OFFERS.find((o) => o.id === offerId) || null
}

export function getAvailableOffers() {
  return PREMIUM_OFFERS.filter((o) => o.status === OFFER_STATUS.AVAILABLE)
}

export function getComingSoonOffers() {
  return PREMIUM_OFFERS.filter((o) => o.status === OFFER_STATUS.COMING_SOON)
}

export function getInterestOnlyOffers() {
  return PREMIUM_OFFERS.filter((o) => o.status === OFFER_STATUS.INTEREST_ONLY)
}

export function validateOfferIntegrity() {
  const errors = []
  const ids = new Set()

  for (const offer of PREMIUM_OFFERS) {
    if (ids.has(offer.id)) {
      errors.push(`Duplicate offer id: ${offer.id}`)
    }
    ids.add(offer.id)

    if (!offer.id || typeof offer.id !== 'string') {
      errors.push(`Offer missing valid id: ${JSON.stringify(offer)}`)
    }

    const requiredKeys = ['titleKey', 'descriptionKey', 'ctaLabelKey', 'badgeLabelKey', 'status', 'analyticsKey']
    for (const key of requiredKeys) {
      if (!offer[key]) {
        errors.push(`Offer ${offer.id}: missing ${key}`)
      }
    }

    const validStatuses = Object.values(OFFER_STATUS)
    if (!validStatuses.includes(offer.status)) {
      errors.push(`Offer ${offer.id}: invalid status ${offer.status}`)
    }

    const validAnalyticsKeys = Object.values(ANALYTICS_KEYS)
    if (!validAnalyticsKeys.includes(offer.analyticsKey)) {
      errors.push(`Offer ${offer.id}: invalid analyticsKey ${offer.analyticsKey}`)
    }
  }

  return errors
}