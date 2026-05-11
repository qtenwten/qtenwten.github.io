import {
  DOCUMENT_TEMPLATE_APPLICATION,
  DOCUMENT_TEMPLATE_COMPLAINT,
  DOCUMENT_TEMPLATE_REQUEST,
  DOCUMENT_TEMPLATE_MEMO,
  DOCUMENT_TEMPLATE_BUSINESS_LETTER,
} from './addresseeTypes.js';

import {
  PROFILE_IDS,
  SCENARIO_IDS,
} from './addresseeProfiles.js';

export const PACK_IDS = {
  SCHOOL_DIRECTOR_APPLICATION: 'school-director-application',
  EMPLOYER_APPLICATION: 'employer-application',
  MANAGEMENT_COMPANY_APPLICATION: 'management-company-application',
  ADMINISTRATION_APPLICATION: 'administration-application',
  COMPLAINT_TO_ORGANIZATION: 'complaint-to-organization',
  REQUEST_TO_ORGANIZATION: 'request-to-organization',
  MEMO_TO_MANAGER: 'memo-to-manager',
  BUSINESS_LETTER_TO_PARTNER: 'business-letter-to-partner',
};

export const ADDRESSEE_DOC_PACKS = [
  {
    id: PACK_IDS.SCHOOL_DIRECTOR_APPLICATION,
    documentTemplate: DOCUMENT_TEMPLATE_APPLICATION,
    profileId: PROFILE_IDS.RU_OFFICIAL_STANDARD,
    scenarioId: SCENARIO_IDS.APPLICATION,
    premiumHookLabelKey: 'addresseeGenerator.addressee.packs.school-director-application.hook',
    pack: {
      ru: {
        title: 'Заявление директору школы',
        shortDescription: 'Заявление на имя руководителя образовательного учреждения',
        recipientHint: 'Руководитель школы, гимназии, лицея или детского сада',
        senderHint: 'Родитель или законный представитель ребёнка',
        bodyPlaceholder: 'Прошу рассмотреть заявление и принять решение по вопросу организации учебного процесса.',
      },
      en: {
        title: 'School Director Application',
        shortDescription: 'Application to the head of an educational institution',
        recipientHint: 'School principal, gymnasium, lyceum or kindergarten director',
        senderHint: 'Parent or legal guardian',
        bodyPlaceholder: 'Please consider this application and make a decision regarding the organization of the educational process.',
      },
    },
  },
  {
    id: PACK_IDS.EMPLOYER_APPLICATION,
    documentTemplate: DOCUMENT_TEMPLATE_APPLICATION,
    profileId: PROFILE_IDS.RU_OFFICIAL_STANDARD,
    scenarioId: SCENARIO_IDS.APPLICATION,
    premiumHookLabelKey: 'addresseeGenerator.addressee.packs.employer-application.hook',
    pack: {
      ru: {
        title: 'Заявление работодателю',
        shortDescription: 'Заявление на имя руководителя организации-работодателя',
        recipientHint: 'Директор, генеральный директор или руководитель организации',
        senderHint: 'Сотрудник или соискатель',
        bodyPlaceholder: 'Прошу рассмотреть заявление и принять решение по вопросу трудоустройства или условий работы.',
      },
      en: {
        title: 'Employer Application',
        shortDescription: 'Application to the employer organization head',
        recipientHint: 'Director, CEO or organization head',
        senderHint: 'Employee or job applicant',
        bodyPlaceholder: 'Please consider this application regarding employment or working conditions.',
      },
    },
  },
  {
    id: PACK_IDS.MANAGEMENT_COMPANY_APPLICATION,
    documentTemplate: DOCUMENT_TEMPLATE_APPLICATION,
    profileId: PROFILE_IDS.RU_OFFICIAL_STANDARD,
    scenarioId: SCENARIO_IDS.APPLICATION,
    premiumHookLabelKey: 'addresseeGenerator.addressee.packs.management-company-application.hook',
    pack: {
      ru: {
        title: 'Заявление в управляющую компанию',
        shortDescription: 'Заявление руководству управляющей компании или ТСЖ',
        recipientHint: 'Директор управляющей компании или председатель ТСЖ',
        senderHint: 'Собственник или арендатор жилья',
        bodyPlaceholder: 'Прошу рассмотреть заявление по вопросу содержания и ремонта многоквартирного дома.',
      },
      en: {
        title: 'Management Company Application',
        shortDescription: 'Application to management company or housing cooperative',
        recipientHint: 'Management company director or HOA chairman',
        senderHint: 'Property owner or tenant',
        bodyPlaceholder: 'Please consider this application regarding maintenance and repair of the apartment building.',
      },
    },
  },
  {
    id: PACK_IDS.ADMINISTRATION_APPLICATION,
    documentTemplate: DOCUMENT_TEMPLATE_APPLICATION,
    profileId: PROFILE_IDS.RU_OFFICIAL_STANDARD,
    scenarioId: SCENARIO_IDS.APPLICATION,
    premiumHookLabelKey: 'addresseeGenerator.addressee.packs.administration-application.hook',
    pack: {
      ru: {
        title: 'Заявление в администрацию',
        shortDescription: 'Заявление главе местной администрации или муниципального образования',
        recipientHint: 'Глава администрации, глава муниципального образования или их заместители',
        senderHint: 'Житель муниципального образования',
        bodyPlaceholder: 'Прошу рассмотреть заявление и принять решение по вопросу, относящемуся к компетенции администрации.',
      },
      en: {
        title: 'Administration Application',
        shortDescription: 'Application to local government administration',
        recipientHint: 'Administration head, municipal head or deputy heads',
        senderHint: 'Municipal resident',
        bodyPlaceholder: 'Please consider this application regarding matters within the administration competence.',
      },
    },
  },
  {
    id: PACK_IDS.COMPLAINT_TO_ORGANIZATION,
    documentTemplate: DOCUMENT_TEMPLATE_COMPLAINT,
    profileId: PROFILE_IDS.RU_OFFICIAL_STANDARD,
    scenarioId: SCENARIO_IDS.COMPLAINT,
    premiumHookLabelKey: 'addresseeGenerator.addressee.packs.complaint-to-organization.hook',
    pack: {
      ru: {
        title: 'Жалоба в организацию',
        shortDescription: 'Жалоба на действия или бездействие организации',
        recipientHint: 'Руководитель организации или уполномоченный представитель',
        senderHint: 'Заявитель, чьи права были нарушены',
        bodyPlaceholder: 'Прошу рассмотреть жалобу и принять меры по устранению нарушений и восстановлению моих прав.',
      },
      en: {
        title: 'Complaint to Organization',
        shortDescription: 'Complaint against organization actions or inaction',
        recipientHint: 'Organization head or authorized representative',
        senderHint: 'Complainant whose rights were violated',
        bodyPlaceholder: 'Please consider this complaint and take measures to eliminate violations and restore my rights.',
      },
    },
  },
  {
    id: PACK_IDS.REQUEST_TO_ORGANIZATION,
    documentTemplate: DOCUMENT_TEMPLATE_REQUEST,
    profileId: PROFILE_IDS.RU_OFFICIAL_STANDARD,
    scenarioId: SCENARIO_IDS.REQUEST,
    premiumHookLabelKey: 'addresseeGenerator.addressee.packs.request-to-organization.hook',
    pack: {
      ru: {
        title: 'Запрос в организацию',
        shortDescription: 'Запрос информации или документов у организации',
        recipientHint: 'Руководитель или специалист организации',
        senderHint: 'Заинтересованное лицо',
        bodyPlaceholder: 'Прошу предоставить информацию или документы по следующему вопросу.',
      },
      en: {
        title: 'Request to Organization',
        shortDescription: 'Request for information or documents from organization',
        recipientHint: 'Organization head or specialist',
        senderHint: 'Interested party',
        bodyPlaceholder: 'Please provide information or documents regarding the following matter.',
      },
    },
  },
  {
    id: PACK_IDS.MEMO_TO_MANAGER,
    documentTemplate: DOCUMENT_TEMPLATE_MEMO,
    profileId: PROFILE_IDS.RU_OFFICIAL_STANDARD,
    scenarioId: SCENARIO_IDS.MEMO,
    premiumHookLabelKey: 'addresseeGenerator.addressee.packs.memo-to-manager.hook',
    pack: {
      ru: {
        title: 'Служебная записка руководителю',
        shortDescription: 'Служебная записка директору или руководителю подразделения',
        recipientHint: 'Директор, руководитель отдела или подразделения',
        senderHint: 'Сотрудник организации',
        bodyPlaceholder: 'Довожу до вашего сведения информацию о текущей ситуации и предлагаю варианты решения.',
      },
      en: {
        title: 'Memo to Manager',
        shortDescription: 'Memo to director or department head',
        recipientHint: 'Director, department or division head',
        senderHint: 'Organization employee',
        bodyPlaceholder: 'I bring to your attention information about the current situation and propose solutions.',
      },
    },
  },
  {
    id: PACK_IDS.BUSINESS_LETTER_TO_PARTNER,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
    profileId: PROFILE_IDS.RU_SIMPLE_BUSINESS,
    scenarioId: SCENARIO_IDS.BUSINESS_LETTER,
    premiumHookLabelKey: 'addresseeGenerator.addressee.packs.business-letter-to-partner.hook',
    pack: {
      ru: {
        title: 'Деловое письмо партнёру',
        shortDescription: 'Деловое письмо деловому партнёру или контрагенту',
        recipientHint: 'Руководитель компании-партнёра или уполномоченное лицо',
        senderHint: 'Представитель вашей компании',
        bodyPlaceholder: 'Направляю вам письмо по вопросу сотрудничества и надеюсь на дальнейшее взаимовыгодное партнёрство.',
      },
      en: {
        title: 'Business Letter to Partner',
        shortDescription: 'Business letter to partner or contractor',
        recipientHint: 'Partner company head or authorized person',
        senderHint: 'Your company representative',
        bodyPlaceholder: 'I send you this letter regarding cooperation and hope for further mutually beneficial partnership.',
      },
    },
  },
];

