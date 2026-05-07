import {
  GENDER_MALE,
  GENDER_FEMALE,
  GENDER_UNKNOWN,
  GREETING_NAME_PATRONYMIC,
  GREETING_FULL_NAME,
  GREETING_COLLEAGUES,
  PUNCTUATION_EXCLAMATION,
  CONJUNCTION_BY_GENDER,
  COLLEAGUES_GREETING,
  WARNING_CODES,
  UNDECLINABLE_SUFFIXES,
  KNOWN_UNDECLINABLE_SURNAMES,
  COMMON_MALE_NAMES,
  COMMON_FEMALE_NAMES,
  ABBREVIATION_PATTERNS,
  POSITION_DICTIONARY,
  DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  DOCUMENT_TEMPLATE_APPLICATION,
  DOCUMENT_TEMPLATE_COMPLAINT,
  DOCUMENT_TEMPLATE_REQUEST,
  DOCUMENT_TEMPLATE_MEMO,
  DOCUMENT_TEMPLATE_EXPLANATORY_NOTE,
  DOCUMENT_TEMPLATE_POWER_OF_ATTORNEY,
  DOCUMENT_TEMPLATE_COMMERCIAL_OFFER,
  DOCUMENT_TEMPLATE_ORDER,
} from './addresseeTypes.js';

import {
  declineRussianFullName,
  parseRussianFullName,
  isRiskyNameForDeclension,
  CASE_DATIVE,
  CASE_GENITIVE,
} from './addresseeNameCases.js';

function splitFullName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return [];
  }
  return fullName.trim().split(/\s+/).filter(Boolean);
}

function parseFullName(fullName) {
  const parts = splitFullName(fullName);
  return {
    surname: parts[0] || '',
    name: parts[1] || '',
    patronymic: parts[2] || '',
    extraParts: parts.slice(3),
  };
}

function getExtraPartsMessage(extraParts) {
  if (extraParts.length === 0) return '';
  return ` Дополнительные части: "${extraParts.join(' ')}".`;
}

function hasInitials(fullName) {
  return /[A-Za-zА-Яа-яё]\.\s*[A-Za-zА-Яа-яё]\./i.test(fullName);
}

function hasHyphenatedPart(fullName) {
  const parts = splitFullName(fullName);
  return parts.some((part) => part.includes('-'));
}

function isFullyLatin(fullName) {
  const cyrillic = /[а-яёА-ЯЁ]/;
  return fullName && !cyrillic.test(fullName) && /[a-zA-Z]/.test(fullName);
}

function normalizeNamePart(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isKnownMaleName(value) {
  return COMMON_MALE_NAMES.includes(normalizeNamePart(value));
}

function isKnownFemaleName(value) {
  return COMMON_FEMALE_NAMES.includes(normalizeNamePart(value));
}

function isKnownFirstName(value) {
  return isKnownMaleName(value) || isKnownFemaleName(value);
}

function detectGenderByName(value) {
  if (isKnownMaleName(value)) return GENDER_MALE;
  if (isKnownFemaleName(value)) return GENDER_FEMALE;
  return GENDER_UNKNOWN;
}

function hasUndeclinableSuffix(surname) {
  if (!surname) return false;
  const lower = normalizeNamePart(surname);
  return UNDECLINABLE_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}

function isShortForeignSurnameCandidate(surname) {
  const lower = normalizeNamePart(surname);
  return /^[а-яё]{1,2}$/.test(lower);
}

function isPotentiallyUndeclinableSurname(surname) {
  const lower = normalizeNamePart(surname);
  if (!lower) return false;
  return (
    hasUndeclinableSuffix(lower) ||
    KNOWN_UNDECLINABLE_SURNAMES.includes(lower) ||
    isShortForeignSurnameCandidate(lower)
  );
}

function isAbbreviatedOrganization(organization) {
  if (!organization || typeof organization !== 'string') return false;
  return ABBREVIATION_PATTERNS.some((pattern) => pattern.test(organization.trim()));
}

function expandIPOrganization(organization) {
  if (!organization || typeof organization !== 'string') return organization;
  const trimmed = organization.trim();
  if (/^ИП$/i.test(trimmed)) {
    return 'Индивидуальному предпринимателю';
  }
  return organization;
}

function declinePosition(position) {
  if (!position || typeof position !== 'string') return { declined: position, warned: false };
  const lower = position.trim().toLowerCase();
  const found = POSITION_DICTIONARY[lower];
  if (found) {
    return { declined: found, warned: false };
  }
  return { declined: position, warned: true };
}

function getIncompleteNameMessage(fullName, parsedName, nameParts) {
  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    return 'Не указано ФИО получателя.';
  }

  if (nameParts.length === 1) {
    const token = parsedName.surname;
    if (isKnownFirstName(token)) {
      return `ФИО указано не полностью: введено только имя "${token}". Добавьте фамилию и отчество или проверьте обращение вручную.`;
    }
    return 'ФИО указано не полностью: указан только один элемент вместо фамилии, имени и отчества.';
  }

  if (!parsedName.name) {
    return 'ФИО указано не полностью: отсутствует имя.';
  }

  if (!parsedName.patronymic) {
    return 'ФИО указано не полностью: отсутствует отчество.';
  }

  return 'ФИО указано не полностью. Проверьте фамилию, имя и отчество вручную.';
}

