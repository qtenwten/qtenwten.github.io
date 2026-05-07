const fs = require('fs')
const path = require('path')

const rootDir = path.join(__dirname, '..')

function readFile(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf-8')
}

function readJson(relativePath) {
  return JSON.parse(readFile(relativePath))
}

let passed = 0, total = 0
function check(cond, msg) {
  total++
  if (cond) { passed++; console.log('  PASS:', msg) }
  else { console.log('  FAIL:', msg) }
}

console.log('\n=== Addressee CSV Import Checks ===')

const {
  detectDelimiter,
  parseCsvLine,
  normalizeColumnKey,
  buildColumnIndex,
  mapRowToFormData,
  validateRowData,
  detectUnknownColumns,
  parseCsvText,
  toCsvRow,
  getCsvTemplate,
} = require('../src/utils/addresseeCsv.js')

const {
  buildBulkCsvExport,
} = require('../src/utils/addresseeCsv.js')

// 1. semicolon delimiter detection
const t1 = 'fullName;position;organization'
check(detectDelimiter(t1) === ';', '1. detectDelimiter finds semicolon')

// 2. comma delimiter detection
const t2 = 'fullName,position,organization'
check(detectDelimiter(t2) === ',', '2. detectDelimiter finds comma')

// 3. tab delimiter detection
const t3 = 'fullName\tposition\torganization'
check(detectDelimiter(t3) === '\t', '3. detectDelimiter finds tab')

// 4. semicolon CSV parses
const t4 = 'fullName;position;organization\nИванов Иван Петрович;директор;ООО Ромашка'
const r4 = parseCsvText(t4)
check(r4.rows.length === 1, '4. semicolon CSV parses')
check(r4.rows[0].data.fullName === 'Иванов Иван Петрович', '4. semicolon row fullName correct')

// 5. comma CSV parses
const t5 = 'fullName,position,organization\nИванов Иван Петрович,директор,ООО Ромашка'
const r5 = parseCsvText(t5)
check(r5.rows.length === 1, '5. comma CSV parses')
check(r5.rows[0].data.organization === 'ООО Ромашка', '5. comma CSV org correct')

// 6. header-based mapping works with reordered columns
const t6 = 'organization;fullName;position\nООО Ромашка;Иванов Иван Петрович;директор'
const r6 = parseCsvText(t6)
check(r6.rows.length === 1, '6. reordered columns parses')
check(r6.rows[0].data.fullName === 'Иванов Иван Петрович', '6. reordered fullName correct')
check(r6.rows[0].data.organization === 'ООО Ромашка', '6. reordered org correct')
check(r6.rows[0].data.position === 'директор', '6. reordered position correct')

// 7. old positional rows still work (no header fallback)
const t7 = 'Иванов Иван Петрович;директор;ООО Ромашка\nСидорова Мария;бухгалтер;АО Север'
const r7 = parseCsvText(t7)
check(r7.rows.length === 2, '7. no-header data parses as bulk text')
check(r7.rows[0].data.fullName === 'Иванов Иван Петрович', '7. no-header row 1 correct')

// 8. quoted values parse
const t8 = 'fullName;position;organization\nИванов Иван Петрович;директор;"ООО ""Ромашка"""'
const r8 = parseCsvText(t8)
check(r8.rows.length === 1, '8. quoted values parse')
check(r8.rows[0].data.organization === 'ООО "Ромашка"', '8. quoted values unescaped')

// 9. escaped quotes parse
const t9 = 'fullName;position\n"Иванов ""Иван"" Петрович";директор'
const r9 = parseCsvText(t9)
check(r9.rows.length === 1, '9. escaped quotes parse')

// 10. multiline quoted field — controlled error or parsing
const t10 = 'fullName;position;organization\nИванов Иван Петрович;директор;"ООО\nРомашка"'
const r10 = parseCsvText(t10)
check(r10.rows.length === 1 || r10.errors.length > 0, '10. multiline quoted field handled (parse or error)')

// 11. missing fullName column error
const t11 = 'position;organization\ngeneral director;ООО Ромашка'
const r11 = parseCsvText(t11)
check(r11.errors && r11.errors.length > 0, '11. missing fullName column returns error')
check(r11.errors[0].code === 'MISSING_FULLNAME', '11. error code is MISSING_FULLNAME')

// 12. empty fullName row error with row number
const t12 = 'fullName;position;organization\n;директор;ООО Ромашка'
const r12 = parseCsvText(t12)
check(r12.errors && r12.errors.length > 0, '12. empty fullName row returns error')
check(r12.errors.some((e) => e.code === 'EMPTY_FULLNAME'), '12. error contains EMPTY_FULLNAME code')

// 13. unknown columns warning
const t13 = 'fullName;position;organization;gender;greetingMode;punctuation;documentTemplate;senderFullName;senderPosition;senderOrganization;recipientDativeName;senderGenitiveName;extraCol1\nИванов Иван Петрович;директор;ООО Ромашка;male;namePatronymic;!;businessLetter;Петрова Анна;менеджер;ООО Альфа;Иванову Ивану Петровичу;Петровой Анны;extra1'
const r13 = parseCsvText(t13)
check(r13.unknownColumns.length > 0, '13. unknown columns detected')
check(r13.unknownColumns.includes('extracol1'), '13. unknown column extrCol1 detected')

// 14. invalid gender error
const t14 = 'fullName;position;organization;gender\nИванов Иван Петрович;директор;ООО Ромашка;invalid_gender'
const r14 = parseCsvText(t14)
check(r14.errors && r14.errors.some((e) => e.code === 'INVALID_GENDER'), '14. invalid gender gives error')

