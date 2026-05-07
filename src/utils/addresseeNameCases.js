import { GENDER_MALE, GENDER_FEMALE } from './addresseeTypes.js';

export const CASE_DATIVE = 'dative';
export const CASE_GENITIVE = 'genitive';

const MALE_FIRST_NAMES_DATIVE = {
  'иван': 'ивану',
  'сергей': 'сергею',
  'александр': 'александру',
  'алексей': 'алексею',
  'дмитрий': 'дмитрию',
  'андрей': 'андрею',
  'николай': 'николаю',
  'михаил': 'михаилу',
  'олег': 'олегу',
  'павел': 'павлу',
  'пётр': 'петру',
  'владимир': 'владимиру',
  'максим': 'максиму',
  'артём': 'артёму',
  'артем': 'артему',
  'юрий': 'юрию',
  'василий': 'василию',
  'иванович': 'ивановичу',
  'петрович': 'петровичу',
  'александрович': 'александровичу',
  'сергеевич': 'сергеевичу',
  'дмитриевич': 'дмитриевичу',
  'андреевич': 'андреевичу',
  'николаевич': 'николаевичу',
  'владимирович': 'владимировичу',
  'олегович': 'олеговичу',
  'павлович': 'павловичу',
  'викторович': 'викторовичу',
  'евгеньевич': 'евгеньевичу',
  'константинович': 'константиновичу',
  'геннадьевич': 'геннадьевичу',
  'васильевич': 'васильевичу',
  'юрьевич': 'юрьевичу',
  'семёнович': 'семёновичу',
  'семенович': 'семеновичу',
  'фёдорович': 'фёдоровичу',
  'федорович': 'федоровичу',
};

const MALE_FIRST_NAMES_GENITIVE = {
  'иван': 'ивана',
  'сергей': 'сергея',
  'александр': 'александра',
  'алексей': 'алексея',
  'дмитрий': 'дмитрия',
  'андрей': 'андрея',
  'николай': 'николая',
  'михаил': 'михаила',
  'олег': 'олега',
  'павел': 'павла',
  'пётр': 'петра',
  'владимир': 'владимира',
  'максим': 'максима',
  'артём': 'артёма',
  'артем': 'артема',
  'юрий': 'юрия',
  'василий': 'василия',
  'иванович': 'ивановича',
  'петрович': 'петровича',
  'александрович': 'александровича',
  'сергеевич': 'сергеевича',
  'дмитриевич': 'дмитриевича',
  'андреевич': 'андреевича',
  'николаевич': 'николаевича',
  'владимирович': 'владимировича',
  'олегович': 'олеговича',
  'павлович': 'павловича',
  'викторович': 'викторовича',
  'евгеньевич': 'евгеньевича',
  'константинович': 'константиновича',
  'геннадьевич': 'геннадьевича',
  'васильевич': 'васильевича',
  'юрьевич': 'юрьевича',
  'семёнович': 'семёновича',
  'семенович': 'семеновича',
  'фёдорович': 'фёдоровича',
  'федорович': 'федоровича',
};

const FEMALE_FIRST_NAMES_DATIVE = {
  'анна': 'анне',
  'мария': 'марии',
  'ольга': 'ольге',
  'елена': 'елене',
  'наталья': 'наталье',
  'татьяна': 'татьяне',
  'ирина': 'ирине',
  'светлана': 'светлане',
  'екатерина': 'екатерине',
  'юлия': 'юлии',
  'анастасия': 'анастасии',
  'виктория': 'виктории',
  'дарья': 'дарье',
  'ольга': 'ольге',
  'надежда': 'надежде',
  'людмила': 'людмиле',
  'валентина': 'валентине',
  'лидия': 'лидии',
  'ельмира': 'эльмире',
  'зоя': 'зое',
  'нина': 'нине',
  'radoлена': 'радовене',
  'ева': 'еве',
  'марина': 'марине',
  'лива': 'ливе',
  'алла': 'алле',
  'лена': 'лене',
  'мила': 'миле',
  'мира': 'мире',
  'лика': 'лике',
  'иванова': 'ивановой',
  'петрова': 'петровой',
  'сидорова': 'сидоровой',
  'сергеевна': 'сергеевне',
  'александровна': 'александровне',
  'дмитриевна': 'дмитриевне',
  'андреевна': 'андреевне',
  'николаевна': 'николаевне',
  'владимировна': 'владимировне',
  'олеговна': 'олеговне',
  'павловна': 'павловне',
  'викторовна': 'викторовне',
  'евгеньевна': 'евгеньевне',
  'константиновна': 'константиновне',
  'геннадьевна': 'геннадьевне',
  'васильевна': 'васильевне',
  'юрьевна': 'юрьевне',
  'семёновна': 'семёновне',
  'семеновна': 'семеновне',
  'фёдоровна': 'фёдоровне',
  'федоровна': 'федоровне',
};

