const fs = require('fs')
const path = require('path')

const rootDir = path.join(__dirname, '..')

function readFile(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf-8')
}

function readJson(relativePath) {
  return JSON.parse(readFile(relativePath))
}

const GENDER_UNKNOWN = 'unknown'
const GREETING_NAME_PATRONYMIC = 'namePatronymic'
const PUNCTUATION_EXCLAMATION = '!'
const DOCUMENT_TEMPLATE_BUSINESS_LETTER = 'businessLetter'

function detectDelimiter(line) {
  if (line.includes('\t')) return '\t'
  if (line.includes(';')) return ';'
  if (line.includes(',')) return ','
  return ';'
}

function parseCsvLine(line, delimiter) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseBulkInput(text) {
  if (!text || !text.trim()) return { rows: [], error: null, warnings: [] }
  const lines = text.trim().split('\n').filter((l) => l.trim())
  if (lines.length === 0) return { rows: [], error: null, warnings: [] }
  const delimiter = detectDelimiter(lines[0])
  const firstRow = parseCsvLine(lines[0], delimiter)
  const headerCells = ['fullname', 'position', 'organization', 'gender', 'greetingmode', 'punctuation', 'documenttemplate', 'senderfullname', 'senderposition', 'senderorganization']
  const hasHeader = firstRow.some((cell) =>
    headerCells.includes(cell.toLowerCase().replace(/[\s_-]/g, ''))
  )
  if (hasHeader) {
    const normalizedHeader = firstRow.map((cell) => cell.toLowerCase().replace(/[\s_-]/g, ''))
    const hasFullName = normalizedHeader.includes('fullname')
    if (!hasFullName) {
      return { rows: [], error: 'missingFullName', warnings: [] }
    }
  }
  const dataLines = hasHeader ? lines.slice(1) : lines
  if (dataLines.length > 50) {
    return { rows: [], error: 'tooManyRows', warnings: [] }
  }
  const defaultFields = {
    fullName: '',
    position: '',
    organization: '',
    gender: GENDER_UNKNOWN,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
    senderFullName: '',
    senderPosition: '',
    senderOrganization: '',
  }
  const fieldMap = {
    0: 'fullName',
    1: 'position',
    2: 'organization',
    3: 'gender',
    4: 'greetingMode',
    5: 'punctuation',
    6: 'documentTemplate',
    7: 'senderFullName',
    8: 'senderPosition',
    9: 'senderOrganization',
  }
  const rows = []
  for (let i = 0; i < dataLines.length; i++) {
    const cells = parseCsvLine(dataLines[i], delimiter)
    if (cells.length === 0 || (cells.length === 1 && !cells[0])) continue
    const row = { ...defaultFields }
    let hasData = false
    for (let j = 0; j < cells.length && j < 10; j++) {
      const fieldName = fieldMap[j]
      if (fieldName && cells[j]) {
        row[fieldName] = cells[j]
        if (fieldName === 'fullName' && cells[j].trim()) hasData = true
      }
    }
    if (hasData || row.fullName) {
      rows.push(row)
    }
  }
  if (rows.length === 0) {
    return { rows: [], error: 'unrecognized', warnings: [] }
  }
  const warnings = []
  const knownColumnCount = 10
  for (let i = 0; i < dataLines.length; i++) {
    const cells = parseCsvLine(dataLines[i], delimiter)
    if (cells.length > knownColumnCount) {
      warnings.push({ code: 'UNKNOWN_COLUMNS', message: 'Some columns were not recognized and will be skipped.' })
      break
    }
  }
  return { rows, error: null, warnings }
}

let passed = 0, total = 0
function check(cond, msg) {
  total++
  if (cond) { passed++; console.log('  PASS:', msg) }
  else { console.log('  FAIL:', msg) }
}

console.log('\n=== Addressee CSV Import Checks ===')