function getGreetingParsedName(parsedName, nameParts) {
  if (nameParts.length === 1 && isKnownFirstName(parsedName.surname)) {
    return { surname: '', name: parsedName.surname, patronymic: '' };
  }
  return parsedName;
}

function buildGreeting(parsedName, gender, greetingMode, punctuation, autoDetectedGender = '') {
  const punct = punctuation === PUNCTUATION_EXCLAMATION ? '!' : ',';

  if (greetingMode === GREETING_COLLEAGUES) {
    return COLLEAGUES_GREETING + punct;
  }

  let conjunction = CONJUNCTION_BY_GENDER[gender] || 'Здравствуйте';
  if (gender === GENDER_UNKNOWN && autoDetectedGender && autoDetectedGender !== GENDER_UNKNOWN) {
    const detectedConjunction = CONJUNCTION_BY_GENDER[autoDetectedGender];
    if (detectedConjunction) {
      conjunction = `${CONJUNCTION_BY_GENDER[GENDER_UNKNOWN]}, ${detectedConjunction.toLowerCase()}`;
    }
  }
  const { name, patronymic } = parsedName;

  if (greetingMode === GREETING_NAME_PATRONYMIC) {
    if (name && patronymic) {
      return `${conjunction} ${name} ${patronymic}${punct}`;
    }
    if (name) {
      return `${conjunction} ${name}${punct}`;
    }
    return `${conjunction}${punct}`;
  }

  if (greetingMode === GREETING_FULL_NAME) {
    const { surname } = parsedName;
    if (surname && name && patronymic) {
      return `${conjunction} ${surname} ${name} ${patronymic}${punct}`;
    }
    if (surname && name) {
      return `${conjunction} ${surname} ${name}${punct}`;
    }
    if (surname) {
      return `${conjunction} ${surname}${punct}`;
    }
    return `${conjunction}${punct}`;
  }

  return `${conjunction}${punct}`;
}

function buildToBlock(organization, position, fullName, gender, recipientDativeName) {
  const lines = [];
  const warnings = [];

  if (organization) {
    const orgAbbreviated = isAbbreviatedOrganization(organization);
    const expandedOrg = expandIPOrganization(organization);
    lines.push(expandedOrg);
    if (orgAbbreviated) {
      warnings.push({
        code: WARNING_CODES.ORGANIZATION_ABBREVIATION,
        message: `Организация "${organization}" содержит аббревиатуру. Проверьте, что форма обращения подходит для документа.`,
      });
    }
  }

  const { declined: declinedPosition, warned: positionWarned } = declinePosition(position);
  if (position) {
    lines.push(positionWarned ? declinedPosition : declinedPosition);
    if (positionWarned) {
      warnings.push({
        code: WARNING_CODES.UNKNOWN_POSITION,
        message: `Должность "${position}" не найдена в словаре. Дательную форму нужно проверить вручную.`,
      });
    }
  }

  const parsedName = parseFullName(fullName);
  const nameParts = splitFullName(fullName);
  const hasExtraParts = parsedName.extraParts && parsedName.extraParts.length > 0;
  const hasInitialsFlag = hasInitials(fullName);
  const hasHyphenatedFlag = hasHyphenatedPart(fullName);
  const isLatinFlag = isFullyLatin(fullName);
  const isRisky = isRiskyNameForDeclension(parsedName, gender, hasInitialsFlag, hasHyphenatedFlag, isLatinFlag);

  if (recipientDativeName && recipientDativeName.trim()) {
    lines.push(recipientDativeName);
    warnings.push({
      code: WARNING_CODES.NAME_CASE_MANUAL,
      message: 'ФИО адресата в дательном падеже указано вручную.',
    });
  } else if (hasExtraParts) {
    const allParts = [parsedName.surname, parsedName.name, parsedName.patronymic].filter(Boolean);
    allParts.push(...parsedName.extraParts);
    lines.push(allParts.join(' '));
    if (!isRisky) {
      warnings.push({
        code: WARNING_CODES.NAME_CASE_UNCERTAIN,
        message: 'Автоматическое склонение ФИО не применяется (рискованное имя). Проверьте вручную.',
      });
    }
  } else if (parsedName.surname && parsedName.name && parsedName.patronymic) {
    if (isRisky) {
      lines.push(`${parsedName.surname} ${parsedName.name} ${parsedName.patronymic}`);
      warnings.push({
        code: WARNING_CODES.NAME_CASE_UNCERTAIN,
        message: 'Автоматическое склонение ФИО не применяется (рискованное имя). Проверьте вручную.',
      });
    } else {
      const { declined, warned: declWarned, reason } = declineRussianFullName(fullName, gender, CASE_DATIVE);
      if (declWarned) {
        lines.push(`${parsedName.surname} ${parsedName.name} ${parsedName.patronymic}`);
        warnings.push({
          code: WARNING_CODES.NAME_CASE_UNCERTAIN,
          message: `Автоматическое склонение не удалось: ${reason}. Проверьте вручную.`,
        });
      } else {
        lines.push(declined);
      }
    }
  } else if (parsedName.surname && parsedName.name) {
    lines.push(`${parsedName.surname} ${parsedName.name}`);
  } else if (fullName) {
    lines.push(fullName);
  }

  return {
    block: lines.join('\n'),
    warnings,
    parsedName,
  };
}

