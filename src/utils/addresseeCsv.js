export const KNOWN_COLUMNS = [
  'fullname', 'position', 'organization', 'gender', 'greetingmode',
  'punctuation', 'documenttemplate', 'senderfullname', 'senderposition',
  'senderorganization', 'recipientdativename', 'sendergenitivename',
]

export const COLUMN_ALIASES = {
  'fio': 'fullname',
  'name': 'fullname',
  'fioadresata': 'fullname',
  'fiootpr': 'senderfullname',
  'fam': 'fullname',
  'im': 'fullname',
  'otch': 'fullname',
  'dolzhnost': 'position',
  'org': 'organization',
  'komu': 'fullname',
  'otkogo': 'senderfullname',
  'dativename': 'recipientdativename',
  'genitivname': 'sendergenitivename',
}

export const VALID_GENDERS = ['male', 'female', 'unknown']
export const VALID_GREETING_MODES = ['namePatronymic', 'fullName', 'colleagues']
export const VALID_PUNCTUATIONS = ['!', ',']
export const VALID_DOCUMENT_TEMPLATES = [
  'businessLetter', 'application', 'complaint', 'request',
  'memo', 'explanatoryNote', 'powerOfAttorney', 'commercialOffer', 'order',
]

export function normalizeColumnKey(header) {
  const normalized = header.toLowerCase().replace(/[\s_-]/g, '')
  if (COLUMN_ALIASES[normalized]) return COLUMN_ALIASES[normalized]
  return normalized
}

export function detectDelimiter(firstLine) {
  if (firstLine.includes('\t')) return '\t'
  if (firstLine.includes(';')) return ';'
  if (firstLine.includes(',')) return ','
  return ';'
}