// 1. semicolon CSV parses
const t1 = 'fullName;position;organization\nИванов Иван Петрович;директор;ООО Ромашка'
const r1 = parseBulkInput(t1)
check(r1.rows.length === 1, '1. semicolon CSV parses')

// 2. comma CSV parses
const t2 = 'fullName,position,organization\nИванов Иван Петрович,директор,ООО Ромашка'
const r2 = parseBulkInput(t2)
check(r2.rows.length === 1, '2. comma CSV parses')
check(r2.rows[0].organization === 'ООО Ромашка', '2. comma CSV org correct')

// 3. quoted values parse
const t3 = 'fullName;position;organization\nИванов Иван Петрович;директор;"ООО ""Ромашка"""'
const r3 = parseBulkInput(t3)
check(r3.rows.length === 1, '3. quoted values parse')
check(r3.rows[0].organization === 'ООО "Ромашка"', '3. quoted values unescaped')

// 4. missing fullName header returns error
const t4 = 'position;organization\ngeneral director;ООО Ромашка'
const r4 = parseBulkInput(t4)
check(r4.error === 'missingFullName', '4. missing fullName header returns error')

// 5. empty fullName row returns row error (unrecognized)
const t5 = 'fullName;position;organization\n;директор;ООО Ромашка'
const r5 = parseBulkInput(t5)
check(r5.error === 'unrecognized', '5. empty fullName row returns unrecognized error')

// 6. unknown columns warning
const t6 = 'fullName;position;organization;gender;greetingMode;punctuation;documentTemplate;senderFullName;senderPosition;senderOrganization;extraCol1;extraCol2\nИванов Иван Петрович;директор;ООО Ромашка;male;namePatronymic;!;businessLetter;Петрова Анна;менеджер;ООО Альфа;extra1;extra2'
const r6 = parseBulkInput(t6)
check(r6.warnings && r6.warnings.length > 0, '6. unknown columns returns warning')
check(r6.warnings[0].code === 'UNKNOWN_COLUMNS', '6. unknown columns warning code is UNKNOWN_COLUMNS')

// 7. >50 rows returns max rows error
const manyRows = 'fullName;position;organization\n' + Array(51).fill('Иванов Иван Петрович;директор;ООО').join('\n')
const r7 = parseBulkInput(manyRows)
check(r7.error === 'tooManyRows', '7. 51 rows returns tooManyRows error')

// 8. sender fields preserved
const t8 = 'fullName;position;organization;gender;greetingMode;punctuation;documentTemplate;senderFullName;senderPosition;senderOrganization\nИванов Иван Петрович;директор;ООО Ромашка;male;namePatronymic;!;businessLetter;Петрова Анна;менеджер;ООО Альфа'
const r8 = parseBulkInput(t8)
check(r8.rows[0].senderFullName === 'Петрова Анна', '8. senderFullName preserved')
check(r8.rows[0].senderPosition === 'менеджер', '8. senderPosition preserved')
check(r8.rows[0].senderOrganization === 'ООО Альфа', '8. senderOrganization preserved')

// 9. documentTemplate preserved
const t9 = 'fullName;position;organization;gender;greetingMode;punctuation;documentTemplate\nИванов Иван;директор;ООО;male;colleagues;!;application'
const r9 = parseBulkInput(t9)
check(r9.rows[0].documentTemplate === 'application', '9. documentTemplate preserved')

// 10. canonical bulk text generated (test that no-header data works as fallback)
const t10 = 'Иванов Иван Петрович;директор;ООО Ромашка\nСидорова Мария;бухгалтер;АО Север'
const r10 = parseBulkInput(t10)
check(r10.rows.length === 2, '10. no-header data parses as bulk text')
check(r10.rows[0].fullName === 'Иванов Иван Петрович', '10. no-header first row correct')

console.log('\n=== Results:', passed + '/' + total + ' ===')
if (passed < total) process.exit(1)
else console.log('\nAll CSV import checks passed!')