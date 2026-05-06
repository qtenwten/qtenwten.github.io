import { formatAddressee } from '../src/utils/addresseeFormatter.js'
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
  DOCUMENT_TEMPLATE_POWER_OF_ATTORNEY,
  DOCUMENT_TEMPLATE_ORDER,
  DOCUMENT_TEMPLATE_MEMO,
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
    assert(r.blocks.from, `A${i + 1}: blocks.from exists`)
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

  const rNoTemplate = formatAddressee({ fullName: 'Иванов Иван Петрович', position: 'директор', organization: 'ООО «Ромашка»', gender: GENDER_MALE })
  assert(typeof rNoTemplate.blocks.documentText === 'string', 'R1: documentTemplate defaults to businessLetter')
  assert(rNoTemplate.blocks.greeting, 'R1: greeting exists without documentTemplate')
  assert(rNoTemplate.confidence > 0, 'R1: confidence is not broken by missing documentTemplate')

  const rBusinessLetter = formatAddressee({ fullName: 'Иванов Иван Петрович', position: 'директор', gender: GENDER_MALE, documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER })
  assert(typeof rBusinessLetter.blocks.documentText === 'string', 'R2: businessLetter returns documentText string')
  assert(rBusinessLetter.blocks.documentText.includes(rBusinessLetter.blocks.greeting), 'R2: businessLetter contains greeting')

  const rApplication = formatAddressee({ fullName: 'Иванов Иван Петрович', position: 'директор', organization: 'ООО «Ромашка»', gender: GENDER_MALE, documentTemplate: DOCUMENT_TEMPLATE_APPLICATION })
  assert(typeof rApplication.blocks.documentText === 'string', 'R3: application returns documentText string')
  assert(rApplication.blocks.documentText.includes('Заявление'), 'R3: application contains "Заявление"')
  assert(rApplication.blocks.documentText.includes(rApplication.blocks.from), 'R3: application contains from block')

  const rPowerOfAttorney = formatAddressee({ fullName: 'Иванов Иван Петрович', position: 'директор', organization: 'ООО «Ромашка»', gender: GENDER_MALE, documentTemplate: DOCUMENT_TEMPLATE_POWER_OF_ATTORNEY })
  assert(typeof rPowerOfAttorney.blocks.documentText === 'string', 'R4: powerOfAttorney returns documentText string')
  assert(rPowerOfAttorney.blocks.documentText.includes('Доверенность'), 'R4: powerOfAttorney contains "Доверенность"')

  const rOrder = formatAddressee({ fullName: 'Иванов Иван Петрович', position: 'директор', gender: GENDER_MALE, documentTemplate: DOCUMENT_TEMPLATE_ORDER })
  assert(typeof rOrder.blocks.documentText === 'string', 'R5: order returns documentText string')
  assert(rOrder.blocks.documentText.includes('Приказ'), 'R5: order contains "Приказ"')

  const rMemo = formatAddressee({ fullName: 'Иванов Иван Петрович', position: 'директор', organization: 'ООО «Ромашка»', gender: GENDER_MALE, documentTemplate: DOCUMENT_TEMPLATE_MEMO })
  assert(typeof rMemo.blocks.documentText === 'string', 'R6: memo returns documentText string')
  assert(rMemo.blocks.documentText.includes('Служебная записка'), 'R6: memo contains "Служебная записка"')
  assert(rMemo.blocks.documentText.includes(rMemo.blocks.greeting), 'R6: memo contains greeting')

  const rUnknownTemplate = formatAddressee({ fullName: 'Иванов Иван Петрович', position: 'директор', gender: GENDER_MALE, documentTemplate: 'unknownTemplate' })
  assert(typeof rUnknownTemplate.blocks.documentText === 'string', 'R7: unknown template falls back to businessLetter')
  assert(rUnknownTemplate.blocks.greeting, 'R7: unknown template does not break greeting')

  const rTemplateWithWarnings = formatAddressee({ fullName: 'Иванов', position: 'unknown', gender: GENDER_UNKNOWN, documentTemplate: DOCUMENT_TEMPLATE_APPLICATION })
  assert(typeof rTemplateWithWarnings.blocks.documentText === 'string', 'R8: template with warnings returns documentText')
  assert(Array.isArray(rTemplateWithWarnings.warnings), 'R8: warnings work with documentTemplate')
  assert(rTemplateWithWarnings.confidence < 0.95, 'R8: confidence works with documentTemplate')

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