const FEMALE_FIRST_NAMES_GENITIVE = {
  'анна': 'анны',
  'мария': 'марии',
  'ольга': 'ольги',
  'елена': 'елены',
  'наталья': 'натальи',
  'татьяна': 'татьяны',
  'ирина': 'ирины',
  'светлана': 'светланы',
  'екатерина': 'екатерины',
  'юлия': 'юлии',
  'анастасия': 'анастасии',
  'виктория': 'виктории',
  'дарья': 'дарьи',
  'надежда': 'надежды',
  'людмила': 'людмилы',
  'валентина': 'валентины',
  'лидия': 'лидии',
  'ева': 'евы',
  'марина': 'марины',
  'алла': 'аллы',
  'лена': 'лены',
  'мила': 'милы',
  'мира': 'миры',
  'сергеевна': 'сергеевны',
  'александровна': 'александровны',
  'дмитриевна': 'дмитриевны',
  'андреевна': 'андреевны',
  'николаевна': 'николаевны',
  'владимировна': 'владимировны',
  'олеговна': 'олеговны',
  'павловна': 'павловны',
  'викторовна': 'викторовны',
  'евгеньевна': 'евгеньевны',
  'константиновна': 'константиновны',
  'геннадьевна': 'геннадьевны',
  'васильевна': 'васильевны',
  'юрьевна': 'юрьевны',
  'семёновна': 'семёновны',
  'семеновна': 'семеновны',
  'фёдоровна': 'фёдоровны',
  'федоровна': 'федоровны',
};

function declineSurnameByGender(surname, gender, targetCase) {
  if (!surname) return { declined: surname, warned: false };

  const lower = surname.toLowerCase();
  const lastTwo = lower.slice(-2);
  const lastThree = lower.slice(-3);

  if (targetCase === CASE_DATIVE) {
    if (gender === GENDER_MALE) {
      if (lastTwo === 'ов' || lastTwo === 'ёв' || lastTwo === 'ин' || lastTwo === 'ын') {
        return { declined: surname + 'у', warned: false };
      }
      if (lastThree === 'ский' || lastThree === 'ской') {
        return { declined: surname.slice(0, -2) + 'ому', warned: false };
      }
      if (lastTwo === 'ий' || lastTwo === 'ой') {
        return { declined: surname.slice(0, -2) + 'ому', warned: false };
      }
      return { declined: surname, warned: true };
    } else if (gender === GENDER_FEMALE) {
      if (lastTwo === 'ва' || lastTwo === 'ва') {
        return { declined: surname.slice(0, -1) + 'ой', warned: false };
      }
      if (lastTwo === 'ая') {
        return { declined: surname.slice(0, -2) + 'ой', warned: false };
      }
      if (lastThree === 'ская' || lastThree === 'ской') {
        return { declined: surname.slice(0, -2) + 'ой', warned: false };
      }
      if (lastTwo === 'ия') {
        return { declined: surname.slice(0, -2) + 'ии', warned: false };
      }
      return { declined: surname, warned: true };
    }
  } else if (targetCase === CASE_GENITIVE) {
    if (gender === GENDER_MALE) {
      if (lastTwo === 'ов' || lastTwo === 'ёв') {
        return { declined: surname.slice(0, -2) + 'ова', warned: false };
      }
      if (lastTwo === 'ин' || lastTwo === 'ын') {
        return { declined: surname.slice(0, -2) + 'ина', warned: false };
      }
      if (lastThree === 'ский' || lastThree === 'ской') {
        return { declined: surname.slice(0, -2) + 'ого', warned: false };
      }
      if (lastTwo === 'ий' || lastTwo === 'ой') {
        return { declined: surname.slice(0, -2) + 'ого', warned: false };
      }
      return { declined: surname, warned: true };
    } else if (gender === GENDER_FEMALE) {
      if (lastTwo === 'ва' || lastTwo === 'ая') {
        return { declined: surname.slice(0, -1) + 'ой', warned: false };
      }
      if (lastThree === 'ская' || lastThree === 'ской') {
        return { declined: surname.slice(0, -2) + 'ой', warned: false };
      }
      if (lastTwo === 'ия') {
        return { declined: surname.slice(0, -2) + 'ии', warned: false };
      }
      return { declined: surname, warned: true };
    }
  }

  return { declined: surname, warned: true };
}

