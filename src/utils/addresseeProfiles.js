import {
  DOCUMENT_TEMPLATE_APPLICATION,
  DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  DOCUMENT_TEMPLATE_COMPLAINT,
  DOCUMENT_TEMPLATE_MEMO,
  DOCUMENT_TEMPLATE_REQUEST,
} from './addresseeTypes.js';

import {
  CASE_DATIVE,
  CASE_GENITIVE,
} from './addresseeNameCases.js';

export const PROFILE_IDS = {
  RU_OFFICIAL_STANDARD: 'RU_OFFICIAL_STANDARD',
  RU_SIMPLE_BUSINESS: 'RU_SIMPLE_BUSINESS',
  EN_BUSINESS_LETTER: 'EN_BUSINESS_LETTER',
  EN_INTERNAL_MEMO: 'EN_INTERNAL_MEMO',
};

export const SCENARIO_IDS = {
  APPLICATION: 'application',
  COMPLAINT: 'complaint',
  REQUEST: 'request',
  MEMO: 'memo',
  BUSINESS_LETTER: 'businessLetter',
  CUSTOM: 'custom',
  APPLICATION_DIRECTOR: 'applicationDirector',
  CSV_BULK: 'csvBulk',
  EN_BUSINESS_LETTER: 'enBusinessLetter',
  EN_INTERNAL_MEMO: 'enInternalMemo',
};

export const DEFAULT_ADDRESSEE_PROFILE_ID = PROFILE_IDS.RU_OFFICIAL_STANDARD;
export const DEFAULT_ADDRESSEE_SCENARIO_ID = SCENARIO_IDS.BUSINESS_LETTER;

export const ADDRESSEE_PROFILES = {
  [PROFILE_IDS.RU_OFFICIAL_STANDARD]: {
    id: PROFILE_IDS.RU_OFFICIAL_STANDARD,
    language: 'ru',
    status: 'active',
    enabled: true,
    casePolicy: {
      recipientNameCase: CASE_DATIVE,
      senderNameCase: CASE_GENITIVE,
      requirePatronymic: true,
    },
    blockOrder: [
      'toBlock',
      'fromBlock',
      'salutation',
      'documentHeader',
      'fullPreview',
    ],
    warningPolicy: {
      conservativeNameCases: true,
      warnUnknownPosition: true,
      warnAbbreviatedOrganization: true,
    },
    exportDefaults: {
      includeWarnings: true,
      docxTemplate: 'ru-official-basic',
    },
  },
  [PROFILE_IDS.RU_SIMPLE_BUSINESS]: {
    id: PROFILE_IDS.RU_SIMPLE_BUSINESS,
    language: 'ru',
    status: 'active',
    enabled: true,
    casePolicy: {
      recipientNameCase: CASE_DATIVE,
      senderNameCase: CASE_GENITIVE,
      requirePatronymic: false,
    },
    blockOrder: [
      'toBlock',
      'fromBlock',
      'salutation',
      'documentHeader',
      'fullPreview',
    ],
    warningPolicy: {
      conservativeNameCases: true,
      warnUnknownPosition: true,
      warnAbbreviatedOrganization: true,
      allowMissingPatronymic: true,
    },
    exportDefaults: {
      includeWarnings: true,
      docxTemplate: 'ru-business-basic',
    },
  },
  [PROFILE_IDS.EN_BUSINESS_LETTER]: {
    id: PROFILE_IDS.EN_BUSINESS_LETTER,
    language: 'en',
    status: 'future',
    enabled: false,
    reason: 'EN mode requires separate business letter/memo logic and must not reuse RU case rules.',
  },
  [PROFILE_IDS.EN_INTERNAL_MEMO]: {
    id: PROFILE_IDS.EN_INTERNAL_MEMO,
    language: 'en',
    status: 'future',
    enabled: false,
    reason: 'EN mode requires separate business letter/memo logic and must not reuse RU case rules.',
  },
};

