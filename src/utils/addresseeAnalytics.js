import { analytics, ANALYTICS_EVENTS } from './analytics.js'

export const ADDRESSEE_ANALYTICS_EVENTS = {
  TOOL_OPENED: 'addressee_tool_opened',
  SCENARIO_SELECTED: 'addressee_scenario_selected',
  GENERATED: 'addressee_generated',
  WARNING_SHOWN: 'addressee_warning_shown',
  EXPLANATION_OPENED: 'addressee_explanation_opened',
  COPY_CLICKED: 'addressee_copy_clicked',
  EXPORT_CLICKED: 'addressee_export_clicked',
  EXPORT_SUCCESS: 'addressee_export_success',
  CSV_IMPORT_STARTED: 'addressee_csv_import_started',
  CSV_IMPORT_COMPLETED: 'addressee_csv_import_completed',
  CSV_EXPORT_SUCCESS: 'addressee_csv_export_success',
  PRESET_ACTION: 'addressee_preset_action',
  PREMIUM_INTENT: 'addressee_premium_intent',
  PACK_VIEW: 'addressee_pack_view',
  PACK_SELECT: 'addressee_pack_select',
  LANGUAGE_SWITCH: 'addressee_language_switch',
}

const FORBIDDEN_KEYS = [
  'fullName',
  'senderFullName',
  'position',
  'senderPosition',
  'organization',
  'senderOrganization',
  'recipientDativeName',
  'senderGenitiveName',
  'documentText',
  'blocks',
  'result',
  'csv',
  'rows',
  'input',
  'warnings',
  'warnings_message',
  'warning_message',
  'explanations',
  'explanations_text',
  'explanation_text',
  'explanation_message',
  'parsedName',
  'to',
  'from',
  'greeting',
  'letter',
  'manualReviewRequired',
  'confidence',
  'id',
  'label',
  'data',
  'createdAt',
  'updatedAt',
]

const PRESET_LABEL_KEYS = ['label', 'presetLabel', 'preset_name', 'name']
const PRESET_DATA_KEYS = ['data', 'presetData', 'preset_data', 'fullName', 'position', 'organization', 'senderFullName', 'senderPosition', 'senderOrganization', 'recipientDativeName', 'senderGenitiveName']

export function getConfidenceBucket(confidence) {
  if (confidence === undefined || confidence === null) return 'unknown'
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.6) return 'medium'
  return 'low'
}

export function getCsvRowsBucket(rowCount) {
  if (rowCount === undefined || rowCount === null) return 'unknown'
  if (rowCount === 0) return 'empty'
  if (rowCount <= 5) return 'small'
  if (rowCount <= 20) return 'medium'
  return 'large'
}

export function getWarningCodes(result) {
  if (!result || !result.warnings || !Array.isArray(result.warnings)) return []
  return result.warnings
    .map((w) => (typeof w === 'string' ? w : w?.code))
    .filter(Boolean)
}

export function buildAddresseeAnalyticsPayload(input = {}, result = null, extra = {}) {
  const payload = { ...extra }

  if (result && typeof result === 'object') {
    if (result.profile) payload.profile = result.profile
    if (result.scenario) payload.scenario = result.scenario
    if (result.confidence !== undefined) payload.confidence_bucket = getConfidenceBucket(result.confidence)
    if (result.confidenceLabel) payload.confidence_label = result.confidenceLabel
    if (result.warnings && Array.isArray(result.warnings)) {
      payload.warnings_count = result.warnings.length
      payload.warning_codes = getWarningCodes(result)
    }
  }

  if (input && typeof input === 'object') {
    if (input.language) payload.language = input.language
    if (input.fullName) payload.has_recipient = Boolean(input.fullName.trim())
    if (input.senderFullName) payload.has_sender = Boolean(input.senderFullName.trim())
    if (input.recipientDativeName) payload.has_manual_recipient_case = Boolean(input.recipientDativeName.trim())
    if (input.senderGenitiveName) payload.has_manual_sender_case = Boolean(input.senderGenitiveName.trim())
  }

  FORBIDDEN_KEYS.forEach((key) => {
    if (key in payload) delete payload[key]
  })

  PRESET_LABEL_KEYS.forEach((key) => {
    if (key in payload) delete payload[key]
  })

  PRESET_DATA_KEYS.forEach((key) => {
    if (key in payload) delete payload[key]
  })

  if (payload.warning_codes && Array.isArray(payload.warning_codes)) {
    payload.warning_codes = payload.warning_codes.slice(0, 20)
  }

  return payload
}