export function getDocPack(packId) {
  return ADDRESSEE_DOC_PACKS.find(p => p.id === packId) || null;
}

export function getDocPackByScenario(scenarioId) {
  return ADDRESSEE_DOC_PACKS.find(p => p.scenarioId === scenarioId) || null;
}

export function getAllPackIds() {
  return ADDRESSEE_DOC_PACKS.map(p => p.id);
}

export function validatePackIntegrity() {
  const errors = [];
  const ids = new Set();

  for (const pack of ADDRESSEE_DOC_PACKS) {
    if (ids.has(pack.id)) {
      errors.push(`Duplicate pack id: ${pack.id}`);
    }
    ids.add(pack.id);

    if (!pack.documentTemplate) {
      errors.push(`Pack ${pack.id}: missing documentTemplate`);
    }
    if (!pack.profileId) {
      errors.push(`Pack ${pack.id}: missing profileId`);
    }
    if (!pack.scenarioId) {
      errors.push(`Pack ${pack.id}: missing scenarioId`);
    }

    for (const lang of ['ru', 'en']) {
      const content = pack.pack[lang];
      if (!content) {
        errors.push(`Pack ${pack.id}: missing ${lang} content`);
        continue;
      }
      if (!content.title) errors.push(`Pack ${pack.id} (${lang}): missing title`);
      if (!content.shortDescription) errors.push(`Pack ${pack.id} (${lang}): missing shortDescription`);
      if (!content.recipientHint) errors.push(`Pack ${pack.id} (${lang}): missing recipientHint`);
      if (!content.senderHint) errors.push(`Pack ${pack.id} (${lang}): missing senderHint`);
      if (!content.bodyPlaceholder) errors.push(`Pack ${pack.id} (${lang}): missing bodyPlaceholder`);
    }
  }

  return errors;
}

export function getPackLabelKey(packId, language = 'ru') {
  const pack = getDocPack(packId);
  if (!pack) return null;
  return `addresseeGenerator.packs.${pack.id}.label`;
}

export function getPackDescriptionKey(packId, language = 'ru') {
  const pack = getDocPack(packId);
  if (!pack) return null;
  return `addresseeGenerator.packs.${pack.id}.description`;
}