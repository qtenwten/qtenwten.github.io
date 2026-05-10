import { formatAddressee } from '../src/utils/addresseeFormatter.js'
import {
  CASE_DATIVE,
  CASE_GENITIVE,
  declineRussianFullName,
} from '../src/utils/addresseeNameCases.js'
import {
  GENDER_MALE,
  GENDER_FEMALE,
  GENDER_UNKNOWN,
  GREETING_NAME_PATRONYMIC,
  GREETING_FULL_NAME,
  GREETING_COLLEAGUES,
  PUNCTUATION_EXCLAMATION,
  PUNCTUATION_COMMA,
  WARNING_CODES,
  DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  DOCUMENT_TEMPLATE_APPLICATION,
  DOCUMENT_TEMPLATE_COMPLAINT,
  DOCUMENT_TEMPLATE_REQUEST,
  DOCUMENT_TEMPLATE_MEMO,
  DOCUMENT_TEMPLATE_EXPLANATORY_NOTE,
  DOCUMENT_TEMPLATE_POWER_OF_ATTORNEY,
  DOCUMENT_TEMPLATE_COMMERCIAL_OFFER,
  DOCUMENT_TEMPLATE_ORDER,
} from '../src/utils/addresseeTypes.js'

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    passed++
    console.log(`  ✓ ${message}`)
  } else {
    failed++
    console.log(`  ✗ FAIL: ${message}`)
  }
}