function declineFirstName(firstName, gender, targetCase) {
  if (!firstName) return { declined: firstName, warned: false };

  const lower = firstName.toLowerCase();

  if (targetCase === CASE_DATIVE) {
    if (gender === GENDER_MALE && MALE_FIRST_NAMES_DATIVE[lower]) {
      const dative = MALE_FIRST_NAMES_DATIVE[lower];
      const capitalized = dative.charAt(0).toUpperCase() + dative.slice(1);
      return { declined: capitalized, warned: false };
    }
    if (gender === GENDER_FEMALE && FEMALE_FIRST_NAMES_DATIVE[lower]) {
      const dative = FEMALE_FIRST_NAMES_DATIVE[lower];
      const capitalized = dative.charAt(0).toUpperCase() + dative.slice(1);
      return { declined: capitalized, warned: false };
    }
    if (firstName.endsWith('ич') && gender === GENDER_MALE) {
      return { declined: firstName + 'у', warned: false };
    }
    if (firstName.endsWith('на') && gender === GENDER_FEMALE) {
      return { declined: firstName.slice(0, -2) + 'не', warned: false };
    }
  } else if (targetCase === CASE_GENITIVE) {
    if (gender === GENDER_MALE && MALE_FIRST_NAMES_GENITIVE[lower]) {
      const genitive = MALE_FIRST_NAMES_GENITIVE[lower];
      const capitalized = genitive.charAt(0).toUpperCase() + genitive.slice(1);
      return { declined: capitalized, warned: false };
    }
    if (gender === GENDER_FEMALE && FEMALE_FIRST_NAMES_GENITIVE[lower]) {
      const genitive = FEMALE_FIRST_NAMES_GENITIVE[lower];
      const capitalized = genitive.charAt(0).toUpperCase() + genitive.slice(1);
      return { declined: capitalized, warned: false };
    }
    if (firstName.endsWith('ич') && gender === GENDER_MALE) {
      return { declined: firstName.slice(0, -1) + 'а', warned: false };
    }
    if (firstName.endsWith('на') && gender === GENDER_FEMALE) {
      return { declined: firstName.slice(0, -2) + 'ны', warned: false };
    }
  }

  return { declined: firstName, warned: true };
}

function declinePatronymic(patronymic, gender, targetCase) {
  if (!patronymic) return { declined: patronymic, warned: false };

  if (targetCase === CASE_DATIVE) {
    if (patronymic.endsWith('ич') && gender === GENDER_MALE) {
      return { declined: patronymic + 'у', warned: false };
    }
    if (patronymic.endsWith('на') && gender === GENDER_FEMALE) {
      return { declined: patronymic.slice(0, -2) + 'не', warned: false };
    }
    if (patronymic.endsWith('иевна') || patronymic.endsWith('ьевна')) {
      const base = patronymic.slice(0, -3);
      return { declined: base + 'не', warned: false };
    }
  } else if (targetCase === CASE_GENITIVE) {
    if (patronymic.endsWith('ич') && gender === GENDER_MALE) {
      return { declined: patronymic + 'а', warned: false };
    }
    if (patronymic.endsWith('на') && gender === GENDER_FEMALE) {
      return { declined: patronymic.slice(0, -2) + 'ны', warned: false };
    }
    if (patronymic.endsWith('иевна') || patronymic.endsWith('ьевна')) {
      const base = patronymic.slice(0, -3);
      return { declined: base + 'ны', warned: false };
    }
  }

  return { declined: patronymic, warned: true };
}

export function parseRussianFullName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return { surname: '', name: '', patronymic: '', extraParts: [] };
  }
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    surname: parts[0] || '',
    name: parts[1] || '',
    patronymic: parts[2] || '',
    extraParts: parts.slice(3),
  };
}

export function declineRussianFullName(fullName, gender, targetCase) {
  const parsed = parseRussianFullName(fullName);
  const { surname, name, patronymic, extraParts } = parsed;

  if (extraParts.length > 0) {
    return {
      declined: fullName,
      warned: true,
      reason: 'extra_parts',
    };
  }

  if (!surname || !name || !patronymic) {
    return {
      declined: fullName,
      warned: true,
      reason: 'incomplete',
    };
  }

  const surnameResult = declineSurnameByGender(surname, gender, targetCase);
  const nameResult = declineFirstName(name, gender, targetCase);
  const patronymicResult = declinePatronymic(patronymic, gender, targetCase);

  const warned = surnameResult.warned || nameResult.warned || patronymicResult.warned;

  const declined = [
    surnameResult.declined,
    nameResult.declined,
    patronymicResult.declined,
  ].join(' ');

  return {
    declined,
    warned,
    reason: warned ? 'uncertain' : null,
  };
}

export function declineSurnameSafe(surname, gender, targetCase) {
  return declineSurnameByGender(surname, gender, targetCase);
}

export function declineFirstNameSafe(firstName, gender, targetCase) {
  return declineFirstName(firstName, gender, targetCase);
}

export function declinePatronymicSafe(patronymic, gender, targetCase) {
  return declinePatronymic(patronymic, gender, targetCase);
}

export function isRiskyNameForDeclension(parsedName, gender, hasInitials, hasHyphenated, isLatin) {
  if (hasInitials) return true;
  if (hasHyphenated) return true;
  if (isLatin) return true;
  if (!parsedName.surname || !parsedName.name || !parsedName.patronymic) return true;
  if (parsedName.extraParts && parsedName.extraParts.length > 0) return true;
  return false;
}