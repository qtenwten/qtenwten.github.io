export const GENRE_BODY_PLACEHOLDERS = {
  application: [
    'Прошу рассмотреть настоящее заявление и принять решение по изложенному вопросу.',
    '[Кратко изложите суть заявления: что именно вы просите, на каком основании и какие документы прилагаете.]',
  ],

  complaint: [
    'Прошу рассмотреть настоящую жалобу и принять меры по изложенным обстоятельствам.',
    '[Опишите обстоятельства: даты, действия или бездействие, которые вы считаете нарушением. Укажите, какой результат вы ожидаете.]',
  ],

  request: [
    'Прошу предоставить информацию или документы по следующему вопросу.',
    '[Укажите, какую информацию, документы или действие вы запрашиваете, а также желаемый способ и срок получения ответа.]',
  ],

  memo: [
    'Довожу до вашего сведения следующую информацию.',
    '[Кратко изложите основание, проблему, предложение или просьбу. При необходимости укажите срок исполнения и ответственного.]',
  ],

  businessLetter: [
    'Направляем вам настоящее письмо по следующему вопросу.',
    '[Изложите цель письма, обстоятельства, предложение или просьбу. Укажите ожидаемое действие или срок ответа.]',
  ],

  custom: [
    '[Введите основной текст документа.]',
  ],

  explanatoryNote: [
    'По существу указанной ситуации сообщаю следующее.',
    '[Опишите обстоятельства, даты и подтверждающие материалы.]',
  ],

  commercialOffer: [
    'Предлагаем рассмотреть условия сотрудничества по указанному направлению.',
    '[Опишите товар или услугу, стоимость, сроки, условия оплаты и контакты.]',
  ],

  order: [
    'Настоящий проект приказа подготовлен для внутреннего оформления решения.',
    '[Укажите содержание поручения, ответственных лиц, сроки и основание.]',
  ],

  powerOfAttorney: [
    'Настоящий текст является редактируемой заготовкой доверенности для дальнейшего заполнения.',
    '[Укажите представителя, перечень полномочий, срок действия и реквизиты документов.]',
  ],
};

export const GENRE_SENSITIVE_NOTE =
  'Примечание для редактирования: это заготовка, а не юридическая консультация. Перед отправкой проверьте факты, реквизиты и формулировки.';

export const GENRE_LEGAL_NOTE =
  'Примечание для редактирования: это заготовка, а не юридическая консультация. Перед использованием проверьте требования к форме документа.';

export const FORBIDDEN_LEGAL_WORDS = [
  'гарантированно',
  'обязаны принять',
  'юридическая консультация',
  'юридический совет',
  'суд обязан',
  'гарантия',
  '100%',
  'без ошибок',
  'без исключений',
];

export function containsForbiddenLegalWords(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return FORBIDDEN_LEGAL_WORDS.some(word => lower.includes(word));
}

export function formatSignatureName(fullName, style = 'surnameInitials') {
  if (!fullName || typeof fullName !== 'string') return '';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];

  const surname = parts[0];
  const name = parts[1] || '';
  const patronymic = parts[2] || '';

  const nameInitial = name ? ` ${name.charAt(0).toUpperCase()}.` : '';
  const patronymicInitial = patronymic ? `${patronymic.charAt(0).toUpperCase()}.` : '';

  if (style === 'surnameInitials') {
    return `${surname}${nameInitial}${patronymicInitial}`;
  }

  if (style === 'initialsSurname') {
    return `${nameInitial}${patronymicInitial} ${surname}`;
  }

  return `${surname} ${name} ${patronymic}`;
}

export function buildSignatureDisplay(senderFullName, documentTemplate) {
  const hasSender = senderFullName && senderFullName.trim();

  if (!hasSender) {
    return {
      shortSignature: '/Фамилия И.О./',
      fullSignature: '/Фамилия И.О./',
      dateLine: '"_" __________ 20 г.',
    };
  }

  const shortSig = formatSignatureName(senderFullName, 'surnameInitials');
  const styledSig = `/${shortSig}/`;

  const dateLine = '"_" __________ 20 г.';

  return {
    shortSignature: shortSig,
    fullSignature: styledSig,
    dateLine,
  };
}

export function getSalutationPolicy(documentTemplate) {
  const policyMap = {
    application: { includeByDefault: true, allowUserOverride: true },
    complaint: { includeByDefault: true, allowUserOverride: true },
    request: { includeByDefault: true, allowUserOverride: true },
    memo: { includeByDefault: true, allowUserOverride: true },
    businessLetter: { includeByDefault: true, allowUserOverride: true },
    explanatoryNote: { includeByDefault: true, allowUserOverride: true },
    powerOfAttorney: { includeByDefault: false, allowUserOverride: false },
    order: { includeByDefault: false, allowUserOverride: false },
    commercialOffer: { includeByDefault: true, allowUserOverride: true },
    custom: { includeByDefault: false, allowUserOverride: true },
  };

  return policyMap[documentTemplate] || policyMap.custom;
}

export function getSensitiveNote(documentTemplate) {
  const sensitiveTemplates = ['application', 'complaint', 'explanatoryNote', 'powerOfAttorney'];
  return sensitiveTemplates.includes(documentTemplate) ? GENRE_LEGAL_NOTE : null;
}

export function getDocumentTitle(documentTemplate, t) {
  const titleMap = {
    application: 'ЗАЯВЛЕНИЕ',
    complaint: 'ЖАЛОБА',
    request: 'ЗАПРОС',
    memo: 'СЛУЖЕБНАЯ ЗАПИСКА',
    businessLetter: null,
    explanatoryNote: 'ОБЪЯСНИТЕЛЬНАЯ ЗАПИСКА',
    powerOfAttorney: 'ДОВЕРЕННОСТЬ',
    commercialOffer: 'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ',
    order: 'ПРИКАЗ',
    custom: null,
  };

  if (titleMap[documentTemplate] !== undefined) {
    return titleMap[documentTemplate];
  }

  return null;
}

export function getCleanBodyPlaceholders(documentTemplate) {
  const map = {
    application: GENRE_BODY_PLACEHOLDERS.application,
    complaint: GENRE_BODY_PLACEHOLDERS.complaint,
    request: GENRE_BODY_PLACEHOLDERS.request,
    memo: GENRE_BODY_PLACEHOLDERS.memo,
    businessLetter: GENRE_BODY_PLACEHOLDERS.businessLetter,
    explanatoryNote: GENRE_BODY_PLACEHOLDERS.explanatoryNote,
    commercialOffer: GENRE_BODY_PLACEHOLDERS.commercialOffer,
    order: GENRE_BODY_PLACEHOLDERS.order,
    powerOfAttorney: GENRE_BODY_PLACEHOLDERS.powerOfAttorney,
    custom: GENRE_BODY_PLACEHOLDERS.custom,
  };

  return map[documentTemplate] || GENRE_BODY_PLACEHOLDERS.custom;
}