function run() {
  console.log('\n=== Addressee Formatter Checks ===\n')

  // A. Basic success cases
  console.log('A. Basic success cases')

  const casesA = [
    { fullName: 'Иванов Иван Петрович', position: 'генеральный директор', organization: 'ООО «Ромашка»', gender: GENDER_MALE, greetingMode: GREETING_NAME_PATRONYMIC, punctuation: PUNCTUATION_EXCLAMATION },
    { fullName: 'Петрова Анна Сергеевна', position: 'руководитель', organization: 'АО «Север»', gender: GENDER_FEMALE, greetingMode: GREETING_NAME_PATRONYMIC, punctuation: PUNCTUATION_EXCLAMATION },
    { fullName: 'Сидоров Пётр Алексеевич', position: 'директор', organization: 'ИП Сидоров П.А.', gender: GENDER_MALE, greetingMode: GREETING_NAME_PATRONYMIC, punctuation: PUNCTUATION_EXCLAMATION },
    { fullName: 'Смирнова Ольга Викторовна', position: 'бухгалтер', organization: 'ООО «Альфа»', gender: GENDER_FEMALE, greetingMode: GREETING_NAME_PATRONYMIC, punctuation: PUNCTUATION_EXCLAMATION },
    { fullName: 'Кузнецов Алексей Игоревич', position: 'юрист', organization: 'ООО «Право»', gender: GENDER_MALE, greetingMode: GREETING_NAME_PATRONYMIC, punctuation: PUNCTUATION_EXCLAMATION },
  ]

  casesA.forEach((input, i) => {
    const r = formatAddressee(input)
    assert(r.blocks.to, `A${i + 1}: blocks.to exists`)
    assert(typeof r.blocks.from === 'string', `A${i + 1}: blocks.from is a string`)
    assert(r.blocks.greeting, `A${i + 1}: blocks.greeting exists`)
    assert(r.blocks.letter, `A${i + 1}: blocks.letter exists`)
    assert(typeof r.confidence === 'number' && r.confidence >= 0 && r.confidence <= 1, `A${i + 1}: confidence in range 0-1`)
    assert(typeof r.manualReviewRequired === 'boolean', `A${i + 1}: manualReviewRequired is boolean`)
    assert(r.confidence === 0.95 || r.confidence === 0.75 || r.confidence === 0.55, `A${i + 1}: confidence is one of defined values`)
  })

  // B. Incomplete names
  console.log('\nB. Incomplete names')

  const casesB = [
    { fullName: 'Иванов Иван', gender: GENDER_MALE },
    { fullName: 'Анна Сергеевна', gender: GENDER_FEMALE },
    { fullName: 'Иванов', gender: GENDER_MALE },
    { fullName: '', gender: GENDER_UNKNOWN },
  ]

  casesB.forEach((input, i) => {
    const r = formatAddressee(input)
    assert(!r.blocks.to.includes('undefined') && !r.blocks.to.includes('null'), `B${i + 1}: to block has no undefined/null`)
    const hasIncompleteWarning = r.warnings.some((w) => w.code === WARNING_CODES.INCOMPLETE_NAME)
    assert(hasIncompleteWarning || r.confidence < 0.95, `B${i + 1}: incomplete name gives warning or lower confidence`)
    assert(r.confidence < 0.95, `B${i + 1}: incomplete name confidence is not high`)
    assert(r.manualReviewRequired === true, `B${i + 1}: manualReviewRequired is true`)
    assert(typeof r.blocks.greeting === 'string' && r.blocks.greeting.length > 0, `B${i + 1}: greeting is non-empty string`)
  })

  // C. Unknown gender
  console.log('\nC. Unknown gender')

  const casesC = [
    { fullName: 'Иванов Иван Петрович', gender: GENDER_UNKNOWN },
    { fullName: 'Петрова Анна Сергеевна', gender: GENDER_UNKNOWN },
  ]

  casesC.forEach((input, i) => {
    const r = formatAddressee(input)
    const hasGenderWarning = r.warnings.some((w) => w.code === WARNING_CODES.UNKNOWN_GENDER)
    assert(hasGenderWarning, `C${i + 1}: unknown gender gives warning`)
    assert(r.confidence < 0.95, `C${i + 1}: unknown gender confidence is not high`)
    assert(r.manualReviewRequired === true, `C${i + 1}: manualReviewRequired is true`)
    assert(typeof r.blocks.greeting === 'string', `C${i + 1}: greeting is a string`)
    assert(r.blocks.greeting.includes('Здравствуйте'), `C${i + 1}: greeting uses Здравствуйте for unknown gender`)
  })

  // D. Undeclinable surnames
  console.log('\nD. Undeclinable surnames')

  const casesD = [
    { fullName: 'Шевченко Иван Петрович', gender: GENDER_MALE },
    { fullName: 'Черных Алексей Иванович', gender: GENDER_MALE },
    { fullName: 'Дурново Сергей Петрович', gender: GENDER_MALE },
    { fullName: 'Белых Анна Сергеевна', gender: GENDER_FEMALE },
  ]

  casesD.forEach((input, i) => {
    const r = formatAddressee(input)
    const hasUndeclWarning = r.warnings.some((w) => w.code === WARNING_CODES.UNDECLINABLE_SURNAME)
    assert(hasUndeclWarning, `D${i + 1}: undeclinable surname gives warning`)
    assert(typeof r.blocks.to === 'string' && r.blocks.to.length > 0, `D${i + 1}: to block is non-empty`)
    assert(typeof r.blocks.greeting === 'string', `D${i + 1}: greeting is a string`)
  })

  // E. Position dictionary
  console.log('\nE. Position dictionary')

  const positions = [
    { position: 'директор', expectedDative: 'директору' },
    { position: 'генеральный директор', expectedDative: 'генеральному директору' },
    { position: 'руководитель', expectedDative: 'руководителю' },
    { position: 'начальник', expectedDative: 'начальнику' },
    { position: 'менеджер', expectedDative: 'менеджеру' },
    { position: 'бухгалтер', expectedDative: 'бухгалтеру' },
    { position: 'юрист', expectedDative: 'юристу' },
  ]

  positions.forEach(({ position, expectedDative }, i) => {
    const r = formatAddressee({ fullName: 'Тестов Тест Тестович', position, gender: GENDER_MALE })
    const hasKnownWarning = r.warnings.some((w) => w.code === WARNING_CODES.UNKNOWN_POSITION)
    assert(!hasKnownWarning, `E${i + 1}: known position "${position}" has no UNKNOWN_POSITION warning`)
    assert(r.confidence >= 0.75, `E${i + 1}: known position confidence is at least 0.75`)
  })

  // Unknown position
  const rUnknownPos = formatAddressee({ fullName: 'Тестов Тест Тестович', position: 'супервайвер', gender: GENDER_MALE })
  const hasUnknownPosWarning = rUnknownPos.warnings.some((w) => w.code === WARNING_CODES.UNKNOWN_POSITION)
  assert(hasUnknownPosWarning, 'E8: unknown position "супервайвер" gives UNKNOWN_POSITION warning')

  // F. Organizations
  console.log('\nF. Organizations')

  const casesF = [
    { fullName: 'Иванов Иван Петрович', position: 'директор', organization: 'ООО «Ромашка»' },
    { fullName: 'Иванов Иван Петрович', position: 'директор', organization: 'АО «Север»' },
    { fullName: 'Иванов Иван Петрович', position: 'директор', organization: 'ИП Иванов И.И.' },
    { fullName: 'Иванов Иван Петрович', position: 'директор', organization: 'ФГБУ «Центр»' },
    { fullName: 'Иванов Иван Петрович', position: 'директор', organization: 'УМВД России' },
  ]

  casesF.forEach((input, i) => {
    const r = formatAddressee(input)
    assert(r.blocks.to.includes(input.organization), `F${i + 1}: organization appears in to block`)
    assert(typeof r.blocks.from === 'string', `F${i + 1}: from block is a string`)
    assert(typeof r.blocks.greeting === 'string', `F${i + 1}: greeting is a string`)
  })

  // G. Greeting modes
  console.log('\nG. Greeting modes')

  const rColleagues = formatAddressee({ fullName: 'Иванов Иван Петрович', gender: GENDER_MALE, greetingMode: GREETING_COLLEAGUES, punctuation: PUNCTUATION_EXCLAMATION })
  assert(rColleagues.blocks.greeting.includes('Уважаемые коллеги'), 'G1: colleagues mode gives "Уважаемые коллеги"')

  const rNamePatr = formatAddressee({ fullName: 'Иванов Иван Петрович', gender: GENDER_MALE, greetingMode: GREETING_NAME_PATRONYMIC, punctuation: PUNCTUATION_EXCLAMATION })
  assert(rNamePatr.blocks.greeting.includes('Иван Петрович'), 'G2: namePatronymic mode includes name and patronymic')

  const rFullName = formatAddressee({ fullName: 'Иванов Иван Петрович', gender: GENDER_MALE, greetingMode: GREETING_FULL_NAME, punctuation: PUNCTUATION_EXCLAMATION })
  assert(rFullName.blocks.greeting.includes('Иван') && rFullName.blocks.greeting.includes('Иванов'), 'G3: fullName mode includes surname and name')

  const rExcl = formatAddressee({ fullName: 'Иванов Иван Петрович', gender: GENDER_MALE, greetingMode: GREETING_NAME_PATRONYMIC, punctuation: PUNCTUATION_EXCLAMATION })
  assert(rExcl.blocks.greeting.endsWith('!'), 'G4: exclamation punctuation')

  const rComma = formatAddressee({ fullName: 'Иванов Иван Петрович', gender: GENDER_MALE, greetingMode: GREETING_NAME_PATRONYMIC, punctuation: PUNCTUATION_COMMA })
  assert(rComma.blocks.greeting.endsWith(','), 'G5: comma punctuation')

  // Female gender
  const rFemale = formatAddressee({ fullName: 'Петрова Анна Сергеевна', gender: GENDER_FEMALE, greetingMode: GREETING_NAME_PATRONYMIC, punctuation: PUNCTUATION_EXCLAMATION })
  assert(rFemale.blocks.greeting.includes('Уважаемая'), 'G6: female gender uses "Уважаемая"')

  // H. Edge cases
  console.log('\nH. Edge cases')

  const rEmpty = formatAddressee({})
  assert(typeof rEmpty.blocks.to === 'string', 'H1: empty input gives string to block')
  assert(typeof rEmpty.blocks.from === 'string', 'H1: empty input gives string from block')
  assert(typeof rEmpty.blocks.greeting === 'string', 'H1: empty input gives string greeting')
  assert(rEmpty.warnings.length > 0, 'H1: empty input generates warnings')
  assert(rEmpty.manualReviewRequired === true, 'H1: empty input requires manual review')

  const rWhitespace = formatAddressee({ fullName: '   Иванов   Иван   Петрович   ', position: '  директор  ', organization: '  ООО «Тест»  ', gender: GENDER_MALE })
  assert(rWhitespace.blocks.to.includes('ООО'), 'H2: whitespace input normalizes correctly')

  const rNull = formatAddressee(null)
  assert(typeof rNull.blocks.to === 'string', 'H3: null input gives string to block')
  assert(rNull.confidence === 0.55, 'H3: null input gives confidence 0.55')

  const rUndefined = formatAddressee(undefined)
  assert(typeof rUndefined.blocks.from === 'string', 'H4: undefined input gives string from block')
  assert(rUndefined.confidence === 0.55, 'H4: undefined input gives confidence 0.55')

  const rJustSurname = formatAddressee({ fullName: 'Иванов', gender: GENDER_MALE })
  assert(rJustSurname.warnings.length > 0, 'H5: just surname generates warnings')
  assert(rJustSurname.manualReviewRequired === true, 'H5: just surname requires manual review')

  const rMaleUnknownPatronymic = formatAddressee({ fullName: 'Иванов Иван', gender: GENDER_MALE })
  assert(rMaleUnknownPatronymic.warnings.some((w) => w.code === WARNING_CODES.INCOMPLETE_NAME), 'H6: name without patronymic triggers incomplete warning')

  // I. Confidence logic
  console.log('\nI. Confidence logic')

  const rFull = formatAddressee({ fullName: 'Иванов Иван Петрович', position: 'директор', organization: 'ООО «Тест»', gender: GENDER_MALE })
  assert(rFull.confidence === 0.95 && !rFull.manualReviewRequired, 'I1: complete data = confidence 0.95, no manual review')

  const rUnknown = formatAddressee({ fullName: 'Иванов Иван', gender: GENDER_UNKNOWN })
  assert(rUnknown.confidence < 0.95, 'I2: unknown gender reduces confidence')
  assert(rUnknown.manualReviewRequired === true, 'I2: unknown gender requires manual review')

  // J. Result structure stability
  console.log('\nJ. Result structure stability')

  const stableInputs = [
    { fullName: 'Иванов Иван Петрович', position: 'директор', organization: 'ООО «Тест»', gender: GENDER_MALE, greetingMode: GREETING_NAME_PATRONYMIC, punctuation: PUNCTUATION_EXCLAMATION },
    { fullName: '', position: '', organization: '', gender: GENDER_UNKNOWN },
    { fullName: 'Test', position: 'Manager', organization: 'Corp', gender: GENDER_MALE },
  ]

  stableInputs.forEach((input, i) => {
    const r = formatAddressee(input)
    assert('blocks' in r, `J${i + 1}: result has blocks`)
    assert('warnings' in r, `J${i + 1}: result has warnings`)
    assert('confidence' in r, `J${i + 1}: result has confidence`)
    assert('manualReviewRequired' in r, `J${i + 1}: result has manualReviewRequired`)
    assert('parsedName' in r, `J${i + 1}: result has parsedName`)
    assert('to' in r.blocks, `J${i + 1}: blocks has to`)
    assert('from' in r.blocks, `J${i + 1}: blocks has from`)
    assert('greeting' in r.blocks, `J${i + 1}: blocks has greeting`)
    assert('letter' in r.blocks, `J${i + 1}: blocks has letter`)
    assert(Array.isArray(r.warnings), `J${i + 1}: warnings is array`)
    assert(typeof r.confidence === 'number', `J${i + 1}: confidence is number`)
  })

  // K. Warning codes
  console.log('\nK. Warning codes')

  const rIncomplete = formatAddressee({ fullName: 'Иванов' })
  assert(rIncomplete.warnings.every((w) => typeof w.code === 'string' && typeof w.message === 'string'), 'K1: all warnings have string code and message')

  const codes = rIncomplete.warnings.map((w) => w.code)
  assert(codes.every((c) => Object.values(WARNING_CODES).includes(c)), 'K2: all warning codes are from WARNING_CODES enum')

  // L. Letter block composition
  console.log('\nL. Letter block composition')

  const rLetter = formatAddressee({ fullName: 'Иванов Иван Петрович', position: 'директор', organization: 'ООО «Тест»', gender: GENDER_MALE })
  const letterLines = rLetter.blocks.letter.split('\n').filter((l) => l.trim().length > 0)
  assert(letterLines.length >= 2, 'L1: letter block has at least 2 non-empty lines')
  assert(rLetter.blocks.letter.includes(rLetter.blocks.greeting.trim()), 'L2: letter block includes greeting')

  // M. Expanded position dictionary
  console.log('\nM. Expanded position dictionary')

  const expandedPositions = [
    { position: 'специалист', expectedDative: 'специалисту' },
    { position: 'главный специалист', expectedDative: 'главному специалисту' },
    { position: 'администратор', expectedDative: 'администратору' },
    { position: 'оператор', expectedDative: 'оператору' },
    { position: 'аналитик', expectedDative: 'аналитику' },
    { position: 'инженер', expectedDative: 'инженеру' },
    { position: 'секретарь', expectedDative: 'секретарю' },
    { position: 'заместитель директора', expectedDative: 'заместителю директора' },
    { position: 'коммерческий директор', expectedDative: 'коммерческому директору' },
    { position: 'директор по продажам', expectedDative: 'директору по продажам' },
    { position: 'начальник отдела', expectedDative: 'начальнику отдела' },
    { position: 'руководитель отдела', expectedDative: 'руководителю отдела' },
    { position: 'менеджер проекта', expectedDative: 'менеджеру проекта' },
    { position: 'главный бухгалтер', expectedDative: 'главному бухгалтеру' },
    { position: 'юрисконсульт', expectedDative: 'юрисконсульту' },
  ]

  expandedPositions.forEach(({ position, expectedDative }, i) => {
    const r = formatAddressee({ fullName: 'Тестов Тест Тестович', position, gender: GENDER_MALE })
    const hasUnknownPosition = r.warnings.some((w) => w.code === WARNING_CODES.UNKNOWN_POSITION)
    assert(!hasUnknownPosition, `M${i + 1}: known position "${position}" has no UNKNOWN_POSITION warning`)
    assert(r.blocks.to.includes(expectedDative), `M${i + 1}: to block contains dative "${expectedDative}"`)
  })

  // N. First-name-only inputs
  console.log('\nN. First-name-only inputs')

  const firstNameOnlyCases = ['Иван', 'Анна', 'Сергей', 'Ольга']

  firstNameOnlyCases.forEach((fullName, i) => {
    const r = formatAddressee({ fullName, gender: GENDER_UNKNOWN })
    assert(r && typeof r.blocks.to === 'string', `N${i + 1}: "${fullName}" does not crash`)
    assert(r.warnings.some((w) => w.code === WARNING_CODES.INCOMPLETE_NAME), `N${i + 1}: "${fullName}" gives INCOMPLETE_NAME warning`)
    assert(r.confidence === 0.55 || r.confidence < 0.8, `N${i + 1}: "${fullName}" confidence is low`)
    assert(r.manualReviewRequired === true, `N${i + 1}: "${fullName}" requires manual review`)
  })

  // O. Auto-detected gender
  console.log('\nO. Auto-detected gender')

  const autoGenderCases = [
    { fullName: 'Иванов Иван Петрович', expectedName: 'Иван Петрович', expectedGreetingWord: 'уважаемый' },
    { fullName: 'Петрова Анна Сергеевна', expectedName: 'Анна Сергеевна', expectedGreetingWord: 'уважаемая' },
  ]

  autoGenderCases.forEach(({ fullName, expectedName, expectedGreetingWord }, i) => {
    const r = formatAddressee({ fullName, gender: GENDER_UNKNOWN, greetingMode: GREETING_NAME_PATRONYMIC })
    const hasGenderWarning = r.warnings.some((w) =>
      [WARNING_CODES.UNKNOWN_GENDER, WARNING_CODES.AUTO_DETECTED_GENDER].includes(w.code)
    )
    assert(r && typeof r.blocks.greeting === 'string', `O${i + 1}: "${fullName}" does not crash`)
    assert(r.blocks.greeting.includes(expectedName), `O${i + 1}: greeting includes "${expectedName}"`)
    assert(r.blocks.greeting.toLowerCase().includes(expectedGreetingWord), `O${i + 1}: greeting uses auto-detected form "${expectedGreetingWord}"`)
    assert(hasGenderWarning, `O${i + 1}: gender warning is present`)
    assert(r.confidence < 0.8 && r.manualReviewRequired === true, `O${i + 1}: auto gender keeps manual review required`)
  })

  // P. Ambiguous foreign surnames
  console.log('\nP. Ambiguous foreign surnames')

  const foreignSurnameCases = [
    'Ким Иван Петрович',
    'Ли Алексей Сергеевич',
    'Пак Анна Сергеевна',
    'Цой Виктор Иванович',
  ]

  foreignSurnameCases.forEach((fullName, i) => {
    const r = formatAddressee({ fullName, gender: GENDER_UNKNOWN })
    const hasUndeclinableWarning = r.warnings.some((w) => w.code === WARNING_CODES.UNDECLINABLE_SURNAME)
    assert(r && typeof r.blocks.to === 'string', `P${i + 1}: "${fullName}" does not crash`)
    assert(hasUndeclinableWarning, `P${i + 1}: "${fullName}" gives surname review warning`)
    assert(r.blocks.to.length > 0, `P${i + 1}: to block is non-empty`)
  })

  // Q. Regression checks
  console.log('\nQ. Regression checks')

  const rRegressionFull = formatAddressee({ fullName: 'Иванов Иван Петрович', position: 'генеральный директор', gender: GENDER_MALE })
  assert(rRegressionFull.confidence === 0.95, 'Q1: complete known male addressee still has confidence 0.95')

  const rRegressionSurname = formatAddressee({ fullName: 'Шевченко Иван Петрович', gender: GENDER_MALE })
  assert(rRegressionSurname.warnings.some((w) => w.code === WARNING_CODES.UNDECLINABLE_SURNAME), 'Q2: Шевченко still gives surname review warning')

  const rRegressionUnknownPosition = formatAddressee({ fullName: 'Иванов Иван Петрович', position: 'unknown position', gender: GENDER_MALE })
  assert(rRegressionUnknownPosition.warnings.some((w) => w.code === WARNING_CODES.UNKNOWN_POSITION), 'Q3: unknown position still gives UNKNOWN_POSITION')

  const rRegressionColleagues = formatAddressee({ fullName: 'Иванов Иван Петрович', gender: GENDER_UNKNOWN, greetingMode: GREETING_COLLEAGUES })
  assert(rRegressionColleagues.blocks.greeting === 'Уважаемые коллеги!', 'Q4: colleagues mode still gives "Уважаемые коллеги"')

  // R. Document templates
  console.log('\nR. Document templates')

  const templateBaseInput = {
    fullName: 'Иванов Иван Петрович',
    position: 'директор',
    organization: 'ООО «Ромашка»',
    gender: GENDER_MALE,
    senderFullName: 'Петрова Анна Сергеевна',
    senderPosition: 'менеджер',
    senderOrganization: 'ООО «Альфа»',
  }
  const includesText = (value, expected) =>
    String(value || '').toLowerCase().includes(String(expected || '').toLowerCase())
  const assertDocumentDraftQuality = (result, label, title, options = {}) => {
    const { shouldHaveGreeting = true, shouldHaveSensitiveNote = false } = options
    const docText = result.blocks.documentText || ''
    assert(typeof result.blocks.documentText === 'string', `${label}: returns documentText string`)
    assert(includesText(docText, title), `${label}: contains title "${title}"`)
    assert(docText.includes('Кому:'), `${label}: contains addressee label`)
    assert(docText.includes('От кого:'), `${label}: contains sender label`)
    assert(docText.includes(result.blocks.to), `${label}: contains formatted to block`)
    assert(docText.includes(String(result.blocks.from || '').replace(/^от\s+/i, '')), `${label}: contains formatted sender data`)
    assert(docText.includes('Дата:'), `${label}: contains date placeholder`)
    assert(docText.includes('Подпись:'), `${label}: contains signature placeholder`)
    assert(!docText.includes('undefined') && !docText.includes('null'), `${label}: has no undefined/null`)
    if (shouldHaveGreeting) {
      assert(docText.includes(result.blocks.greeting), `${label}: contains greeting`)
    } else {
      assert(!docText.includes(result.blocks.greeting), `${label}: omits greeting when not appropriate`)
    }
    if (shouldHaveSensitiveNote) {
      assert(includesText(docText, 'заготовка'), `${label}: marks sensitive template as draft`)
      assert(includesText(docText, 'проверьте'), `${label}: asks user to review sensitive draft`)
    }
  }

  const rNoTemplate = formatAddressee(templateBaseInput)
  assert(typeof rNoTemplate.blocks.documentText === 'string', 'R1: documentTemplate defaults to businessLetter')
  assert(rNoTemplate.blocks.greeting, 'R1: greeting exists without documentTemplate')
  assert(rNoTemplate.confidence > 0, 'R1: confidence is not broken by missing documentTemplate')
  assertDocumentDraftQuality(rNoTemplate, 'R1: default businessLetter draft', 'ДЕЛОВОЕ ПИСЬМО')

  const templateQualityCases = [
    { template: DOCUMENT_TEMPLATE_BUSINESS_LETTER, label: 'R2: businessLetter', title: 'ДЕЛОВОЕ ПИСЬМО' },
    { template: DOCUMENT_TEMPLATE_APPLICATION, label: 'R3: application', title: 'ЗАЯВЛЕНИЕ', shouldHaveSensitiveNote: true },
    { template: DOCUMENT_TEMPLATE_POWER_OF_ATTORNEY, label: 'R4: powerOfAttorney', title: 'ДОВЕРЕННОСТЬ', shouldHaveGreeting: false, shouldHaveSensitiveNote: true },
    { template: DOCUMENT_TEMPLATE_ORDER, label: 'R5: order', title: 'ПРИКАЗ', shouldHaveGreeting: false },
    { template: DOCUMENT_TEMPLATE_MEMO, label: 'R6: memo', title: 'СЛУЖЕБНАЯ ЗАПИСКА' },
    { template: DOCUMENT_TEMPLATE_COMPLAINT, label: 'R9: complaint', title: 'ЖАЛОБА', shouldHaveSensitiveNote: true },
    { template: DOCUMENT_TEMPLATE_REQUEST, label: 'R10: request', title: 'ЗАПРОС' },
    { template: DOCUMENT_TEMPLATE_EXPLANATORY_NOTE, label: 'R11: explanatoryNote', title: 'ОБЪЯСНИТЕЛЬНАЯ ЗАПИСКА', shouldHaveSensitiveNote: true },
    { template: DOCUMENT_TEMPLATE_COMMERCIAL_OFFER, label: 'R12: commercialOffer', title: 'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ' },
  ]
  for (const item of templateQualityCases) {
    const result = formatAddressee({ ...templateBaseInput, documentTemplate: item.template })
    assertDocumentDraftQuality(result, item.label, item.title, item)
  }

  const rUnknownTemplate = formatAddressee({ ...templateBaseInput, documentTemplate: 'unknownTemplate' })
  assert(typeof rUnknownTemplate.blocks.documentText === 'string', 'R7: unknown template falls back to businessLetter')
  assert(rUnknownTemplate.blocks.greeting, 'R7: unknown template does not break greeting')
  assertDocumentDraftQuality(rUnknownTemplate, 'R7: unknown template fallback draft', 'ДЕЛОВОЕ ПИСЬМО')

  const rTemplateWithWarnings = formatAddressee({ fullName: 'Иванов', position: 'unknown', gender: GENDER_UNKNOWN, documentTemplate: DOCUMENT_TEMPLATE_APPLICATION })
  assert(typeof rTemplateWithWarnings.blocks.documentText === 'string', 'R8: template with warnings returns documentText')
  assert(Array.isArray(rTemplateWithWarnings.warnings), 'R8: warnings work with documentTemplate')
  assert(rTemplateWithWarnings.confidence < 0.95, 'R8: confidence works with documentTemplate')

  const sensitiveTemplates = [
    { template: DOCUMENT_TEMPLATE_APPLICATION, name: 'application' },
    { template: DOCUMENT_TEMPLATE_COMPLAINT, name: 'complaint' },
    { template: DOCUMENT_TEMPLATE_POWER_OF_ATTORNEY, name: 'powerOfAttorney' },
    { template: DOCUMENT_TEMPLATE_EXPLANATORY_NOTE, name: 'explanatoryNote' },
  ]
  for (const { template, name } of sensitiveTemplates) {
    const result = formatAddressee({ ...templateBaseInput, documentTemplate: template })
    const hasTemplateReview = result.warnings.some((w) => w.code === WARNING_CODES.TEMPLATE_REVIEW)
    assert(hasTemplateReview, `R13: ${name} returns TEMPLATE_REVIEW warning`)
    assert(typeof result.blocks.documentText === 'string' && result.blocks.documentText.length > 0, `R13: ${name} has non-empty documentText`)
    assert(includesText(result.blocks.documentText, 'проверьте'), `R13: ${name} documentText has neutral review wording`)
  }

  // S. Extra name parts and Latin name warnings
  console.log('\nS. Extra name parts and Latin name warnings')

  const rExtraParts = formatAddressee({ fullName: 'Иванов Иван Петрович Николаевич', gender: GENDER_MALE })
  const hasExtraPartsWarning = rExtraParts.warnings.some((w) => w.code === WARNING_CODES.EXTRA_NAME_PARTS)
  assert(hasExtraPartsWarning, 'S1: 4-part name gives EXTRA_NAME_PARTS warning')
  assert(rExtraParts.confidence < 0.95, 'S1: 4-part name reduces confidence')

  const rExtraPartsUnknown = formatAddressee({ fullName: 'Петрова Анна Сергеевна Владимировна', gender: GENDER_FEMALE })
  const hasExtraPartsWarningF = rExtraPartsUnknown.warnings.some((w) => w.code === WARNING_CODES.EXTRA_NAME_PARTS)
  assert(hasExtraPartsWarningF, 'S2: 4-part female name gives EXTRA_NAME_PARTS warning')

  const rLatinName = formatAddressee({ fullName: 'Ivanov Ivan Petrovich', gender: GENDER_MALE })
  const hasLatinWarning = rLatinName.warnings.some((w) => w.code === WARNING_CODES.LATIN_NAME)
  assert(hasLatinWarning, 'S3: Latin-only name gives LATIN_NAME warning')
  assert(rLatinName.confidence < 0.95, 'S3: Latin name reduces confidence')

  const rMixedName = formatAddressee({ fullName: 'Иванов Ivan Петрович', gender: GENDER_MALE })
  const hasMixedLatinWarning = rMixedName.warnings.some((w) => w.code === WARNING_CODES.LATIN_NAME)
  assert(hasMixedLatinWarning, 'S4: mixed Cyrillic/Latin name gives LATIN_NAME warning')

  const rNormalName = formatAddressee({ fullName: 'Иванов Иван Петрович', gender: GENDER_MALE })
  const hasNormalExtraParts = rNormalName.warnings.some((w) => w.code === WARNING_CODES.EXTRA_NAME_PARTS)
  assert(!hasNormalExtraParts, 'S5: normal 3-part name has no EXTRA_NAME_PARTS warning')
  const hasNormalLatin = rNormalName.warnings.some((w) => w.code === WARNING_CODES.LATIN_NAME)
  assert(!hasNormalLatin, 'S5: normal Cyrillic name has no LATIN_NAME warning')
  assert(rNormalName.confidence === 0.95, 'S5: normal name has confidence 0.95')

  // T. New warning codes (INITIALS_DETECTED, HYPHENATED_NAME_REVIEW)
  console.log('\nT. New warning codes')

  const rInitials = formatAddressee({ fullName: 'Иванов И. И.', gender: GENDER_MALE })
  const hasInitialsWarning = rInitials.warnings.some((w) => w.code === WARNING_CODES.INITIALS_DETECTED)
  assert(hasInitialsWarning, 'T1: initials "Иванов И. И." gives INITIALS_DETECTED warning')
  assert(rInitials.confidence < 0.95, 'T1: initials reduce confidence below high')

  const rInitials2 = formatAddressee({ fullName: 'Иванов И.П.', gender: GENDER_MALE })
  const hasInitialsWarning2 = rInitials2.warnings.some((w) => w.code === WARNING_CODES.INITIALS_DETECTED)
  assert(hasInitialsWarning2, 'T2: initials "Иванов И.П." gives INITIALS_DETECTED warning')

  const rHyphen = formatAddressee({ fullName: 'Анна-Мария Иванова', gender: GENDER_FEMALE })
  const hasHyphenWarning = rHyphen.warnings.some((w) => w.code === WARNING_CODES.HYPHENATED_NAME_REVIEW)
  assert(hasHyphenWarning, 'T3: hyphen name "Анна-Мария Иванова" gives HYPHENATED_NAME_REVIEW warning')
  assert(rHyphen.blocks.to.includes('Анна-Мария'), 'T3: hyphen name is preserved in output')

  const rHyphenSalted = formatAddressee({ fullName: 'Салтыков-Щедрин Михаил Евграфович', gender: GENDER_MALE })
  const hasHyphenSaltedWarning = rHyphenSalted.warnings.some((w) => w.code === WARNING_CODES.HYPHENATED_NAME_REVIEW)
  assert(hasHyphenSaltedWarning, 'T4: hyphen surname "Салтыков-Щедрин" gives HYPHENATED_NAME_REVIEW warning')
  assert(rHyphenSalted.blocks.to.includes('Салтыков-Щедрин'), 'T4: hyphen surname is preserved in output')

  const rLatinJohn = formatAddressee({ fullName: 'John Smith', gender: GENDER_MALE })
  const latinJohnHasWarning = rLatinJohn.warnings.some((w) => w.code === WARNING_CODES.LATIN_NAME)
  assert(latinJohnHasWarning, 'T5: Latin name "John Smith" gives LATIN_NAME warning')
  assert(rLatinJohn.confidence < 0.95, 'T5: Latin name confidence is not high')
  assert(rLatinJohn.blocks.to.includes('John Smith'), 'T5: Latin name is preserved in output')

  const rMixed = formatAddressee({ fullName: 'Иванов Ivan Петрович', gender: GENDER_MALE })
  const mixedHasWarning = rMixed.warnings.some((w) => w.code === WARNING_CODES.LATIN_NAME)
  assert(mixedHasWarning, 'T6: mixed Cyrillic/Latin gives LATIN_NAME warning')
  assert(rMixed.confidence < 0.95, 'T6: mixed name confidence is not high')

  // U. Sender fields regression
  console.log('\nU. Sender fields regression')

  const rWithSender = formatAddressee({
    fullName: 'Иванов Иван Петрович',
    position: 'генеральный директор',
    organization: 'ООО «Ромашка»',
    senderFullName: 'Петрова Анна Сергеевна',
    senderPosition: 'менеджер по продажам',
    senderOrganization: 'ООО «Альфа»',
    gender: GENDER_MALE,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  })
  assert(rWithSender.blocks.from.includes('Петровой'), 'U1: from block contains sender full name in genitive')
  assert(rWithSender.blocks.from.includes('менеджер'), 'U2: from block contains sender position')
  assert(rWithSender.blocks.from.includes('Альфа'), 'U3: from block contains sender organization')

  const rWithSenderApp = formatAddressee({
    fullName: 'Иванов Иван Петрович',
    position: 'генеральный директор',
    organization: 'ООО «Ромашка»',
    senderFullName: 'Петрова Анна Сергеевна',
    senderPosition: 'менеджер по продажам',
    senderOrganization: 'ООО «Альфа»',
    gender: GENDER_MALE,
    documentTemplate: DOCUMENT_TEMPLATE_APPLICATION,
  })
  assert(rWithSenderApp.blocks.documentText.includes('Петровой'), 'U4: application documentText contains sender data in genitive')

  const rEmptySender = formatAddressee({
    fullName: 'Иванов Иван Петрович',
    position: 'генеральный директор',
    organization: 'ООО «Ромашка»',
    senderFullName: '',
    senderPosition: '',
    senderOrganization: '',
    gender: GENDER_MALE,
  })
  assert(rEmptySender.blocks.from === '', 'U5: empty sender fields produce empty from block')
  assert(typeof rEmptySender.blocks.from === 'string', 'U5: from block is string (even if empty)')

  // V. Safe name declension and manual case overrides
  console.log('\nV. Safe name declension and manual case overrides')

  const rSafeMaleRecipient = formatAddressee({ fullName: 'Иванов Иван Петрович', gender: GENDER_MALE })
  assert(rSafeMaleRecipient.blocks.to.includes('Иванову Ивану Петровичу'), 'V1: safe male recipient is declined to dative')
  assert(!rSafeMaleRecipient.warnings.some((w) => w.code === WARNING_CODES.NAME_CASE_UNCERTAIN), 'V1: safe male recipient has no name-case warning')

  const rSafeMaleSender = formatAddressee({
    fullName: 'Петрова Анна Сергеевна',
    gender: GENDER_FEMALE,
    senderFullName: 'Иванов Иван Петрович',
  })
  assert(rSafeMaleSender.blocks.from.includes('от Иванова Ивана Петровича'), 'V2: safe male sender is declined to genitive')
  assert(!rSafeMaleSender.blocks.from.includes('от от'), 'V2: safe male sender has no duplicated "от"')

  const rSafeFemaleRecipient = formatAddressee({ fullName: 'Петрова Анна Сергеевна', gender: GENDER_FEMALE })
  assert(rSafeFemaleRecipient.blocks.to.includes('Петровой Анне Сергеевне'), 'V3: safe female recipient is declined to dative')
  assert(!rSafeFemaleRecipient.warnings.some((w) => w.code === WARNING_CODES.NAME_CASE_UNCERTAIN), 'V3: safe female recipient has no name-case warning')

  const rSafeFemaleSender = formatAddressee({
    fullName: 'Иванов Иван Петрович',
    gender: GENDER_MALE,
    senderFullName: 'Петрова Анна Сергеевна',
  })
  assert(rSafeFemaleSender.blocks.from.includes('от Петровой Анны Сергеевны'), 'V4: safe female sender is declined to genitive')

  const rManualCase = formatAddressee({
    fullName: 'Иванов Иван Петрович',
    gender: GENDER_MALE,
    recipientDativeName: 'Иванову Ивану Петровичу',
    senderFullName: 'Петрова Анна Сергеевна',
    senderGenitiveName: 'от Петровой Анны Сергеевны',
  })
  assert(rManualCase.blocks.to.includes('Иванову Ивану Петровичу'), 'V5: manual recipient dative form is used')
  assert(rManualCase.blocks.from.includes('от Петровой Анны Сергеевны'), 'V5: manual sender genitive form is used')
  assert(!rManualCase.blocks.from.includes('от от'), 'V5: manual sender genitive form does not duplicate "от"')
  assert(rManualCase.warnings.filter((w) => w.code === WARNING_CODES.NAME_CASE_MANUAL).length >= 2, 'V5: manual case warnings are present')
  assert(rManualCase.confidence === 0.95, 'V5: manual case form is not treated as an error')
  const rManualDocument = formatAddressee({
    fullName: 'Иванов Иван Петрович',
    gender: GENDER_MALE,
    documentTemplate: DOCUMENT_TEMPLATE_APPLICATION,
    recipientDativeName: 'Иванову Ивану Петровичу',
    senderFullName: 'Петрова Анна Сергеевна',
    senderGenitiveName: 'Петровой Анны Сергеевны',
  })
  assert(rManualDocument.blocks.documentText.includes('Иванову Ивану Петровичу'), 'V5: documentText uses manual recipient form')
  assert(rManualDocument.blocks.documentText.includes('Петровой Анны Сергеевны'), 'V5: documentText uses manual sender form')

  const rTroitskyUnknown = formatAddressee({
    fullName: 'Троицкий Григорий Владимирович',
    position: 'генеральный директор',
    organization: 'ООО «Ромашка»',
    gender: GENDER_UNKNOWN,
    senderFullName: 'Троицкий Арсений Григорьевич',
    senderPosition: 'Менеджер',
    senderOrganization: 'ООО «Альфа»',
    documentTemplate: DOCUMENT_TEMPLATE_APPLICATION,
  })
  assert(rTroitskyUnknown.blocks.to.includes('Троицкому Григорию Владимировичу'), 'V6: unknown gender recipient with -ич patronymic is declined to dative')
  assert(rTroitskyUnknown.blocks.from.includes('от Троицкого Арсения Григорьевича'), 'V6: sender is declined to genitive')
  assert(rTroitskyUnknown.blocks.documentText.includes('Троицкому Григорию Владимировичу'), 'V6: documentText uses declined recipient')
  assert(rTroitskyUnknown.blocks.documentText.includes('Троицкого Арсения Григорьевича'), 'V6: documentText uses declined sender')
  assert(rTroitskyUnknown.blocks.toBlock === rTroitskyUnknown.blocks.to, 'V6: toBlock aliases declined to block')
  assert(rTroitskyUnknown.blocks.fromBlock === rTroitskyUnknown.blocks.from, 'V6: fromBlock aliases declined from block')
  assert(rTroitskyUnknown.blocks.fullPreview === rTroitskyUnknown.blocks.documentText, 'V6: fullPreview aliases declined documentText')

  const riskyNameChecks = [
    ['Иванов И. И.', GENDER_MALE, WARNING_CODES.INITIALS_DETECTED],
    ['John Smith', GENDER_MALE, WARNING_CODES.LATIN_NAME],
    ['Цой Виктор Робертович', GENDER_MALE, WARNING_CODES.UNDECLINABLE_SURNAME],
    ['Ли Анна Сергеевна', GENDER_FEMALE, WARNING_CODES.UNDECLINABLE_SURNAME],
    ['Салтыков-Щедрин Михаил Евграфович', GENDER_MALE, WARNING_CODES.HYPHENATED_NAME_REVIEW],
  ]
  for (const [fullName, gender, warningCode] of riskyNameChecks) {
    const r = formatAddressee({ fullName, gender })
    assert(r.warnings.some((w) => w.code === warningCode), `V6: risky "${fullName}" gives ${warningCode}`)
    assert(r.confidence < 0.95, `V6: risky "${fullName}" does not keep high confidence`)
    assert(r.blocks.to.includes(fullName), `V6: risky "${fullName}" is preserved in to block`)
  }

  const directRisky = [
    ['Иванов И. И.', GENDER_MALE, WARNING_CODES.INITIALS_DETECTED],
    ['John Smith', GENDER_MALE, WARNING_CODES.LATIN_NAME],
    ['Цой Виктор Робертович', GENDER_MALE, WARNING_CODES.UNDECLINABLE_SURNAME],
    ['Ли Анна Сергеевна', GENDER_FEMALE, WARNING_CODES.UNDECLINABLE_SURNAME],
    ['Салтыков-Щедрин Михаил Евграфович', GENDER_MALE, WARNING_CODES.HYPHENATED_NAME_REVIEW],
  ]
  for (const [fullName, gender, warningCode] of directRisky) {
    const d = declineRussianFullName(fullName, gender, CASE_DATIVE)
    assert(d.declined === fullName, `V7: direct declension preserves risky "${fullName}"`)
    assert(d.warnings.some((w) => w.code === warningCode), `V7: direct declension reports ${warningCode}`)
  }

  const unsupportedCase = declineRussianFullName('Иванов Иван Петрович', GENDER_MALE, 'instrumental')
  assert(unsupportedCase.declined === 'Иванов Иван Петрович', 'V8: unsupported case returns original full name')
  assert(unsupportedCase.warned && unsupportedCase.reason === 'unsupported_case', 'V8: unsupported case is explicitly warned')

  const extraParts = declineRussianFullName('Иванов Иван Петрович младший', GENDER_MALE, CASE_DATIVE)
  assert(extraParts.declined === 'Иванов Иван Петрович младший', 'V9: extra name parts are preserved')
  assert(extraParts.warnings.some((w) => w.code === WARNING_CODES.EXTRA_NAME_PARTS), 'V9: extra name parts are warned')

  const assertDeclines = (fullName, gender, targetCase, expected, label) => {
    const r = declineRussianFullName(fullName, gender, targetCase)
    assert(r.declined === expected, label)
    assert(!r.warned, `${label} has no warning`)
    assert(r.confidence === 0.95, `${label} has high confidence`)
  }

  const maleSurnameCases = [
    ['Иванов', 'Иванову', 'Иванова'],
    ['Петров', 'Петрову', 'Петрова'],
    ['Сергеев', 'Сергееву', 'Сергеева'],
    ['Ильин', 'Ильину', 'Ильина'],
  ]
  for (const [surname, dative, genitive] of maleSurnameCases) {
    assertDeclines(`${surname} Иван Петрович`, GENDER_MALE, CASE_DATIVE, `${dative} Ивану Петровичу`, `V10: male surname ${surname} dative`)
    assertDeclines(`${surname} Иван Петрович`, GENDER_MALE, CASE_GENITIVE, `${genitive} Ивана Петровича`, `V10: male surname ${surname} genitive`)
  }

  const femaleSurnameCases = [
    ['Петрова', 'Петровой', 'Петровой'],
    ['Иванова', 'Ивановой', 'Ивановой'],
    ['Сергеева', 'Сергеевой', 'Сергеевой'],
    ['Ильина', 'Ильиной', 'Ильиной'],
  ]
  for (const [surname, dative, genitive] of femaleSurnameCases) {
    assertDeclines(`${surname} Анна Сергеевна`, GENDER_FEMALE, CASE_DATIVE, `${dative} Анне Сергеевне`, `V11: female surname ${surname} dative`)
    assertDeclines(`${surname} Анна Сергеевна`, GENDER_FEMALE, CASE_GENITIVE, `${genitive} Анны Сергеевны`, `V11: female surname ${surname} genitive`)
  }

  const maleFirstNameCases = [
    ['Иван', 'Ивану', 'Ивана'],
    ['Сергей', 'Сергею', 'Сергея'],
    ['Александр', 'Александру', 'Александра'],
    ['Алексей', 'Алексею', 'Алексея'],
    ['Дмитрий', 'Дмитрию', 'Дмитрия'],
    ['Пётр', 'Петру', 'Петра'],
    ['Петр', 'Петру', 'Петра'],
  ]
  for (const [name, dative, genitive] of maleFirstNameCases) {
    assertDeclines(`Иванов ${name} Петрович`, GENDER_MALE, CASE_DATIVE, `Иванову ${dative} Петровичу`, `V12: male first name ${name} dative`)
    assertDeclines(`Иванов ${name} Петрович`, GENDER_MALE, CASE_GENITIVE, `Иванова ${genitive} Петровича`, `V12: male first name ${name} genitive`)
  }

  const femaleFirstNameCases = [
    ['Анна', 'Анне', 'Анны'],
    ['Мария', 'Марии', 'Марии'],
    ['Ольга', 'Ольге', 'Ольги'],
    ['Елена', 'Елене', 'Елены'],
    ['Наталья', 'Наталье', 'Натальи'],
    ['Юлия', 'Юлии', 'Юлии'],
    ['Анастасия', 'Анастасии', 'Анастасии'],
  ]
  for (const [name, dative, genitive] of femaleFirstNameCases) {
    assertDeclines(`Петрова ${name} Сергеевна`, GENDER_FEMALE, CASE_DATIVE, `Петровой ${dative} Сергеевне`, `V13: female first name ${name} dative`)
    assertDeclines(`Петрова ${name} Сергеевна`, GENDER_FEMALE, CASE_GENITIVE, `Петровой ${genitive} Сергеевны`, `V13: female first name ${name} genitive`)
  }

  const malePatronymicCases = [
    ['Петрович', 'Петровичу', 'Петровича'],
    ['Иванович', 'Ивановичу', 'Ивановича'],
    ['Сергеевич', 'Сергеевичу', 'Сергеевича'],
  ]
  for (const [patronymic, dative, genitive] of malePatronymicCases) {
    assertDeclines(`Иванов Иван ${patronymic}`, GENDER_MALE, CASE_DATIVE, `Иванову Ивану ${dative}`, `V14: male patronymic ${patronymic} dative`)
    assertDeclines(`Иванов Иван ${patronymic}`, GENDER_MALE, CASE_GENITIVE, `Иванова Ивана ${genitive}`, `V14: male patronymic ${patronymic} genitive`)
  }

  const femalePatronymicCases = [
    ['Сергеевна', 'Сергеевне', 'Сергеевны'],
    ['Ивановна', 'Ивановне', 'Ивановны'],
    ['Петровна', 'Петровне', 'Петровны'],
  ]
  for (const [patronymic, dative, genitive] of femalePatronymicCases) {
    assertDeclines(`Петрова Анна ${patronymic}`, GENDER_FEMALE, CASE_DATIVE, `Петровой Анне ${dative}`, `V15: female patronymic ${patronymic} dative`)
    assertDeclines(`Петрова Анна ${patronymic}`, GENDER_FEMALE, CASE_GENITIVE, `Петровой Анны ${genitive}`, `V15: female patronymic ${patronymic} genitive`)
  }

  // Summary
  console.log('\n=== Results ===')
  const total = passed + failed
  if (failed === 0) {
    console.log(`\nAll checks passed: ${passed}/${total}\n`)
    process.exit(0)
  } else {
    console.log(`\nAddressee formatter checks FAILED: ${passed}/${total} passed, ${failed} failed\n`)
    process.exit(1)
  }
}

run()