function buildFromBlock(senderFullName, senderPosition, senderOrganization, senderGenitiveName) {
  const lines = [];
  const warnings = [];

  if (senderGenitiveName && senderGenitiveName.trim()) {
    lines.push(`от ${senderGenitiveName}`);
    warnings.push({
      code: WARNING_CODES.NAME_CASE_MANUAL,
      message: 'ФИО отправителя в родительном падеже указано вручную.',
    });
  } else if (senderFullName) {
    const parsedSenderName = parseFullName(senderFullName);
    const senderNameParts = splitFullName(senderFullName);
    const senderHasExtraParts = parsedSenderName.extraParts && parsedSenderName.extraParts.length > 0;
    const senderHasInitials = hasInitials(senderFullName);
    const senderHasHyphenated = hasHyphenatedPart(senderFullName);
    const senderIsLatin = isFullyLatin(senderFullName);
    const senderGender = detectGenderByName(parsedSenderName.name || parsedSenderName.surname);
    const senderIsRisky = isRiskyNameForDeclension(parsedSenderName, senderGender, senderHasInitials, senderHasHyphenated, senderIsLatin);

    if (senderIsRisky) {
      lines.push(`от ${senderFullName}`);
      warnings.push({
        code: WARNING_CODES.NAME_CASE_UNCERTAIN,
        message: 'Автоматическое склонение ФИО отправителя не применяется (рискованное имя). Проверьте вручную.',
      });
    } else if (senderHasExtraParts) {
      lines.push(`от ${senderFullName}`);
      warnings.push({
        code: WARNING_CODES.NAME_CASE_UNCERTAIN,
        message: 'Автоматическое склонение ФИО отправителя не применяется (рискованное имя). Проверьте вручную.',
      });
    } else if (parsedSenderName.surname && parsedSenderName.name && parsedSenderName.patronymic) {
      const { declined, warned: declWarned, reason } = declineRussianFullName(senderFullName, senderGender, CASE_GENITIVE);
      if (declWarned) {
        lines.push(`от ${senderFullName}`);
        warnings.push({
          code: WARNING_CODES.NAME_CASE_UNCERTAIN,
          message: `Автоматическое склонение ФИО отправителя не удалось: ${reason}. Проверьте вручную.`,
        });
      } else {
        lines.push(`от ${declined}`);
      }
    } else {
      lines.push(`от ${senderFullName}`);
    }
  }

  if (senderPosition) {
    lines.push(senderPosition);
  }

  if (senderOrganization) {
    lines.push(senderOrganization);
  }

  return {
    block: lines.join('\n'),
    warnings,
  };
}

