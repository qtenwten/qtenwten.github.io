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
  DOCUMENT_TEMPLATE_POWER_OF_ATTORNEY,
  DOCUMENT_TEMPLATE_ORDER,
  DOCUMENT_TEMPLATE_MEMO,
} from './addresseeTypes.js';

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
  };
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

function buildToBlock(organization, position, fullName, gender) {
  const lines = [];
  const warnings = [];

  if (organization) {
    lines.push(organization);
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
  if (parsedName.surname && parsedName.name && parsedName.patronymic) {
    lines.push(`${parsedName.surname} ${parsedName.name} ${parsedName.patronymic}`);
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

function buildFromBlock(fullName, position, organization) {
  const lines = [];
  const warnings = [];

  if (fullName) {
    lines.push(`от ${fullName}`);
  }

  if (position) {
    lines.push(position);
  }

  if (organization) {
    lines.push(organization);
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
    warnings.push({
      code: WARNING_CODES.EXTRA_NAME_PARTS,
      message: 'ФИО содержит больше трёх частей. Проверьте порядок фамилии, имени и отчества вручную.',
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

  if (/[a-zA-Z]/.test(fullName)) {
    warnings.push({
      code: WARNING_CODES.LATIN_NAME,
      message: 'ФИО содержит латинские буквы. Проверьте написание вручную.',
    });
  }

  if (parsedName.surname && isPotentiallyUndeclinableSurname(parsedName.surname)) {
    warnings.push({
      code: WARNING_CODES.UNDECLINABLE_SURNAME,
      message: `Фамилия "${parsedName.surname}" может быть несклоняемой или спорной. Рекомендуется проверить вручную.`,
    });
  }

  const toResult = buildToBlock(organization, position, fullName, gender);
  warnings.push(...toResult.warnings);

  const fromResult = buildFromBlock(fullName, position, organization);
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
  });

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
