export const GENDER_MALE = 'male';
export const GENDER_FEMALE = 'female';
export const GENDER_UNKNOWN = 'unknown';

export const GREETING_NAME_PATRONYMIC = 'namePatronymic';
export const GREETING_FULL_NAME = 'fullName';
export const GREETING_COLLEAGUES = 'colleagues';

export const PUNCTUATION_EXCLAMATION = '!';
export const PUNCTUATION_COMMA = ',';

export const DOCUMENT_TEMPLATE_BUSINESS_LETTER = 'businessLetter';
export const DOCUMENT_TEMPLATE_APPLICATION = 'application';
export const DOCUMENT_TEMPLATE_COMPLAINT = 'complaint';
export const DOCUMENT_TEMPLATE_REQUEST = 'request';
export const DOCUMENT_TEMPLATE_MEMO = 'memo';
export const DOCUMENT_TEMPLATE_EXPLANATORY_NOTE = 'explanatoryNote';
export const DOCUMENT_TEMPLATE_POWER_OF_ATTORNEY = 'powerOfAttorney';
export const DOCUMENT_TEMPLATE_COMMERCIAL_OFFER = 'commercialOffer';
export const DOCUMENT_TEMPLATE_ORDER = 'order';

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

export const DOCUMENT_TEMPLATE_OPTIONS = [
  { value: DOCUMENT_TEMPLATE_BUSINESS_LETTER, labelKey: 'addresseeGenerator.documentTemplate.businessLetter' },
  { value: DOCUMENT_TEMPLATE_APPLICATION, labelKey: 'addresseeGenerator.documentTemplate.application' },
  { value: DOCUMENT_TEMPLATE_COMPLAINT, labelKey: 'addresseeGenerator.documentTemplate.complaint' },
  { value: DOCUMENT_TEMPLATE_REQUEST, labelKey: 'addresseeGenerator.documentTemplate.request' },
  { value: DOCUMENT_TEMPLATE_MEMO, labelKey: 'addresseeGenerator.documentTemplate.memo' },
  { value: DOCUMENT_TEMPLATE_EXPLANATORY_NOTE, labelKey: 'addresseeGenerator.documentTemplate.explanatoryNote' },
  { value: DOCUMENT_TEMPLATE_POWER_OF_ATTORNEY, labelKey: 'addresseeGenerator.documentTemplate.powerOfAttorney' },
  { value: DOCUMENT_TEMPLATE_COMMERCIAL_OFFER, labelKey: 'addresseeGenerator.documentTemplate.commercialOffer' },
  { value: DOCUMENT_TEMPLATE_ORDER, labelKey: 'addresseeGenerator.documentTemplate.order' },
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
  EXTRA_NAME_PARTS: 'EXTRA_NAME_PARTS',
  LATIN_NAME: 'LATIN_NAME',
  INITIALS_DETECTED: 'INITIALS_DETECTED',
  HYPHENATED_NAME_REVIEW: 'HYPHENATED_NAME_REVIEW',
  TEMPLATE_REVIEW: 'TEMPLATE_REVIEW',
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
  'индивидуальный предприниматель': 'индивидуальному предпринимателю',
  'заместитель руководителя': 'заместителю руководителя',
  'заместитель начальника': 'заместителю начальника',
  'заместитель главного бухгалтера': 'заместителю главного бухгалтера',
  'старший менеджер': 'старшему менеджеру',
  'старший бухгалтер': 'старшему бухгалтеру',
  'ведущий бухгалтер': 'ведущему бухгалтеру',
  'ведущий менеджер': 'ведущему менеджеру',
  'главный редактор': 'главному редактору',
  'редактор': 'редактору',
  'директор магазина': 'директору магазина',
  'директор представительства': 'директору представительства',
  'директор филиала': 'директору филиала',
  'управляющий': 'управляющему',
  'управляющий директор': 'управляющему директору',
  'технический директор': 'техническому директору',
  'it-директор': 'IT-директору',
  'начальник управления': 'начальнику управления',
  'начальник отдела кадров': 'начальнику отдела кадров',
  'начальник юридического отдела': 'начальнику юридического отдела',
  'начальник финансового отдела': 'начальнику финансового отдела',
  'руководитель проекта': 'руководителю проекта',
  'руководитель группы': 'руководителю группы',
  'начальник цеха': 'начальнику цеха',
  'начальник участка': 'начальнику участка',
  'мастер': 'мастеру',
  'бригадир': 'бригадиру',
  'кассир': 'кассиру',
  'контролер': 'контролеру',
  'охранник': 'охраннику',
  'водитель': 'водителю',
  'курьер': 'курьеру',
  'продавец': 'продавцу',
  'кладовщик': 'кладовщику',
  'грузчик': 'грузчику',
  'рабочий': 'рабочему',
  'слесарь': 'слесарю',
  'электрик': 'электрику',
  'механик': 'механику',
  'сантехник': 'сантехнику',
  'маляр': 'маляру',
  'плотник': 'плотнику',
  'токарь': 'токарю',
  'сварщик': 'сварщику',
  'программист': 'программисту',
  'разработчик': 'разработчику',
  'тестировщик': 'тестировщику',
  'дизайнер': 'дизайнеру',
  'копирайтер': 'копирайтеру',
  'верстальщик': 'верстальщику',
  'hr-специалист': 'HR-специалисту',
  'рекрутер': 'рекрутеру',
  'кадровик': 'кадровику',
  'банковский работник': 'банковскому работнику',
  'операционист': 'операционисту',
  'инкассатор': 'инкассатору',
  'адвокат': 'адвокату',
  'нотариус': 'нотариусу',
  'судья': 'судье',
  'следователь': 'следователю',
  'медсестра': 'медсестре',
  'фельдшер': 'фельдшеру',
  'доцент': 'доценту',
  'профессор': 'профессору',
  'завуч': 'заведующему',
  'директор школы': 'директору школы',
  'воспитатель': 'воспитателю',
  'социальный работник': 'социальному работнику',
  'психолог': 'психологу',
  'портье': 'портье',
  'консьерж': 'консьержу',
  'гид': 'гиду',
  'экскурсовод': 'экскурсоводу',
  'риелтор': 'риелтору',
  'оценщик': 'оценщику',
  'прораб': 'прорабу',
  'сметчик': 'сметчику',
  'мастер цеха': 'мастеру цеха',
  'начальник производства': 'начальнику производства',
  'директор завода': 'директору завода',
  'директор фабрики': 'директору фабрики',
  'директор производства': 'директору производства',
  'технолог': 'технологу',
  'конструктор': 'конструктору',
  'лаборант': 'лаборанту',
  'оператор станков': 'оператору станков',
  'губернатор': 'губернатору',
  'мэр': 'мэру',
  'глава администрации': 'главе администрации',
  'полковник': 'полковнику',
  'майор': 'майору',
  'подполковник': 'подполковнику',
  'капитан': 'капитану',
  'лейтенант': 'лейтенанту',
  'прапорщик': 'прапорщику',
  'сержант': 'сержанту',
  'рядовой': 'рядовому',
  'крановщик': 'крановщику',
  'тракторист': 'трактористу',
  'агроном': 'агроному',
  'ветеринар': 'ветеринару',
  'зоотехник': 'зоотехнику',
  'фермер': 'фермеру',
  'менеджер по закупкам': 'менеджеру по закупкам',
  'менеджер по продажам': 'менеджеру по продажам',
  'менеджер по работе с клиентами': 'менеджеру по работе с клиентами',
  'менеджер по персоналу': 'менеджеру по персоналу',
  'менеджер по рекламе': 'менеджеру по рекламе',
};