function buildDocumentText({ template, to, from, greeting, fullName, position, organization }) {
  const safeTemplate = template || DOCUMENT_TEMPLATE_BUSINESS_LETTER;

  if (safeTemplate === DOCUMENT_TEMPLATE_APPLICATION) {
    return [
      to,
      '',
      from,
      '',
      'Заявление',
      '',
      'Прошу рассмотреть обращение по указанному вопросу.',
    ].filter(Boolean).join('\n');
  }

  if (safeTemplate === DOCUMENT_TEMPLATE_POWER_OF_ATTORNEY) {
    return [
      'Доверенность',
      '',
      to,
      '',
      from,
      '',
      'Настоящая доверенность подготовлена как черновой текстовый блок. Перед использованием проверьте данные и формулировки вручную.',
    ].filter(Boolean).join('\n');
  }

  if (safeTemplate === DOCUMENT_TEMPLATE_ORDER) {
    return [
      'Приказ',
      '',
      to,
      '',
      'О подготовке документа',
      '',
      'Настоящий блок является черновиком для подготовки приказа и требует проверки ответственным сотрудником.',
    ].filter(Boolean).join('\n');
  }

  if (safeTemplate === DOCUMENT_TEMPLATE_MEMO) {
    return [
      'Служебная записка',
      '',
      to,
      '',
      from,
      '',
      greeting,
      '',
      'Прошу принять к сведению указанную информацию.',
    ].filter(Boolean).join('\n');
  }

  if (safeTemplate === DOCUMENT_TEMPLATE_COMPLAINT) {
    return [
      'Жалоба',
      '',
      to,
      '',
      from,
      '',
      greeting,
      '',
      'Настоящим выражаю недовольство качеством услуги/работы.',
      'Прошу рассмотреть обращение и принять меры.',
    ].filter(Boolean).join('\n');
  }

  if (safeTemplate === DOCUMENT_TEMPLATE_REQUEST) {
    return [
      'Запрос',
      '',
      to,
      '',
      from,
      '',
      greeting,
      '',
      'Прошу предоставить информацию по указанному вопросу.',
    ].filter(Boolean).join('\n');
  }

  if (safeTemplate === DOCUMENT_TEMPLATE_EXPLANATORY_NOTE) {
    return [
      'Объяснительная записка',
      '',
      to,
      '',
      from,
      '',
      greeting,
      '',
      'По существу изложенного сообщаю следующее.',
    ].filter(Boolean).join('\n');
  }

  if (safeTemplate === DOCUMENT_TEMPLATE_COMMERCIAL_OFFER) {
    return [
      'Коммерческое предложение',
      '',
      to,
      '',
      from,
      '',
      greeting,
      '',
      'Предлагаю вашему вниманию условия сотрудничества.',
    ].filter(Boolean).join('\n');
  }

  return [to, '', greeting, ''].filter(Boolean).join('\n');
}

