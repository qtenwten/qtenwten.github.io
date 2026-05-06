export const GENDER_MALE = 'male';
export const GENDER_FEMALE = 'female';
export const GENDER_UNKNOWN = 'unknown';

export const GREETING_NAME_PATRONYMIC = 'namePatronymic';
export const GREETING_FULL_NAME = 'fullName';
export const GREETING_COLLEAGUES = 'colleagues';

export const PUNCTUATION_EXCLAMATION = '!';
export const PUNCTUATION_COMMA = ',';

export const GENDER_OPTIONS = [
  { value: GENDER_MALE, labelKey: 'addresseeGenerator.gender.male' },
  { value: GENDER_FEMALE, labelKey: 'addresseeGenerator.gender.female' },
  { value: GENDER_UNKNOWN, labelKey: 'addresseeGenerator.gender.unknown' },
];

export const GREETING_MODE_OPTIONS = [
  { value: GREETING_NAME_PATRONYMIC, labelKey: 'addresseeGenerator.greetingMode.namePatronymic' },
  { value: GREETING_FULL_NAME, labelKey: 'addresseeGenerator.greetingMode.fullName' },
  { value: GREETING_COLLEAGUES, labelKey: 'addresseeGenerator.greetingMode.colleagues' },
];

export const PUNCTUATION_OPTIONS = [
  { value: PUNCTUATION_EXCLAMATION, labelKey: 'addresseeGenerator.punctuation.exclamation' },
  { value: PUNCTUATION_COMMA, labelKey: 'addresseeGenerator.punctuation.comma' },
];

export const CONJUNCTION_BY_GENDER = {
  [GENDER_MALE]: 'Уважаемый',
  [GENDER_FEMALE]: 'Уважаемая',
  [GENDER_UNKNOWN]: 'Здравствуйте',
};

export const COLLEAGUES_GREETING = 'Уважаемые коллеги';

export const WARNING_CODES = {
  INCOMPLETE_NAME: 'INCOMPLETE_NAME',
  UNKNOWN_GENDER: 'UNKNOWN_GENDER',
  AUTO_DETECTED_GENDER: 'AUTO_DETECTED_GENDER',
  UNDECLINABLE_SURNAME: 'UNDECLINABLE_SURNAME',
  UNKNOWN_POSITION: 'UNKNOWN_POSITION',
  ORGANIZATION_ABBREVIATION: 'ORGANIZATION_ABBREVIATION',
};

export const UNDECLINABLE_SUFFIXES = ['ко', 'ых', 'их', 'о'];

export const KNOWN_UNDECLINABLE_SURNAMES = ['ким', 'ли', 'пак', 'цой', 'чон', 'хан', 'ю', 'ко', 'го'];

export const COMMON_MALE_NAMES = [
  'иван',
  'пётр',
  'петр',
  'алексей',
  'сергей',
  'андрей',
  'дмитрий',
  'александр',
  'николай',
  'максим',
  'михаил',
  'владимир',
  'павел',
  'артем',
  'артём',
];

export const COMMON_FEMALE_NAMES = [
  'анна',
  'ольга',
  'елена',
  'мария',
  'наталья',
  'ирина',
  'светлана',
  'татьяна',
  'екатерина',
  'анастасия',
  'юлия',
  'виктория',
  'дарья',
];

export const ABBREVIATION_PATTERNS = [
  /^ООО\s*/i,
  /^АО\s*/i,
  /^ИП\s*/i,
  /^ФГБУ\s*/i,
  /^УМВД\s*/i,
  /^ООО\s*"/,
  /^АО\s*"/,
];

export const POSITION_DICTIONARY = {
  'директор': 'директору',
  'генеральный директор': 'генеральному директору',
  'руководитель': 'руководителю',
  'начальник': 'начальнику',
  'менеджер': 'менеджеру',
  'бухгалтер': 'бухгалтеру',
  'юрист': 'юристу',
  'заместитель директора': 'заместителю директора',
  'заместитель генерального директора': 'заместителю генерального директора',
  'главный бухгалтер': 'главному бухгалтеру',
  'заведующий': 'заведующему',
  'председатель': 'председателю',
  'ведущий специалист': 'ведущему специалисту',
  'специалист': 'специалисту',
  'главный специалист': 'главному специалисту',
  'администратор': 'администратору',
  'оператор': 'оператору',
  'координатор': 'координатору',
  'аналитик': 'аналитику',
  'инженер': 'инженеру',
  'главный инженер': 'главному инженеру',
  'техник': 'технику',
  'секретарь': 'секретарю',
  'помощник руководителя': 'помощнику руководителя',
  'ассистент': 'ассистенту',
  'консультант': 'консультанту',
  'экономист': 'экономисту',
  'маркетолог': 'маркетологу',
  'коммерческий директор': 'коммерческому директору',
  'финансовый директор': 'финансовому директору',
  'исполнительный директор': 'исполнительному директору',
  'директор по продажам': 'директору по продажам',
  'директор по маркетингу': 'директору по маркетингу',
  'директор по персоналу': 'директору по персоналу',
  'начальник отдела': 'начальнику отдела',
  'руководитель отдела': 'руководителю отдела',
  'менеджер проекта': 'менеджеру проекта',
  'проектный менеджер': 'проектному менеджеру',
  'hr-менеджер': 'HR-менеджеру',
  'системный администратор': 'системному администратору',
  'юрисконсульт': 'юрисконсульту',
  'делопроизводитель': 'делопроизводителю',
  'офис-менеджер': 'офис-менеджеру',
  'врач': 'врачу',
  'учитель': 'учителю',
  'преподаватель': 'преподавателю',
};
