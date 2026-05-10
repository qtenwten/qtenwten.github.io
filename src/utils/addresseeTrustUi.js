function translate(t, key, fallback) {
  if (typeof t !== 'function') return fallback;
  const value = t(key);
  return value && value !== key ? value : fallback;
}

function getId(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return value.id || value.profileId || value.scenarioId || '';
  return '';
}

const CONFIDENCE_IDS = new Set(['high', 'medium', 'low']);

export function getConfidenceUi(confidenceLabel, t) {
  const id = CONFIDENCE_IDS.has(confidenceLabel) ? confidenceLabel : 'low';
  return {
    id,
    title: translate(t, `addressee.trust.confidence.${id}.title`, {
      high: 'High confidence',
      medium: 'Medium confidence',
      low: 'Manual review needed',
    }[id]),
    description: translate(t, `addressee.trust.confidence.${id}.description`, {
      high: 'The data looks complete, but formal documents should still be checked.',
      medium: 'There are ambiguous details. Review warnings before using the result.',
      low: 'Use the result as a draft and check the forms manually.',
    }[id]),
    className: `addr-gen-confidence--${id}`,
  };
}

export function getWarningSeverityUi(severity, t) {
  const id = ['info', 'warning', 'error', 'review'].includes(severity) ? severity : 'warning';
  return {
    id,
    label: translate(t, `addressee.trust.severity.${id}`, {
      info: 'Info',
      warning: 'Warning',
      error: 'Error',
      review: 'Review',
    }[id]),
    className: `addr-gen-warning-severity--${id}`,
  };
}

export function getAddresseeFieldLabel(field, t) {
  const normalized = typeof field === 'string' && field.trim() ? field.trim() : 'general';
  const map = {
    'recipient.fullName': 'addressee.fields.recipient.fullName',
    'recipient.position': 'addressee.fields.recipient.position',
    'recipient.organization': 'addressee.fields.recipient.organization',
    'recipient.gender': 'addressee.fields.recipient.gender',
    'sender.fullName': 'addressee.fields.sender.fullName',
    'sender.position': 'addressee.fields.sender.position',
    'sender.organization': 'addressee.fields.sender.organization',
    'manualCases': 'addressee.fields.manualCases',
    'manualCases.recipientDativeName': 'addressee.fields.manualCases.recipientDativeName',
    'manualCases.senderGenitiveName': 'addressee.fields.manualCases.senderGenitiveName',
    'format.documentTemplate': 'addressee.fields.format.documentTemplate',
    'general': 'addressee.fields.general',
  };
  return translate(t, map[normalized] || map.general, normalized === 'general' ? 'General' : 'General');
}

export function getProfileDisplayLabel(profile, t) {
  if (profile && typeof profile === 'object' && (profile.enabled === false || profile.status === 'future')) {
    return '';
  }

  const id = getId(profile);
  const map = {
    RU_OFFICIAL_STANDARD: 'addressee.profiles.RU_OFFICIAL_STANDARD',
    RU_SIMPLE_BUSINESS: 'addressee.profiles.RU_SIMPLE_BUSINESS',
  };
  return translate(t, map[id] || 'addressee.profiles.unknown', 'profile');
}

export function getScenarioDisplayLabel(scenario, t) {
  const id = getId(scenario);
  const map = {
    application: 'addressee.scenarios.application',
    complaint: 'addressee.scenarios.complaint',
    request: 'addressee.scenarios.request',
    memo: 'addressee.scenarios.memo',
    businessLetter: 'addressee.scenarios.businessLetter',
    custom: 'addressee.scenarios.custom',
    applicationDirector: 'addressee.scenarios.applicationDirector',
    csvBulk: 'addressee.scenarios.csvBulk',
  };
  return translate(t, map[id] || 'addressee.scenarios.custom', 'custom document');
}

export function getWarningSuggestionText(warning, t) {
  if (!warning) return '';
  const code = warning.code || '';
  const localized = code ? translate(t, `addressee.warningSuggestions.${code}`, '') : '';
  return localized || warning.suggestion || '';
}

function getManualReviewReason(warning, t) {
  const code = warning?.code || '';
  const categoryByCode = {
    INCOMPLETE_NAME: 'incompleteName',
    UNKNOWN_GENDER: 'unknownGender',
    AUTO_DETECTED_GENDER: 'unknownGender',
    UNKNOWN_POSITION: 'unknownPosition',
    ORGANIZATION_ABBREVIATION: 'organization',
    EXTRA_NAME_PARTS: 'nameCase',
    LATIN_NAME: 'nameCase',
    INITIALS_DETECTED: 'nameCase',
    HYPHENATED_NAME_REVIEW: 'nameCase',
    UNDECLINABLE_SURNAME: 'nameCase',
    NAME_CASE_UNCERTAIN: 'nameCase',
    NAME_CASE_MANUAL: 'manualCase',
    TEMPLATE_REVIEW: 'template',
  };
  const category = categoryByCode[code] || 'generic';
  return translate(
    t,
    `addressee.trust.manualReview.reasons.${category}`,
    'This part needs a manual check.'
  );
}

export function buildManualReviewItems(result, t) {
  if (!result) return [];
  const warnings = Array.isArray(result.warnings) ? result.warnings : [];
  const items = [];
  const seen = new Set();

  warnings.forEach((warning, index) => {
    const label = getAddresseeFieldLabel(warning?.field, t);
    const reason = getManualReviewReason(warning, t);
    const key = `${label}:${reason}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({
      key: warning?.code || `warning-${index}`,
      label,
      reason,
    });
  });

  if (items.length === 0 && (result.manualReviewRequired || result.confidenceLabel === 'medium' || result.confidenceLabel === 'low')) {
    items.push({
      key: 'manual-review',
      label: getAddresseeFieldLabel('general', t),
      reason: translate(t, 'addressee.trust.manualReview.reasons.generic', 'This result needs a manual check.'),
    });
  }

  return items;
}

export function shouldShowTrustLayer(result) {
  if (!result) return false;
  return Boolean(
    result.confidenceLabel ||
    typeof result.confidence === 'number' ||
    result.manualReviewRequired ||
    (Array.isArray(result.warnings) && result.warnings.length > 0) ||
    (Array.isArray(result.explanations) && result.explanations.length > 0) ||
    result.profile ||
    result.scenario
  );
}