export function formatAddressee(input) {
  const {
    fullName = '',
    position = '',
    organization = '',
    gender = GENDER_UNKNOWN,
    greetingMode = GREETING_NAME_PATRONYMIC,
    punctuation = PUNCTUATION_EXCLAMATION,
    documentTemplate = DOCUMENT_TEMPLATE_BUSINESS_LETTER,
    senderFullName = '',
    senderPosition = '',
    senderOrganization = '',
    recipientDativeName = '',
    senderGenitiveName = '',
  } = input || {};

  const warnings = [];
  const parsedName = parseFullName(fullName);
  const nameParts = splitFullName(fullName);
  const singleKnownFirstName = nameParts.length === 1 && isKnownFirstName(parsedName.surname);
  const nameForGenderDetection = parsedName.name || (singleKnownFirstName ? parsedName.surname : '');
  const autoDetectedGender = gender === GENDER_UNKNOWN ? detectGenderByName(nameForGenderDetection) : GENDER_UNKNOWN;

  if (!fullName || fullName.trim() === '') {
    warnings.push({
      code: WARNING_CODES.INCOMPLETE_NAME,
      message: getIncompleteNameMessage(fullName, parsedName, nameParts),
    });
  } else if (!parsedName.name || !parsedName.patronymic) {
    warnings.push({
      code: WARNING_CODES.INCOMPLETE_NAME,
      message: getIncompleteNameMessage(fullName, parsedName, nameParts),
    });
  }

  if (nameParts.length > 3) {
    const extraMsg = getExtraPartsMessage(parsedName.extraParts);
    warnings.push({
      code: WARNING_CODES.EXTRA_NAME_PARTS,
      message: 'ФИО содержит больше трёх частей. Проверьте порядок фамилии, имени и отчества вручную.' + extraMsg,
    });
  }

  if (gender === GENDER_UNKNOWN) {
    warnings.push({
      code: WARNING_CODES.UNKNOWN_GENDER,
      message: 'Пол не указан. Обращение требует ручной проверки.',
    });
    if (autoDetectedGender !== GENDER_UNKNOWN) {
      warnings.push({
        code: WARNING_CODES.AUTO_DETECTED_GENDER,
        message: 'Род обращения определён автоматически по имени и требует проверки.',
      });
    }
  }

  if (isFullyLatin(fullName)) {
    warnings.push({
      code: WARNING_CODES.LATIN_NAME,
      message: 'Имя написано латиницей. Автоматическое склонение не применяется. Проверьте результат вручную.',
    });
  }

  if (/[a-zA-Z]/.test(fullName) && /[а-яёА-ЯЁ]/.test(fullName)) {
    warnings.push({
      code: WARNING_CODES.LATIN_NAME,
      message: 'ФИО содержит буквы разных алфавитов. Проверьте написание вручную.',
    });
  }

  if (hasInitials(fullName)) {
    warnings.push({
      code: WARNING_CODES.INITIALS_DETECTED,
      message: 'В ФИО есть инициалы. Склонение и обращение могут быть неточными.',
    });
  }

  if (hasHyphenatedPart(fullName)) {
    warnings.push({
      code: WARNING_CODES.HYPHENATED_NAME_REVIEW,
      message: 'В имени или фамилии есть дефис. Проверьте порядок и форму вручную.',
    });
  }

  if (parsedName.surname && isPotentiallyUndeclinableSurname(parsedName.surname)) {
    warnings.push({
      code: WARNING_CODES.UNDECLINABLE_SURNAME,
      message: `Фамилия "${parsedName.surname}" может быть несклоняемой или спорной. Рекомендуется проверить вручную.`,
    });
  }

  const toResult = buildToBlock(organization, position, fullName, gender, recipientDativeName);
  warnings.push(...toResult.warnings);

  const fromResult = buildFromBlock(senderFullName, senderPosition, senderOrganization, senderGenitiveName);
  warnings.push(...fromResult.warnings);

  let greeting = '';
  try {
    greeting = buildGreeting(getGreetingParsedName(parsedName, nameParts), gender, greetingMode, punctuation, autoDetectedGender);
  } catch {
    greeting = `Здравствуйте${punctuation === PUNCTUATION_EXCLAMATION ? '!' : ','}`;
    warnings.push({
      code: WARNING_CODES.INCOMPLETE_NAME,
      message: 'Не удалось сформировать обращение. Проверьте введённые данные.',
    });
  }

  const letterBlock = [toResult.block, '', greeting, ''].join('\n').trim();
  const documentText = buildDocumentText({
    template: documentTemplate,
    to: toResult.block,
    from: fromResult.block,
    greeting,
    fullName,
    position,
    organization,
    senderFullName,
    senderPosition,
    senderOrganization,
  });

  const SENSITIVE_TEMPLATES = [
    DOCUMENT_TEMPLATE_APPLICATION,
    DOCUMENT_TEMPLATE_COMPLAINT,
    DOCUMENT_TEMPLATE_POWER_OF_ATTORNEY,
    DOCUMENT_TEMPLATE_EXPLANATORY_NOTE,
  ];
  const safeTemplate = documentTemplate || DOCUMENT_TEMPLATE_BUSINESS_LETTER;
  if (SENSITIVE_TEMPLATES.includes(safeTemplate)) {
    warnings.push({
      code: WARNING_CODES.TEMPLATE_REVIEW,
      message: 'Это заготовка текста, а не юридическая консультация. Проверьте формулировки перед отправкой.',
    });
  }

  let confidence = 0.95;
  const hasIncompleteName = warnings.some((w) => w.code === WARNING_CODES.INCOMPLETE_NAME);
  const hasSoftWarning = warnings.some((w) =>
    [
      WARNING_CODES.UNKNOWN_GENDER,
      WARNING_CODES.AUTO_DETECTED_GENDER,
      WARNING_CODES.UNKNOWN_POSITION,
      WARNING_CODES.UNDECLINABLE_SURNAME,
      WARNING_CODES.EXTRA_NAME_PARTS,
      WARNING_CODES.LATIN_NAME,
      WARNING_CODES.INITIALS_DETECTED,
      WARNING_CODES.HYPHENATED_NAME_REVIEW,
      WARNING_CODES.NAME_CASE_UNCERTAIN,
    ].includes(w.code)
  );
  if (hasIncompleteName) {
    confidence = 0.55;
  } else if (hasSoftWarning) {
    confidence = 0.75;
  }

  const manualReviewRequired = confidence < 0.8;

  return {
    blocks: {
      to: toResult.block,
      from: fromResult.block,
      greeting,
      letter: letterBlock,
      documentText,
    },
    warnings,
    confidence,
    manualReviewRequired,
    parsedName: toResult.parsedName,
  };
}
