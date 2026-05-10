import {
  DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  GREETING_NAME_PATRONYMIC,
} from './addresseeTypes.js';

import {
  PROFILE_IDS,
  SCENARIO_IDS,
  getAddresseeScenario,
  mapScenarioToDocumentTemplate,
} from './addresseeProfiles.js';

export const ADDRESSEE_SCENARIO_OPTION_IDS = [
  SCENARIO_IDS.APPLICATION,
  SCENARIO_IDS.APPLICATION_DIRECTOR,
  SCENARIO_IDS.MEMO,
  SCENARIO_IDS.COMPLAINT,
  SCENARIO_IDS.REQUEST,
  SCENARIO_IDS.BUSINESS_LETTER,
  SCENARIO_IDS.CUSTOM,
  SCENARIO_IDS.CSV_BULK,
];

const QUERY_SCENARIO_ALIASES = {
  application: SCENARIO_IDS.APPLICATION,
  'application-director': SCENARIO_IDS.APPLICATION_DIRECTOR,
  applicationDirector: SCENARIO_IDS.APPLICATION_DIRECTOR,
  memo: SCENARIO_IDS.MEMO,
  complaint: SCENARIO_IDS.COMPLAINT,
  request: SCENARIO_IDS.REQUEST,
  'business-letter': SCENARIO_IDS.BUSINESS_LETTER,
  businessLetter: SCENARIO_IDS.BUSINESS_LETTER,
  custom: SCENARIO_IDS.CUSTOM,
  'csv-bulk': SCENARIO_IDS.CSV_BULK,
  csvBulk: SCENARIO_IDS.CSV_BULK,
  bulk: SCENARIO_IDS.CSV_BULK,
};

const SCENARIO_QUERY_VALUES = {
  [SCENARIO_IDS.APPLICATION]: 'application',
  [SCENARIO_IDS.APPLICATION_DIRECTOR]: 'application-director',
  [SCENARIO_IDS.MEMO]: 'memo',
  [SCENARIO_IDS.COMPLAINT]: 'complaint',
  [SCENARIO_IDS.REQUEST]: 'request',
  [SCENARIO_IDS.BUSINESS_LETTER]: 'business-letter',
  [SCENARIO_IDS.CUSTOM]: 'custom',
  [SCENARIO_IDS.CSV_BULK]: 'csv-bulk',
};

function translate(t, key, fallback) {
  if (typeof t !== 'function') return fallback;
  const value = t(key);
  return value && value !== key ? value : fallback;
}

function normalizeScenarioId(scenarioId, fallback = SCENARIO_IDS.CUSTOM) {
  if (typeof scenarioId !== 'string' || !scenarioId.trim()) return fallback;
  const trimmed = scenarioId.trim();
  const aliased = QUERY_SCENARIO_ALIASES[trimmed] || trimmed;
  return ADDRESSEE_SCENARIO_OPTION_IDS.includes(aliased) ? aliased : fallback;
}

function getProfileForScenario(scenarioId) {
  const scenario = getAddresseeScenario(scenarioId);
  return scenario.profileId || PROFILE_IDS.RU_SIMPLE_BUSINESS;
}

export function getDefaultAddresseeScenario() {
  return SCENARIO_IDS.BUSINESS_LETTER;
}

export function getScenarioUiConfig(scenarioId, t, language = 'ru') {
  const id = normalizeScenarioId(scenarioId);
  const scenario = getAddresseeScenario(id);
  const baseKey = `addresseeGenerator.addressee.scenarioUx.options.${id}`;
  const fallbackLabel = language === 'en' ? 'Custom Russian document' : 'Свой вариант';
  const fallbackDescription = language === 'en'
    ? 'Flexible Russian-document mode when the preset does not fit.'
    : 'Гибкий режим, если сценарий не подходит.';

  return {
    id,
    label: translate(t, `${baseKey}.label`, fallbackLabel),
    description: translate(t, `${baseKey}.description`, fallbackDescription),
    hint: translate(t, `${baseKey}.hint`, fallbackDescription),
    profileId: scenario.profileId || PROFILE_IDS.RU_SIMPLE_BUSINESS,
    documentTemplate: scenario.documentTemplate || DOCUMENT_TEMPLATE_BUSINESS_LETTER,
    isBulk: id === SCENARIO_IDS.CSV_BULK,
    enabled: scenario.enabled !== false,
  };
}

export function getAddresseeScenarioOptions(t, language = 'ru') {
  return ADDRESSEE_SCENARIO_OPTION_IDS.map((scenarioId) => getScenarioUiConfig(scenarioId, t, language));
}

export function applyScenarioToInput(input = {}, scenarioId) {
  const safeScenarioId = normalizeScenarioId(scenarioId);
  const scenario = getAddresseeScenario(safeScenarioId);
  const documentTemplate = scenario.documentTemplate || mapScenarioToDocumentTemplate(safeScenarioId);

  return {
    ...input,
    scenario: safeScenarioId,
    profile: scenario.profileId || getProfileForScenario(safeScenarioId),
    documentTemplate: documentTemplate || DOCUMENT_TEMPLATE_BUSINESS_LETTER,
    greetingMode: input.greetingMode || GREETING_NAME_PATRONYMIC,
  };
}

function toSearchParams(searchParams) {
  if (searchParams instanceof URLSearchParams) return searchParams;
  if (typeof searchParams === 'string') return new URLSearchParams(searchParams.startsWith('?') ? searchParams.slice(1) : searchParams);
  if (searchParams && typeof searchParams === 'object') return new URLSearchParams(searchParams);
  return new URLSearchParams();
}

export function getScenarioFromQueryParams(searchParams) {
  const params = toSearchParams(searchParams);
  const rawScenario = params.get('scenario');
  if (!rawScenario) return null;
  const mapped = QUERY_SCENARIO_ALIASES[rawScenario.trim()];
  return mapped && ADDRESSEE_SCENARIO_OPTION_IDS.includes(mapped) ? mapped : null;
}

export function buildScenarioQueryParams(scenarioId, options = {}) {
  const params = new URLSearchParams();
  const id = normalizeScenarioId(scenarioId);
  params.set('scenario', SCENARIO_QUERY_VALUES[id] || 'custom');

  if (['to', 'from', 'salutation'].includes(options.focus)) {
    params.set('focus', options.focus);
  }

  if (options.export === 'docx') {
    params.set('export', 'docx');
  }

  return params;
}

export function isBulkScenario(scenarioId) {
  return normalizeScenarioId(scenarioId, '') === SCENARIO_IDS.CSV_BULK;
}