export function parseCsvLine(line, delimiter = ';') {
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

export function normalizeCsvHeader(headers) {
  return headers.map(normalizeColumnKey)
}

export function buildColumnIndex(headerRow, delimiter) {
  const headers = parseCsvLine(headerRow, delimiter)
  const normalized = normalizeCsvHeader(headers)
  const index = {}
  for (let i = 0; i < normalized.length; i++) {
    const key = normalized[i]
    if (key && !index[key]) {
      index[key] = i
    }
  }
  return index
}

export function mapRowToFormData(cells, columnIndex) {
  const get = (key) => {
    const idx = columnIndex[key]
    if (idx === undefined || idx === null) return ''
    return (cells[idx] || '').trim()
  }
  return {
    fullName: get('fullname'),
    position: get('position'),
    organization: get('organization'),
    gender: get('gender') || 'unknown',
    greetingMode: get('greetingmode') || 'namePatronymic',
    punctuation: get('punctuation') || '!',
    documentTemplate: get('documenttemplate') || 'businessLetter',
    senderFullName: get('senderfullname'),
    senderPosition: get('senderposition'),
    senderOrganization: get('senderorganization'),
    recipientDativeName: get('recipientdativename'),
    senderGenitiveName: get('sendergenitivename'),
  }
}

export function validateRowData(row, rowNumber) {
  const errors = []
  const fieldErrors = {}

  if (!row.fullName || !row.fullName.trim()) {
    errors.push({ row: rowNumber, code: 'EMPTY_FULLNAME', message: `Row ${rowNumber}: fullName is empty` })
    fieldErrors.fullName = true
  }

  if (row.gender && !VALID_GENDERS.includes(row.gender)) {
    errors.push({ row: rowNumber, code: 'INVALID_GENDER', message: `Row ${rowNumber}: invalid gender "${row.gender}"` })
    fieldErrors.gender = true
  }

  if (row.greetingMode && !VALID_GREETING_MODES.includes(row.greetingMode)) {
    errors.push({ row: rowNumber, code: 'INVALID_GREETING_MODE', message: `Row ${rowNumber}: invalid greetingMode "${row.greetingMode}"` })
    fieldErrors.greetingMode = true
  }

  if (row.punctuation && !VALID_PUNCTUATIONS.includes(row.punctuation)) {
    errors.push({ row: rowNumber, code: 'INVALID_PUNCTUATION', message: `Row ${rowNumber}: invalid punctuation "${row.punctuation}"` })
    fieldErrors.punctuation = true
  }

  if (row.documentTemplate && !VALID_DOCUMENT_TEMPLATES.includes(row.documentTemplate)) {
    errors.push({ row: rowNumber, code: 'INVALID_DOCUMENT_TEMPLATE', message: `Row ${rowNumber}: invalid documentTemplate "${row.documentTemplate}"` })
    fieldErrors.documentTemplate = true
  }

  return { errors, fieldErrors }
}

export function detectUnknownColumns(columnIndex, knownColumns = KNOWN_COLUMNS) {
  const unknown = []
  for (const key of Object.keys(columnIndex)) {
    if (!knownColumns.includes(key)) {
      unknown.push(key)
    }
  }
  return unknown
}

export function parseCsvText(text, options = {}) {
  const { maxRows = 50 } = options
  if (!text || !text.trim()) return { rows: [], columnIndex: {}, unknownColumns: [], errors: [], warnings: [] }

  const trimmed = text.trim().replace(/^\uFEFF/, '')

  const containsMultilineQuoted = (str) => {
    let inQuotes = false
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '"') {
        if (inQuotes && str[i + 1] === '"') {
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (str[i] === '\n' && inQuotes) {
        return true
      }
    }
    return false
  }

  if (containsMultilineQuoted(trimmed)) {
    return { rows: [], columnIndex: {}, unknownColumns: [], errors: [{ code: 'MULTILINE_QUOTED', message: 'CSV contains multiline quoted fields which are not supported. Please flatten multiline content in quoted fields.' }], warnings: [] }
  }

  const lines = trimmed.split('\n').filter((l) => l.trim())
  if (lines.length === 0) return { rows: [], columnIndex: {}, unknownColumns: [], errors: [], warnings: [] }

  const delimiter = detectDelimiter(lines[0])

  const hasHeader = (() => {
    const firstCells = parseCsvLine(lines[0], delimiter)
    const normalized = firstCells.map((c) => normalizeColumnKey(c))
    return normalized.some((col) => KNOWN_COLUMNS.includes(col))
  })()

  let dataLines = hasHeader ? lines.slice(1) : lines

  if (dataLines.length > maxRows) {
    return { rows: [], columnIndex: {}, unknownColumns: [], errors: [{ code: 'TOO_MANY_ROWS', message: `Too many rows: ${dataLines.length} > ${maxRows}` }], warnings: [] }
  }

  if (dataLines.length === 0) {
    return { rows: [], columnIndex: {}, unknownColumns: [], errors: [{ code: 'NO_DATA', message: 'No data rows found' }], warnings: [] }
  }

  let columnIndex
  if (hasHeader) {
    columnIndex = buildColumnIndex(lines[0], delimiter)
    const unknownCols = detectUnknownColumns(columnIndex)
    if (unknownCols.length > 0 && Object.keys(columnIndex).length > KNOWN_COLUMNS.length) {
      return { rows: [], columnIndex: {}, unknownColumns: unknownCols, errors: [{ code: 'TOO_MANY_COLUMNS', message: `Too many columns: ${Object.keys(columnIndex).length} > expected` }], warnings: [] }
    }
  } else {
    columnIndex = {
      fullname: 0,
      position: 1,
      organization: 2,
      gender: 3,
      greetingmode: 4,
      punctuation: 5,
      documenttemplate: 6,
      senderfullname: 7,
      senderposition: 8,
      senderorganization: 9,
      recipientdativename: 10,
      sendergenitivename: 11,
    }
  }

  if (!columnIndex.fullname !== undefined && columnIndex.fullname === undefined) {
    return { rows: [], columnIndex: {}, unknownColumns: [], errors: [{ code: 'MISSING_FULLNAME', message: 'fullName column is required' }], warnings: [] }
  }

  const rows = []
  const allErrors = []
  const allWarnings = []

  for (let i = 0; i < dataLines.length; i++) {
    const cells = parseCsvLine(dataLines[i], delimiter)
    const rowNum = hasHeader ? i + 2 : i + 1

    if (cells.length === 0 || (cells.length === 1 && !cells[0])) continue

    const formData = mapRowToFormData(cells, columnIndex)
    const { errors: rowErrors, fieldErrors } = validateRowData(formData, rowNum)

    const hasEmptyFullName = !formData.fullName || !formData.fullName.trim()
    if (hasEmptyFullName) {
      allErrors.push({ row: rowNum, code: 'EMPTY_FULLNAME', message: `Row ${rowNum}: ФИО не указан` })
    } else {
      rows.push({ rowNumber: rowNum, data: formData, fieldErrors, warnings: [] })
    }

    allErrors.push(...rowErrors.filter((e) => e.code !== 'EMPTY_FULLNAME'))
  }

  const unknownCols = detectUnknownColumns(columnIndex)
  if (unknownCols.length > 0) {
    allWarnings.push({ code: 'UNKNOWN_COLUMNS', message: `Unknown columns will be skipped: ${unknownCols.join(', ')}` })
  }

  return {
    rows,
    columnIndex,
    unknownColumns: unknownCols,
    errors: allErrors,
    warnings: allWarnings,
    delimiter,
  }
}

export function buildBulkInputFromCsv(text, options) {
  const result = parseCsvText(text, options)
  return result
}

export function toCsvRow(values) {
  const escape = (val) => {
    if (val === null || val === undefined) return '""'
    const str = String(val)
    if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return `"${str}"`
  }
  return values.map(escape).join(';')
}

export function getCsvTemplate() {
  const header = 'fullName;position;organization;gender;greetingMode;punctuation;documentTemplate;senderFullName;senderPosition;senderOrganization;recipientDativeName;senderGenitiveName'
  const row1 = 'Иванов Иван Петрович;генеральный директор;ООО "Ромашка";male;namePatronymic;!;application;Петрова Анна Сергеевна;менеджер по продажам;ООО "Альфа";Иванову Ивану Петровичу;Петровой Анны Сергеевны'
  const row2 = 'Сидорова Мария Петровна;главный бухгалтер;АО "Север";female;namePatronymic;!;businessLetter;Козлов Алексей Сергеевич;директор;АО "Север";;;'
  return '\uFEFF' + [header, row1, row2].join('\r\n')
}

export function buildBulkCsvExport(results) {
  const header = [
    'fullName', 'position', 'organization', 'gender', 'greetingMode',
    'punctuation', 'documentTemplate', 'senderFullName', 'senderPosition',
    'senderOrganization', 'recipientDativeName', 'senderGenitiveName',
    'to', 'from', 'greeting', 'letter', 'documentText',
    'confidence', 'warnings',
  ]
  const rows = [header]

  for (const r of results) {
    const blocks = r.blocks || {}
    const rowData = [
      r.input?.data?.fullName || r.input?.fullName || '',
      r.input?.data?.position || r.input?.position || '',
      r.input?.data?.organization || r.input?.organization || '',
      r.input?.data?.gender || r.input?.gender || '',
      r.input?.data?.greetingMode || r.input?.greetingMode || '',
      r.input?.data?.punctuation || r.input?.punctuation || '',
      r.input?.data?.documentTemplate || r.input?.documentTemplate || '',
      r.input?.data?.senderFullName || r.input?.senderFullName || '',
      r.input?.data?.senderPosition || r.input?.senderPosition || '',
      r.input?.data?.senderOrganization || r.input?.senderOrganization || '',
      r.input?.data?.recipientDativeName || r.input?.recipientDativeName || '',
      r.input?.data?.senderGenitiveName || r.input?.senderGenitiveName || '',
      blocks.to || '',
      blocks.from || '',
      blocks.greeting || '',
      blocks.letter || '',
      blocks.documentText || '',
      String(r.confidence || ''),
      Array.isArray(r.warnings) && r.warnings.length > 0
        ? r.warnings.map((w) => w.code).join('; ')
        : '',
    ]
    rows.push(rowData)
  }

  return '\uFEFF' + rows.map(toCsvRow).join('\r\n')
}

export function downloadTextAsFile(text, filename, mimeType) {
  const blob = new Blob([text], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}