// 15. invalid documentTemplate error
const t15 = 'fullName;position;organization;documentTemplate\nИванов Иван Петрович;директор;ООО Ромашка;invalid_template'
const r15 = parseCsvText(t15)
check(r15.errors && r15.errors.some((e) => e.code === 'INVALID_DOCUMENT_TEMPLATE'), '15. invalid documentTemplate gives error')

// 16. recipientDativeName imported
const t16 = 'fullName;position;organization;recipientDativeName;senderGenitiveName\nИванов Иван Петрович;директор;ООО Ромашка;Иванову Ивану Петровичу;Петровой Анны Сергеевны'
const r16 = parseCsvText(t16)
check(r16.rows.length === 1, '16. recipientDativeName row parsed')
check(r16.rows[0].data.recipientDativeName === 'Иванову Ивану Петровичу', '16. recipientDativeName preserved')

// 17. senderGenitiveName imported
check(r16.rows[0].data.senderGenitiveName === 'Петровой Анны Сергеевны', '17. senderGenitiveName preserved')

// 18. too many rows error
const manyRows = 'fullName;position;organization\n' + Array(51).fill('Иванов Иван Петрович;директор;ООО').join('\n')
const r18 = parseCsvText(manyRows)
check(r18.errors && r18.errors.length > 0, '18. 51 rows returns error')
check(r18.errors[0].code === 'TOO_MANY_ROWS', '18. error code is TOO_MANY_ROWS')

// 19. CSV template contains required columns
const template = getCsvTemplate()
check(template.includes('fullName'), '19. template has fullName column')
check(template.includes('position'), '19. template has position column')
check(template.includes('organization'), '19. template has organization column')
check(template.includes('recipientDativeName'), '19. template has recipientDativeName column')
check(template.includes('senderGenitiveName'), '19. template has senderGenitiveName column')
check(template.includes('documentTemplate'), '19. template has documentTemplate column')

// 20. CSV template has BOM
check(template.charCodeAt(0) === 0xFEFF, '20. template has UTF-8 BOM')

// 21. CSV template has data rows
const templateLines = template.replace(/^\uFEFF/, '').trim().split('\r\n')
check(templateLines.length >= 3, '21. template has header + 2 example rows')

// 22. buildBulkCsvExport uses proper formatting (no undefined/null)
const testResults = [
  {
    input: {
      data: {
        fullName: 'Иванов Иван Петрович',
        position: 'директор',
        organization: 'ООО Ромашка',
        gender: 'male',
        greetingMode: 'namePatronymic',
        punctuation: '!',
        documentTemplate: 'businessLetter',
        senderFullName: 'Петрова Анна',
        senderPosition: 'менеджер',
        senderOrganization: 'ООО Альфа',
        recipientDativeName: 'Иванову Ивану Петровичу',
        senderGenitiveName: 'Петровой Анны',
      },
    },
    blocks: {
      to: 'ООО Ромашка\nдиректору\nИванову Ивану Петровичу',
      from: 'от Петровой Анны\nменеджер\nООО Альфа',
      greeting: 'Уважаемый Иван Петрович!',
      letter: '...',
      documentText: 'ДЕЛОВОЕ ПИСЬМО\n\nКому:\nООО Ромашка\nдиректору\nИванову Ивану Петровичу\n\nОт кого:\nот Петровой Анны\nменеджер\nООО Альфа\n\nУважаемый Иван Петрович!\n\nСообщаем информацию по указанному вопросу и просим рассмотреть её в рабочем порядке.\nПри необходимости дополните письмо деталями, сроками и приложениями.\n\nДата: ____________        Подпись: ____________',
    },
    warnings: [],
    confidence: 0.95,
  },
]
const bulkCsv = buildBulkCsvExport(testResults)
check(bulkCsv.includes('Иванов Иван Петрович'), '22. bulk export has input fullName')
check(bulkCsv.includes('Иванову Ивану Петровичу'), '22. bulk export has dative name')
check(bulkCsv.includes('Петровой Анны'), '22. bulk export has genitive sender name')
check(bulkCsv.includes('От кого:'), '22. bulk export has От кого label')
check(!bulkCsv.includes('undefined'), '22. bulk export has no undefined')
check(!bulkCsv.includes('null'), '22. bulk export has no null')
check(bulkCsv.charCodeAt(0) === 0xFEFF, '22. bulk export has BOM')

// 23. bulk export multiline documentText is quoted
check(bulkCsv.includes('"ДЕЛОВОЕ ПИСЬМО'), '23. multiline documentText is quoted in bulk export')

// 24. no-header positional data preserves sender fields
const t24 = 'Иванов Иван Петрович;директор;ООО Ромашка;male;namePatronymic;!;businessLetter;Петрова Анна;менеджер;ООО Альфа;Иванову Ивану Петровичу;Петровой Анны'
const r24 = parseCsvText(t24)
check(r24.rows.length === 1, '24. no-header data with all fields parses')
check(r24.rows[0].data.senderFullName === 'Петрова Анна', '24. senderFullName preserved in positional')
check(r24.rows[0].data.recipientDativeName === 'Иванову Ивану Петровичу', '24. recipientDativeName preserved')

// 25. normalizeColumnKey handles aliases
check(normalizeColumnKey('fio') === 'fullname', '25. fio alias maps to fullname')
check(normalizeColumnKey('fioadresata') === 'fullname', '25. fioadresata alias maps to fullname')
check(normalizeColumnKey('DATIVENAME') === 'recipientdativename', '25. dativename normalizes correctly')

console.log('\n=== Results:', passed + '/' + total + ' ===')
if (passed < total) process.exit(1)
else console.log('\nAll CSV import checks passed!')