function safeEmit(event, payload) {
  try {
    if (typeof analytics !== 'undefined' && analytics && typeof analytics.emit === 'function') {
      analytics.emit(event, payload)
    }
  } catch {}
}

export function trackAddresseeToolOpened(payload = {}) {
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.TOOL_OPENED, payload)
}

export function trackAddresseeScenarioSelected(payload) {
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.SCENARIO_SELECTED, payload)
}

export function trackAddresseeGenerated(input, result, extra = {}) {
  const payload = buildAddresseeAnalyticsPayload(input, result, extra)
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.GENERATED, payload)
}

export function trackAddresseeWarningShown(input, result, extra = {}) {
  if (!result || !result.warnings || result.warnings.length === 0) return
  const payload = buildAddresseeAnalyticsPayload(input, result, extra)
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.WARNING_SHOWN, payload)
}

export function trackAddresseeExplanationOpened(input, result, explanationCode, extra = {}) {
  const payload = buildAddresseeAnalyticsPayload(input, result, {
    explanation_code: explanationCode,
    ...extra,
  })
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.EXPLANATION_OPENED, payload)
}

export function trackAddresseeCopyClicked(input, result, copyTarget, extra = {}) {
  const payload = buildAddresseeAnalyticsPayload(input, result, {
    copy_target: copyTarget,
    ...extra,
  })
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.COPY_CLICKED, payload)
}

export function trackAddresseeExportClicked(input, result, exportType, extra = {}) {
  const payload = buildAddresseeAnalyticsPayload(input, result, {
    export_type: exportType,
    ...extra,
  })
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.EXPORT_CLICKED, payload)
}

export function trackAddresseeCsvImportStarted(extra = {}) {
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.CSV_IMPORT_STARTED, extra)
}

export function trackAddresseeCsvImportCompleted(rowCount, extra = {}) {
  const payload = {
    csv_rows_bucket: getCsvRowsBucket(rowCount),
    ...extra,
  }
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.CSV_IMPORT_COMPLETED, payload)
}

export function trackAddresseePresetAction(presetType, action, extra = {}) {
  const payload = {
    preset_type: presetType,
    preset_action: action,
    ...extra,
  }
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.PRESET_ACTION, payload)
}

export function trackAddresseePremiumIntent(action, extra = {}) {
  const payload = {
    plan_context: 'addressee_generator',
    action,
    ...extra,
  }
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.PREMIUM_INTENT, payload)
}

export function trackAddresseePresetLimitReached(presetType, limit, extra = {}) {
  const payload = {
    preset_type: presetType,
    preset_limit: limit,
    ...extra,
  }
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.PREMIUM_INTENT, payload)
}

export function trackAddresseeBulkApproachingLimit(rowCount, limit, extra = {}) {
  const payload = {
    bulk_row_count: rowCount,
    bulk_row_limit: limit,
    ratio: Math.round((rowCount / limit) * 100),
    ...extra,
  }
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.PREMIUM_INTENT, payload)
}

export function trackAddresseeExportFormatInterest(exportType, extra = {}) {
  const payload = {
    export_type: exportType,
    ...extra,
  }
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.PREMIUM_INTENT, payload)
}

export function trackAddresseeScenarioChange(scenarioId, profile, language) {
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.SCENARIO_SELECTED, {
    scenario: scenarioId,
    profile: profile,
    language: language,
  })
}

export function trackAddresseeExportSuccess(input, result, exportType, extra = {}) {
  const payload = buildAddresseeAnalyticsPayload(input, result, {
    export_type: exportType,
    ...extra,
  })
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.EXPORT_SUCCESS, payload)
}

export function trackAddresseeCsvExportSuccess(rowCount, extra = {}) {
  const payload = {
    csv_rows_bucket: getCsvRowsBucket(rowCount),
    ...extra,
  }
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.CSV_EXPORT_SUCCESS, payload)
}

let lastPackViewLanguage = null

export function trackAddresseePackView(extra = {}) {
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.PACK_VIEW, extra)
}

export function trackAddresseePackSelect(packId, documentTemplate, extra = {}) {
  const payload = {
    pack_id: packId,
    document_type: documentTemplate,
    ...extra,
  }
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.PACK_SELECT, payload)
}

let lastLanguage = null

export function trackAddresseeLanguageSwitch(newLanguage, extra = {}) {
  const payload = {
    language: newLanguage,
    ...extra,
  }
  lastLanguage = newLanguage
  safeEmit(ADDRESSEE_ANALYTICS_EVENTS.LANGUAGE_SWITCH, payload)
}