export const ADDRESSEE_SCENARIOS = {
  [SCENARIO_IDS.APPLICATION]: {
    id: SCENARIO_IDS.APPLICATION,
    profileId: PROFILE_IDS.RU_OFFICIAL_STANDARD,
    documentTemplate: DOCUMENT_TEMPLATE_APPLICATION,
    enabled: true,
  },
  [SCENARIO_IDS.COMPLAINT]: {
    id: SCENARIO_IDS.COMPLAINT,
    profileId: PROFILE_IDS.RU_OFFICIAL_STANDARD,
    documentTemplate: DOCUMENT_TEMPLATE_COMPLAINT,
    enabled: true,
  },
  [SCENARIO_IDS.REQUEST]: {
    id: SCENARIO_IDS.REQUEST,
    profileId: PROFILE_IDS.RU_OFFICIAL_STANDARD,
    documentTemplate: DOCUMENT_TEMPLATE_REQUEST,
    enabled: true,
  },
  [SCENARIO_IDS.MEMO]: {
    id: SCENARIO_IDS.MEMO,
    profileId: PROFILE_IDS.RU_OFFICIAL_STANDARD,
    documentTemplate: DOCUMENT_TEMPLATE_MEMO,
    enabled: true,
  },
  [SCENARIO_IDS.BUSINESS_LETTER]: {
    id: SCENARIO_IDS.BUSINESS_LETTER,
    profileId: PROFILE_IDS.RU_SIMPLE_BUSINESS,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
    enabled: true,
  },
  [SCENARIO_IDS.CUSTOM]: {
    id: SCENARIO_IDS.CUSTOM,
    profileId: PROFILE_IDS.RU_SIMPLE_BUSINESS,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
    enabled: true,
  },
  [SCENARIO_IDS.APPLICATION_DIRECTOR]: {
    id: SCENARIO_IDS.APPLICATION_DIRECTOR,
    profileId: PROFILE_IDS.RU_OFFICIAL_STANDARD,
    documentTemplate: DOCUMENT_TEMPLATE_APPLICATION,
    enabled: true,
  },
  [SCENARIO_IDS.CSV_BULK]: {
    id: SCENARIO_IDS.CSV_BULK,
    profileId: PROFILE_IDS.RU_SIMPLE_BUSINESS,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
    enabled: true,
  },
  [SCENARIO_IDS.EN_BUSINESS_LETTER]: {
    id: SCENARIO_IDS.EN_BUSINESS_LETTER,
    profileId: PROFILE_IDS.EN_BUSINESS_LETTER,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
    status: 'future',
    enabled: false,
  },
  [SCENARIO_IDS.EN_INTERNAL_MEMO]: {
    id: SCENARIO_IDS.EN_INTERNAL_MEMO,
    profileId: PROFILE_IDS.EN_INTERNAL_MEMO,
    documentTemplate: DOCUMENT_TEMPLATE_MEMO,
    status: 'future',
    enabled: false,
  },
};

const DOCUMENT_TEMPLATE_TO_SCENARIO = {
  [DOCUMENT_TEMPLATE_APPLICATION]: SCENARIO_IDS.APPLICATION,
  [DOCUMENT_TEMPLATE_COMPLAINT]: SCENARIO_IDS.COMPLAINT,
  [DOCUMENT_TEMPLATE_REQUEST]: SCENARIO_IDS.REQUEST,
  [DOCUMENT_TEMPLATE_MEMO]: SCENARIO_IDS.MEMO,
  [DOCUMENT_TEMPLATE_BUSINESS_LETTER]: SCENARIO_IDS.BUSINESS_LETTER,
};

function getId(value, fallback = '') {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    return value.id || value.profileId || value.scenarioId || fallback;
  }
  return fallback;
}

export function getAddresseeProfile(profileId) {
  const id = getId(profileId, DEFAULT_ADDRESSEE_PROFILE_ID);
  return ADDRESSEE_PROFILES[id] || ADDRESSEE_PROFILES[DEFAULT_ADDRESSEE_PROFILE_ID];
}

export function getAddresseeScenario(scenarioId) {
  const id = getId(scenarioId, DEFAULT_ADDRESSEE_SCENARIO_ID);
  return ADDRESSEE_SCENARIOS[id] || ADDRESSEE_SCENARIOS[SCENARIO_IDS.CUSTOM];
}

export function mapDocumentTemplateToScenario(documentTemplate) {
  if (!documentTemplate) return DEFAULT_ADDRESSEE_SCENARIO_ID;
  return DOCUMENT_TEMPLATE_TO_SCENARIO[documentTemplate] || SCENARIO_IDS.CUSTOM;
}

export function mapScenarioToDocumentTemplate(scenarioId) {
  const scenario = getAddresseeScenario(scenarioId);
  return scenario.documentTemplate || DOCUMENT_TEMPLATE_BUSINESS_LETTER;
}

export function resolveAddresseeScenario(input = {}) {
  const scenarioId = getId(input.scenario || input.scenarioId);
  if (scenarioId) return getAddresseeScenario(scenarioId);

  const documentTemplate = input.documentTemplate || input.format?.documentTemplate;
  return getAddresseeScenario(mapDocumentTemplateToScenario(documentTemplate));
}

export function resolveAddresseeProfile(input = {}) {
  const profileId = getId(input.profile || input.profileId);
  if (profileId) return getAddresseeProfile(profileId);

  const scenario = input.scenario && typeof input.scenario === 'object'
    ? input.scenario
    : resolveAddresseeScenario(input);

  return getAddresseeProfile(scenario?.profileId || DEFAULT_ADDRESSEE_PROFILE_ID);
}
