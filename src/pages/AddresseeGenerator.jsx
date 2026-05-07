import { useState, useMemo, useCallback, useRef } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import Icon from '../components/Icon'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import { ResultSection, ResultNotice } from '../components/ResultSection'
import ToolPageShell, { ToolControls, ToolHelp, ToolPageHero, ToolPageLayout, ToolRelated, ToolResult } from '../components/ToolPageShell'
import { formatAddressee } from '../utils/addresseeFormatter'
import { downloadAddresseeDocx } from '../utils/addresseeDocxExport'
import {
  GENDER_MALE,
  GENDER_FEMALE,
  GENDER_UNKNOWN,
  GREETING_NAME_PATRONYMIC,
  GREETING_FULL_NAME,
  GREETING_COLLEAGUES,
  PUNCTUATION_EXCLAMATION,
  PUNCTUATION_COMMA,
  DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  DOCUMENT_TEMPLATE_APPLICATION,
  DOCUMENT_TEMPLATE_OPTIONS,
} from '../utils/addresseeTypes'
import './AddresseeGenerator.css'

const EXAMPLES = [
  {
    key: 'businessLetter',
    fullName: 'Иванов Иван Петрович',
    position: 'генеральный директор',
    organization: 'ООО «Ромашка»',
    gender: GENDER_MALE,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
    senderFullName: 'Петрова Анна Сергеевна',
    senderPosition: 'менеджер по продажам',
    senderOrganization: 'ООО «Альфа»',
  },
  {
    key: 'application',
    fullName: 'Петрова Анна Сергеевна',
    position: 'руководитель отдела кадров',
    organization: 'АО «Север»',
    gender: GENDER_FEMALE,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_APPLICATION,
    senderFullName: 'Сидоров Пётр Алексеевич',
    senderPosition: 'специалист',
    senderOrganization: 'ООО «Вектор»',
  },
  {
    key: 'neutral',
    fullName: 'Смирнов Алексей',
    position: 'менеджер',
    organization: 'ИП Смирнов А.А.',
    gender: GENDER_UNKNOWN,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_COMMA,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
    senderFullName: '',
    senderPosition: '',
    senderOrganization: '',
  },
]

const HERO_BENEFITS = [
  { key: 'readyBlock', icon: 'article' },
  { key: 'salutation', icon: 'person' },
  { key: 'csv', icon: 'list_ordered' },
  { key: 'warnings', icon: 'check' },
]

const USE_CASE_KEYS = ['businessLetter', 'application', 'powerOfAttorney', 'order', 'memo', 'crm']
const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8']

function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '""'
  }
  return `"${String(value).replace(/"/g, '""')}"`
}

function toCsvRow(values) {
  return values.map(escapeCsvValue).join(';')
}

function serializeWarnings(warnings) {
  if (!Array.isArray(warnings) || warnings.length === 0) {
    return ''
  }
  return warnings
    .map((warning) => [warning.code, warning.message].filter(Boolean).join(': '))
    .join(' | ')
}

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
  if (!text || !text.trim()) return { rows: [], error: null }

  const lines = text.trim().split('\n').filter((l) => l.trim())
  if (lines.length === 0) return { rows: [], error: null }

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
      return { rows: [], error: 'missingFullName' }
    }
  }

  const dataLines = hasHeader ? lines.slice(1) : lines
  if (dataLines.length > 50) {
    return { rows: [], error: 'tooManyRows' }
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

function buildBulkCsvContent(results) {
  const header = ['fullName', 'position', 'organization', 'gender', 'greetingMode', 'punctuation', 'documentTemplate', 'senderFullName', 'senderPosition', 'senderOrganization', 'to', 'from', 'greeting', 'letter', 'documentText', 'confidence', 'warnings']
  const rows = [header]

  for (const r of results) {
    const blocks = r.blocks || {}
    const rowData = [
      r.input.fullName || '',
      r.input.position || '',
      r.input.organization || '',
      r.input.gender || '',
      r.input.greetingMode || '',
      r.input.punctuation || '',
      r.input.documentTemplate || '',
      r.input.senderFullName || '',
      r.input.senderPosition || '',
      r.input.senderOrganization || '',
      blocks.to || '',
      blocks.from || '',
      blocks.greeting || '',
      blocks.letter || '',
      blocks.documentText || '',
      String(r.confidence),
      Array.isArray(r.warnings) && r.warnings.length > 0
        ? r.warnings.map((w) => w.code).join('; ')
        : '',
    ]
    rows.push(rowData)
  }

  return '\uFEFF' + rows.map(toCsvRow).join('\r\n')
}

function AddresseeGenerator() {
  const { t, language } = useLanguage()
  const [form, setForm] = useState({
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
  })
  const [result, setResult] = useState(null)
  const [activeExampleKey, setActiveExampleKey] = useState('')
  const [copyAllState, setCopyAllState] = useState('idle')
  const [bulkInput, setBulkInput] = useState('')
  const [fullNameError, setFullNameError] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const resultRef = useRef(null)
  const [bulkResults, setBulkResults] = useState([])
  const [bulkError, setBulkError] = useState(null)
  const [bulkSummary, setBulkSummary] = useState(null)
  const [resultOverrides, setResultOverrides] = useState({ to: null, from: null, greeting: null, documentText: null })
  const [editingBlock, setEditingBlock] = useState(null)
  const [editDraft, setEditDraft] = useState('')

  const handleFieldChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setActiveExampleKey('')
    if (field === 'fullName' && value.trim()) {
      setFullNameError(false)
    }
  }, [])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (!form.fullName || !form.fullName.trim()) {
      setFullNameError(true)
      setStatusMessage(t('addresseeGenerator.statusMessages.validationError'))
      return
    }
    setFullNameError(false)
    const formatted = formatAddressee(form)
    setResult(formatted)
    setResultOverrides({ to: null, from: null, greeting: null, documentText: null })
    setEditingBlock(null)
    setCopyAllState('idle')
    setStatusMessage(t('addresseeGenerator.statusMessages.resultGenerated'))
    if (resultRef.current) {
      requestAnimationFrame(() => {
        resultRef.current?.focus()
      })
    }
  }, [form, t])

  const handleGenerate = useCallback(() => {
    const formatted = formatAddressee(form)
    setResult(formatted)
    setResultOverrides({ to: null, from: null, greeting: null, documentText: null })
    setEditingBlock(null)
    setCopyAllState('idle')
    setStatusMessage(t('addresseeGenerator.statusMessages.resultGenerated'))
    if (resultRef.current) {
      requestAnimationFrame(() => {
        resultRef.current?.focus()
      })
    }
  }, [form, t])

  const handleClear = useCallback(() => {
    setForm({
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
    })
    setResult(null)
    setResultOverrides({ to: null, from: null, greeting: null, documentText: null })
    setEditingBlock(null)
    setActiveExampleKey('')
    setCopyAllState('idle')
  }, [])

  const handleClearBulk = useCallback(() => {
    setBulkInput('')
    setBulkResults([])
    setBulkError(null)
    setBulkSummary(null)
  }, [])

  const getEffectiveBlockText = useCallback((key) => {
    if (!result) return ''
    const override = resultOverrides[key]
    if (override !== null) return override
    return result.blocks[key] || ''
  }, [result, resultOverrides])

  const startEdit = useCallback((key) => {
    setEditingBlock(key)
    setEditDraft(getEffectiveBlockText(key))
  }, [getEffectiveBlockText])

  const saveEdit = useCallback((key) => {
    setResultOverrides((prev) => ({ ...prev, [key]: editDraft }))
    setEditingBlock(null)
    setEditDraft('')
  }, [editDraft])

  const cancelEdit = useCallback(() => {
    setEditingBlock(null)
    setEditDraft('')
  }, [])

  const handleProcessBulk = useCallback(() => {
    setBulkError(null)
    const { rows, error, warnings } = parseBulkInput(bulkInput)
    if (error) {
      setBulkError(error)
      setBulkResults([])
      setBulkSummary(null)
      if (error === 'tooManyRows') {
        setStatusMessage(t('addresseeGenerator.bulk.tooManyRows'))
      } else if (error === 'missingFullName') {
        setStatusMessage(t('addresseeGenerator.bulk.missingFullName'))
      } else {
        setStatusMessage(t('addresseeGenerator.bulk.uploadError'))
      }
      return
    }
    if (rows.length === 0) {
      setBulkError('empty')
      setBulkResults([])
      setBulkSummary(null)
      return
    }
    const processed = rows.map((row) => {
      const formatted = formatAddressee(row)
      return { input: row, ...formatted }
    })
    setBulkResults(processed)
    setBulkSummary({
      total: processed.length,
      withWarnings: processed.filter((r) => r.warnings && r.warnings.length > 0).length,
    })
    const unknownColsWarning = warnings && warnings.length > 0 ? ' ' + t('addresseeGenerator.bulk.unknownColumns') : ''
    setStatusMessage(t('addresseeGenerator.statusMessages.rowsProcessed', { count: processed.length }) + unknownColsWarning)
  }, [bulkInput, t])

  const handleCsvFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        setBulkInput(text)
        setBulkError(null)
        const { rows, error, warnings } = parseBulkInput(text)
        if (error) {
          setBulkError(error)
          setBulkResults([])
          setBulkSummary(null)
          setStatusMessage(error === 'tooManyRows' ? t('addresseeGenerator.bulk.tooManyRows') : error === 'missingFullName' ? t('addresseeGenerator.bulk.missingFullName') : t('addresseeGenerator.bulk.uploadError'))
          return
        }
        if (rows.length === 0) {
          setBulkError('empty')
          setBulkResults([])
          setBulkSummary(null)
          return
        }
        const processed = rows.map((row) => {
          const formatted = formatAddressee(row)
          return { input: row, ...formatted }
        })
        setBulkResults(processed)
        setBulkSummary({
          total: processed.length,
          withWarnings: processed.filter((r) => r.warnings && r.warnings.length > 0).length,
        })
        const unknownColsWarning = warnings && warnings.length > 0 ? ' ' + t('addresseeGenerator.bulk.unknownColumns') : ''
        setStatusMessage(t('addresseeGenerator.bulk.uploadedCount', { count: processed.length }) + unknownColsWarning)
      }
    }
    reader.onerror = () => {
      setBulkError('unrecognized')
      setBulkResults([])
      setBulkSummary(null)
      setStatusMessage(t('addresseeGenerator.bulk.uploadError'))
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [t])

  const handleDownloadBulkCsv = useCallback(() => {
    if (bulkResults.length === 0) return
    const csv = buildBulkCsvContent(bulkResults)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'addressee-generator-bulk-result.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }, [bulkResults])

  const handleLoadExample = useCallback((example) => {
    setForm({
      fullName: example.fullName || '',
      position: example.position || '',
      organization: example.organization || '',
      gender: example.gender || GENDER_UNKNOWN,
      greetingMode: example.greetingMode || GREETING_NAME_PATRONYMIC,
      punctuation: example.punctuation || PUNCTUATION_EXCLAMATION,
      documentTemplate: example.documentTemplate || DOCUMENT_TEMPLATE_BUSINESS_LETTER,
      senderFullName: example.senderFullName || '',
      senderPosition: example.senderPosition || '',
      senderOrganization: example.senderOrganization || '',
    })
    const formatted = formatAddressee({
      fullName: example.fullName || '',
      position: example.position || '',
      organization: example.organization || '',
      gender: example.gender || GENDER_UNKNOWN,
      greetingMode: example.greetingMode || GREETING_NAME_PATRONYMIC,
      punctuation: example.punctuation || PUNCTUATION_EXCLAMATION,
      documentTemplate: example.documentTemplate || DOCUMENT_TEMPLATE_BUSINESS_LETTER,
      senderFullName: example.senderFullName || '',
      senderPosition: example.senderPosition || '',
      senderOrganization: example.senderOrganization || '',
    })
    setResult(formatted)
    setResultOverrides({ to: null, from: null, greeting: null, documentText: null })
    setEditingBlock(null)
    setActiveExampleKey(example.key)
    setCopyAllState('idle')
    setStatusMessage(t('addresseeGenerator.statusMessages.resultGenerated'))
    if (resultRef.current) {
      requestAnimationFrame(() => {
        resultRef.current?.focus()
      })
    }
  }, [t])

  const handleExportCsv = useCallback(() => {
    if (!result) return
    const blocks = result.blocks || {}
    const header = ['fullName', 'position', 'organization', 'gender', 'greetingMode', 'punctuation', 'documentTemplate', 'senderFullName', 'senderPosition', 'senderOrganization', 'to', 'from', 'greeting', 'letter', 'documentText', 'confidence', 'warnings']
    const row = [
      form.fullName,
      form.position,
      form.organization,
      form.gender,
      form.greetingMode,
      form.punctuation,
      form.documentTemplate || DOCUMENT_TEMPLATE_BUSINESS_LETTER,
      form.senderFullName || '',
      form.senderPosition || '',
      form.senderOrganization || '',
      getEffectiveBlockText('to'),
      getEffectiveBlockText('from'),
      getEffectiveBlockText('greeting'),
      blocks.letter || '',
      getEffectiveBlockText('documentText'),
      String(result.confidence),
      Array.isArray(result.warnings) && result.warnings.length > 0
        ? result.warnings.map((w) => w.code).join('; ')
        : '',
    ]
    const csvContent = [header, row].map(toCsvRow).join('\r\n')
    const csv = '\uFEFF' + csvContent
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'addressee-generator-result.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    setStatusMessage(t('addresseeGenerator.statusMessages.csvDownloaded'))
  }, [result, form, t, getEffectiveBlockText])

  const copyAllText = useMemo(() => {
    if (!result) return ''
    const textToCopy = getEffectiveBlockText('documentText') || result.blocks.letter
    if (textToCopy) return textToCopy
    return [getEffectiveBlockText('to'), getEffectiveBlockText('from'), getEffectiveBlockText('greeting')].filter(Boolean).join('\n\n')
  }, [result, getEffectiveBlockText])

  const handleCopyAll = useCallback(async () => {
    if (!copyAllText) return

    try {
      await navigator.clipboard.writeText(copyAllText)
      setCopyAllState('copied')
      setStatusMessage(t('addresseeGenerator.statusMessages.copied'))
      setTimeout(() => setCopyAllState('idle'), 2000)
    } catch {
      setCopyAllState('error')
      setTimeout(() => setCopyAllState('idle'), 2000)
    }
  }, [copyAllText, t])

  const escapeHtml = useCallback((value) => {
    if (value === null || value === undefined) return ''
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }, [])

  const getDocumentExportText = useCallback(() => {
    if (!result) return ''
    const to = getEffectiveBlockText('to')
    const from = getEffectiveBlockText('from')
    const greeting = getEffectiveBlockText('greeting')
    const docText = getEffectiveBlockText('documentText') || result.blocks.letter || ''
    const lines = []
    if (to) {
      lines.push(`${t('addresseeGenerator.export.to')}:\n${to}`)
    }
    if (from) {
      lines.push(`${t('addresseeGenerator.export.from')}:\n${from}`)
    }
    if (greeting) {
      lines.push(`${t('addresseeGenerator.export.greeting')}:\n${greeting}`)
    }
    if (docText) {
      lines.push(`${t('addresseeGenerator.export.documentTemplate')}:\n${docText}`)
    }
    return lines.join('\n\n')
  }, [result, t, getEffectiveBlockText])

  const handleExportTxt = useCallback(() => {
    if (!result) return
    const text = getDocumentExportText()
    if (!text) return
    const content = '\uFEFF' + text
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'addressee-generator-document.txt'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    setStatusMessage(t('addresseeGenerator.statusMessages.txtDownloaded'))
  }, [result, getDocumentExportText, t])

  const handleExportHtml = useCallback(() => {
    if (!result) return
    const text = getDocumentExportText()
    if (!text) return
    const lang = language || 'ru'
    const templateTitle = form.documentTemplate
      ? t(`addresseeGenerator.documentTemplate.${form.documentTemplate}`)
      : t('addresseeGenerator.documentTemplate.businessLetter')
    const escapedText = escapeHtml(text)
    const escapedTitle = escapeHtml(templateTitle)
    const disclaimer = t('addresseeGenerator.export.disclaimer')
    const escapedDisclaimer = escapeHtml(disclaimer)
    const htmlContent = `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${escapedTitle}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; line-height: 1.6; }
    h1 { font-size: 1.2em; border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-bottom: 20px; }
    pre { white-space: pre-wrap; word-wrap: break-word; background: #f9f9f9; padding: 16px; border-radius: 6px; border: 1px solid #e0e0e0; }
    .disclaimer { margin-top: 30px; font-size: 0.85em; color: #888; }
  </style>
</head>
<body>
  <h1>${escapedTitle}</h1>
  <pre>${escapedText}</pre>
  <p class="disclaimer">${escapedDisclaimer}</p>
</body>
</html>`
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'addressee-generator-document.html'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    setStatusMessage(t('addresseeGenerator.statusMessages.htmlDownloaded'))
  }, [result, form, getDocumentExportText, escapeHtml, t, language])

  const handleExportDocx = useCallback(async () => {
    if (!result) return
    try {
      const resultForExport = {
        ...result,
        blocks: {
          ...result.blocks,
          to: getEffectiveBlockText('to'),
          from: getEffectiveBlockText('from'),
          greeting: getEffectiveBlockText('greeting'),
          documentText: getEffectiveBlockText('documentText'),
        },
      }
      await downloadAddresseeDocx(resultForExport, { t })
      setStatusMessage(t('addresseeGenerator.statusMessages.docxDownloaded'))
    } catch (err) {
      console.warn('DOCX export failed:', err)
      setStatusMessage(t('addresseeGenerator.statusMessages.docxError'))
    }
  }, [result, t, getEffectiveBlockText])

  const confidenceLabel = useMemo(() => {
    if (!result) return ''
    if (result.confidence >= 0.95) return t('addresseeGenerator.confidence.high')
    if (result.confidence >= 0.75) return t('addresseeGenerator.confidence.medium')
    return t('addresseeGenerator.confidence.low')
  }, [result, t])

  const confidenceClass = useMemo(() => {
    if (!result) return ''
    if (result.confidence >= 0.95) return 'addr-gen-confidence--high'
    if (result.confidence >= 0.75) return 'addr-gen-confidence--medium'
    return 'addr-gen-confidence--low'
  }, [result])

  const resultBlocks = useMemo(() => {
    if (!result) return []
    return [
      { key: 'to', title: t('addresseeGenerator.blocks.to'), text: result.blocks.to },
      { key: 'from', title: t('addresseeGenerator.blocks.from'), text: result.blocks.from },
      { key: 'greeting', title: t('addresseeGenerator.blocks.greeting'), text: result.blocks.greeting },
      { key: 'letter', title: t('addresseeGenerator.blocks.letter'), text: result.blocks.letter },
      { key: 'documentText', title: t('addresseeGenerator.blocks.documentText'), text: result.blocks.documentText },
    ]
  }, [result, t])

  const faqItems = t('addresseeGenerator.info.faqTitle')
    ? FAQ_KEYS.map((key) => ({
        q: t(`addresseeGenerator.info.faqList.${key}`),
        a: t(`addresseeGenerator.info.faqList.${key.replace('q', 'a')}`),
      }))
    : []

  const structuredData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: t('seo.addresseeGenerator.title'),
        url: `https://qsen.ru/${language}/generator-adresata`,
        description: t('seo.addresseeGenerator.description'),
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        inLanguage: language,
      },
      {
        '@type': 'FAQPage',
        inLanguage: language,
        mainEntity: faqItems
          .filter((item) => item.q && item.a)
          .map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.a,
            },
          })),
      },
    ],
  }), [faqItems, language, t])

  const copyAllLabel =
    copyAllState === 'copied'
      ? t('addresseeGenerator.buttons.copiedAll')
      : copyAllState === 'error'
        ? t('common.copyFailed')
        : t('addresseeGenerator.buttons.copyAll')

  return (
    <>
      <SEO
        title={t('seo.addresseeGenerator.title')}
        description={t('seo.addresseeGenerator.description')}
        path={`/${language}/generator-adresata`}
        keywords={t('seo.addresseeGenerator.keywords')}
        structuredData={structuredData}
      />

      <ToolPageShell className="addr-gen-page">
        <ToolPageHero
          className="addr-gen-hero"
          eyebrow={t('addresseeGenerator.heroEyebrow')}
          title={t('addresseeGenerator.title')}
          subtitle={t('addresseeGenerator.subtitle')}
        />

        <div className="addr-gen-benefits" aria-label={t('addresseeGenerator.benefitsLabel')}>
          {HERO_BENEFITS.map((benefit) => (
            <div className="addr-gen-benefit" key={benefit.key}>
              <Icon name={benefit.icon} size={18} />
              <span>{t(`addresseeGenerator.benefits.${benefit.key}`)}</span>
            </div>
          ))}
        </div>

        {statusMessage && (
          <div className="sr-only" role="status" aria-live="polite">
            {statusMessage}
          </div>
        )}

        <ToolPageLayout className="addr-gen-layout">
          <ToolControls className="addr-gen-controls">
            <div className="addr-gen-panel-heading">
              <span className="addr-gen-panel-kicker">{t('addresseeGenerator.formKicker')}</span>
              <h2 className="addr-gen-panel-title">{t('addresseeGenerator.formTitle')}</h2>
              <p className="addr-gen-panel-desc">{t('addresseeGenerator.formDescription')}</p>
            </div>

            <form onSubmit={handleSubmit} className="addr-gen-form">
            <section className="addr-gen-form-section" aria-labelledby="addrRecipientTitle">
              <div className="addr-gen-section-heading">
                <Icon name="person" size={18} />
                <h3 id="addrRecipientTitle">{t('addresseeGenerator.recipientTitle')}</h3>
              </div>

              <div className="addr-gen-field">
                <label className="addr-gen-label" htmlFor="addrFullName">
                  {t('addresseeGenerator.fields.fullName')}
                </label>
                <input
                  id="addrFullName"
                  className="addr-gen-input"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => handleFieldChange('fullName', e.target.value)}
                  placeholder={t('addresseeGenerator.placeholders.fullName')}
                  aria-invalid={fullNameError ? 'true' : undefined}
                  aria-describedby="addrFullNameHint"
                />
                <p className="addr-gen-hint" id="addrFullNameHint">{t('addresseeGenerator.hints.fullName')}</p>
              </div>

              <div className="addr-gen-field">
                <label className="addr-gen-label" htmlFor="addrPosition">
                  {t('addresseeGenerator.fields.position')}
                </label>
                <input
                  id="addrPosition"
                  className="addr-gen-input"
                  type="text"
                  value={form.position}
                  onChange={(e) => handleFieldChange('position', e.target.value)}
                  placeholder={t('addresseeGenerator.placeholders.position')}
                  aria-describedby="addrPositionHint"
                />
                <p className="addr-gen-hint" id="addrPositionHint">{t('addresseeGenerator.hints.position')}</p>
              </div>

              <div className="addr-gen-field">
                <label className="addr-gen-label" htmlFor="addrOrganization">
                  {t('addresseeGenerator.fields.organization')}
                </label>
                <input
                  id="addrOrganization"
                  className="addr-gen-input"
                  type="text"
                  value={form.organization}
                  onChange={(e) => handleFieldChange('organization', e.target.value)}
                  placeholder={t('addresseeGenerator.placeholders.organization')}
                  aria-describedby="addrOrganizationHint"
                />
                <p className="addr-gen-hint" id="addrOrganizationHint">{t('addresseeGenerator.hints.organization')}</p>
              </div>
            </section>

            <section className="addr-gen-form-section" aria-labelledby="addrSenderTitle">
              <div className="addr-gen-section-heading">
                <Icon name="person_outline" size={18} />
                <h3 id="addrSenderTitle">{t('addresseeGenerator.senderTitle')}</h3>
              </div>

              <div className="addr-gen-field">
                <label className="addr-gen-label" htmlFor="addrSenderFullName">
                  {t('addresseeGenerator.fields.senderFullName')}
                </label>
                <input
                  id="addrSenderFullName"
                  className="addr-gen-input"
                  type="text"
                  value={form.senderFullName}
                  onChange={(e) => handleFieldChange('senderFullName', e.target.value)}
                  placeholder={t('addresseeGenerator.placeholders.senderFullName')}
                  aria-describedby="addrSenderFullNameHint"
                />
                <p className="addr-gen-hint" id="addrSenderFullNameHint">{t('addresseeGenerator.hints.sender')}</p>
              </div>

              <div className="addr-gen-field">
                <label className="addr-gen-label" htmlFor="addrSenderPosition">
                  {t('addresseeGenerator.fields.senderPosition')}
                </label>
                <input
                  id="addrSenderPosition"
                  className="addr-gen-input"
                  type="text"
                  value={form.senderPosition}
                  onChange={(e) => handleFieldChange('senderPosition', e.target.value)}
                  placeholder={t('addresseeGenerator.placeholders.senderPosition')}
                  aria-describedby="addrSenderPositionHint"
                />
                <p className="addr-gen-hint" id="addrSenderPositionHint">{t('addresseeGenerator.hints.sender')}</p>
              </div>

              <div className="addr-gen-field">
                <label className="addr-gen-label" htmlFor="addrSenderOrganization">
                  {t('addresseeGenerator.fields.senderOrganization')}
                </label>
                <input
                  id="addrSenderOrganization"
                  className="addr-gen-input"
                  type="text"
                  value={form.senderOrganization}
                  onChange={(e) => handleFieldChange('senderOrganization', e.target.value)}
                  placeholder={t('addresseeGenerator.placeholders.senderOrganization')}
                  aria-describedby="addrSenderOrganizationHint"
                />
                <p className="addr-gen-hint" id="addrSenderOrganizationHint">{t('addresseeGenerator.hints.sender')}</p>
              </div>
            </section>

            <section className="addr-gen-form-section" aria-labelledby="addrSettingsTitle">
              <div className="addr-gen-section-heading">
                <Icon name="sparkles" size={18} />
                <h3 id="addrSettingsTitle">{t('addresseeGenerator.settingsTitle')}</h3>
              </div>

              <div className="addr-gen-settings-grid">
                <div className="addr-gen-field addr-gen-field--setting">
                  <label className="addr-gen-label" htmlFor="addrGender">{t('addresseeGenerator.fields.gender')}</label>
                  <select
                    id="addrGender"
                    value={form.gender}
                    onChange={(e) => handleFieldChange('gender', e.target.value)}
                    className="addr-gen-select"
                  >
                    <option value={GENDER_MALE}>{t('addresseeGenerator.gender.male')}</option>
                    <option value={GENDER_FEMALE}>{t('addresseeGenerator.gender.female')}</option>
                    <option value={GENDER_UNKNOWN}>{t('addresseeGenerator.gender.unknown')}</option>
                  </select>
                </div>

                <div className="addr-gen-field addr-gen-field--setting">
                  <label className="addr-gen-label" htmlFor="addrGreetingMode">{t('addresseeGenerator.fields.greetingMode')}</label>
                  <select
                    id="addrGreetingMode"
                    value={form.greetingMode}
                    onChange={(e) => handleFieldChange('greetingMode', e.target.value)}
                    className="addr-gen-select"
                  >
                    <option value={GREETING_NAME_PATRONYMIC}>{t('addresseeGenerator.greetingMode.namePatronymic')}</option>
                    <option value={GREETING_FULL_NAME}>{t('addresseeGenerator.greetingMode.fullName')}</option>
                    <option value={GREETING_COLLEAGUES}>{t('addresseeGenerator.greetingMode.colleagues')}</option>
                  </select>
                </div>

                <div className="addr-gen-field addr-gen-field--setting addr-gen-field--punctuation">
                  <label className="addr-gen-label" htmlFor="addrPunctuation">{t('addresseeGenerator.fields.punctuation')}</label>
                  <select
                    id="addrPunctuation"
                    value={form.punctuation}
                    onChange={(e) => handleFieldChange('punctuation', e.target.value)}
                    className="addr-gen-select"
                  >
                    <option value={PUNCTUATION_EXCLAMATION}>{t('addresseeGenerator.punctuation.exclamation')}</option>
                    <option value={PUNCTUATION_COMMA}>{t('addresseeGenerator.punctuation.comma')}</option>
                  </select>
                </div>

                <div className="addr-gen-field addr-gen-field--setting">
                  <label className="addr-gen-label" htmlFor="addrDocumentTemplate">{t('addresseeGenerator.documentTemplate.label')}</label>
                  <select
                    id="addrDocumentTemplate"
                    value={form.documentTemplate}
                    onChange={(e) => handleFieldChange('documentTemplate', e.target.value)}
                    className="addr-gen-select"
                  >
                    {DOCUMENT_TEMPLATE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="addr-gen-examples" aria-labelledby="addrExamplesTitle">
              <div className="addr-gen-examples-header">
                <h3 id="addrExamplesTitle">{t('addresseeGenerator.examplesLabel')}</h3>
                <span>{t('addresseeGenerator.examplesHint')}</span>
              </div>
              <div className="addr-gen-examples-chips">
                {EXAMPLES.map((example) => (
                  <button
                    key={example.key}
                    type="button"
                    className={`addr-gen-chip ${activeExampleKey === example.key ? 'addr-gen-chip--active' : ''}`.trim()}
                    onClick={() => handleLoadExample(example)}
                    aria-pressed={activeExampleKey === example.key}
                  >
                    {t(`addresseeGenerator.examples.${example.key}`)}
                  </button>
                ))}
              </div>
            </section>

            <div className="addr-gen-actions">
              <button type="submit" className="addr-gen-btn addr-gen-btn--primary">
                <Icon name="refresh" size={18} />
                {t('addresseeGenerator.buttons.generate')}
              </button>
              <button type="button" className="addr-gen-btn addr-gen-btn--secondary" onClick={handleClear}>
                {t('addresseeGenerator.buttons.clear')}
              </button>
            </div>
            </form>

            <section className="addr-gen-bulk" aria-labelledby="addrBulkTitle">
              <div className="addr-gen-bulk-header">
                <h2 id="addrBulkTitle">{t('addresseeGenerator.bulk.title')}</h2>
                <p className="addr-gen-bulk-desc">{t('addresseeGenerator.bulk.description')}</p>
              </div>
              <label htmlFor="bulkInput" className="sr-only">{t('addresseeGenerator.bulk.title')}</label>
              <textarea
                id="bulkInput"
                className="addr-gen-textarea addr-gen-bulk-input"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder={t('addresseeGenerator.bulk.placeholder')}
                rows={6}
                aria-describedby="bulkHint"
              />
              <p className="addr-gen-hint" id="bulkHint">{t('addresseeGenerator.bulk.hint')}</p>
              <div className="addr-gen-upload-row">
                <input
                  type="file"
                  id="bulkFileInput"
                  accept=".csv,text/csv"
                  className="addr-gen-upload-input"
                  onChange={handleCsvFileChange}
                  aria-describedby="bulkUploadHint"
                />
                <label htmlFor="bulkFileInput" className="addr-gen-btn addr-gen-btn--secondary">
                  <Icon name="file_text" size={16} />
                  {t('addresseeGenerator.bulk.uploadCsv')}
                </label>
                <span className="addr-gen-hint" id="bulkUploadHint">{t('addresseeGenerator.bulk.uploadHint')}</span>
              </div>
              {bulkError && (
                <p className="addr-gen-bulk-error" role="alert">
                  {bulkError === 'tooManyRows' && t('addresseeGenerator.bulk.tooManyRows')}
                  {bulkError === 'unrecognized' && t('addresseeGenerator.bulk.unrecognized')}
                  {bulkError === 'empty' && t('addresseeGenerator.bulk.empty')}
                  {bulkError === 'missingFullName' && t('addresseeGenerator.bulk.missingFullName')}
                  {bulkError === 'uploadError' && t('addresseeGenerator.bulk.uploadError')}
                </p>
              )}
              <div className="addr-gen-bulk-actions">
                <button type="button" className="addr-gen-btn addr-gen-btn--primary" onClick={handleProcessBulk}>
                  {t('addresseeGenerator.bulk.process')}
                </button>
                <button type="button" className="addr-gen-btn addr-gen-btn--secondary" onClick={handleClearBulk}>
                  {t('addresseeGenerator.bulk.clear')}
                </button>
                <button
                  type="button"
                  className="addr-gen-btn addr-gen-btn--secondary"
                  onClick={handleDownloadBulkCsv}
                  disabled={bulkResults.length === 0}
                >
                  {t('addresseeGenerator.bulk.download')}
                </button>
              </div>
              {bulkSummary && (
                <div className="addr-gen-bulk-summary">
                  <span>{t('addresseeGenerator.bulk.rowsProcessed')}: {bulkSummary.total}</span>
                  <span>{t('addresseeGenerator.bulk.rowsWithWarnings')}: {bulkSummary.withWarnings}</span>
                </div>
              )}
              {bulkResults.length > 0 && (
                <div className="addr-gen-bulk-preview">
                  <h3 className="addr-gen-bulk-preview-title">{t('addresseeGenerator.bulk.previewTitle')}</h3>
                  <div className="addr-gen-bulk-table-wrap">
                    <table className="addr-gen-bulk-table">
                      <thead>
                        <tr>
                          <th>{t('addresseeGenerator.bulk.columns.index')}</th>
                          <th>{t('addresseeGenerator.bulk.columns.fullName')}</th>
                          <th>{t('addresseeGenerator.bulk.columns.position')}</th>
                          <th>{t('addresseeGenerator.bulk.columns.organization')}</th>
                          <th>{t('addresseeGenerator.bulk.columns.template')}</th>
                          <th>{t('addresseeGenerator.bulk.columns.confidence')}</th>
                          <th>{t('addresseeGenerator.bulk.columns.warnings')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkResults.slice(0, 10).map((r, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{r.input.fullName}</td>
                            <td>{r.input.position}</td>
                            <td>{r.input.organization}</td>
                            <td>{r.input.documentTemplate}</td>
                            <td>{Math.round(r.confidence * 100)}%</td>
                            <td>
                              {r.warnings && r.warnings.length > 0
                                ? r.warnings.map((w) => w.code).join('; ')
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </ToolControls>

          <ToolResult className="addr-gen-result" aria-live="polite">
            {!result ? (
              <div className="addr-gen-placeholder">
                <div className="addr-gen-placeholder-icon">
                  <Icon name="article" size={34} />
                </div>
                <h2>{t('addresseeGenerator.emptyStateTitle')}</h2>
                <p>{t('addresseeGenerator.emptyState')}</p>
                <div className="addr-gen-placeholder-flow" aria-hidden="true">
                  <span>{t('addresseeGenerator.flow.input')}</span>
                  <span>{t('addresseeGenerator.flow.settings')}</span>
                  <span>{t('addresseeGenerator.flow.result')}</span>
                </div>
              </div>
            ) : (
              <div className="addr-gen-results" ref={resultRef} tabIndex={-1}>
                <div className="addr-gen-result-top">
                  <div>
                    <span className="addr-gen-panel-kicker">{t('addresseeGenerator.resultKicker')}</span>
                    <h2 className="addr-gen-result-title">{t('addresseeGenerator.resultTitle')}</h2>
                    <p className="addr-gen-result-desc">{t('addresseeGenerator.resultSubtitle')}</p>
                  </div>
                  <button
                    type="button"
                    className={`addr-gen-btn addr-gen-btn--copy-all ${copyAllState === 'copied' ? 'addr-gen-btn--copied' : ''}`.trim()}
                    onClick={handleCopyAll}
                    disabled={!copyAllText}
                  >
                    <Icon name={copyAllState === 'copied' ? 'check' : 'content_copy'} size={16} />
                    {copyAllLabel}
                  </button>
                </div>

                <div className="addr-gen-confidence">
                  <span className={`addr-gen-confidence-badge ${confidenceClass}`.trim()}>
                    {t('addresseeGenerator.confidence.label')}: {confidenceLabel}
                  </span>
                  <span className="addr-gen-confidence-score">{Math.round(result.confidence * 100)}%</span>
                </div>

                {result.warnings && result.warnings.length > 0 && (
                  <ResultNotice tone="warning" className="addr-gen-warnings" title={t('addresseeGenerator.warningsTitle')}>
                    <p className="addr-gen-warning-copy">{t('addresseeGenerator.warningsDescription')}</p>
                    <ul className="addr-gen-warnings-list">
                      {result.warnings.map((warning, idx) => (
                        <li key={`${warning.code}-${idx}`}>{warning.message}</li>
                      ))}
                    </ul>
                  </ResultNotice>
                )}

                {result.manualReviewRequired && (
                  <ResultNotice tone="accent" className="addr-gen-review-notice">
                    {t('addresseeGenerator.manualReview')}
                  </ResultNotice>
                )}

                <div className="addr-gen-result-cards">
                  {resultBlocks.map((block) => {
                    const isEditable = ['to', 'from', 'greeting', 'documentText'].includes(block.key)
                    const effectiveText = getEffectiveBlockText(block.key)
                    const hasOverride = resultOverrides[block.key] !== null
                    const isEditing = editingBlock === block.key
                    return (
                      <ResultSection tone="default" className={`addr-gen-block-card addr-gen-block-card--${block.key}${hasOverride ? ' addr-gen-block-card--edited' : ''}`} key={block.key}>
                        <div className="addr-gen-block-header">
                          <div>
                            <span className="addr-gen-block-label">
                              {t('addresseeGenerator.resultBlockLabel')}
                              {hasOverride && <span className="addr-gen-block-override-badge">{t('addresseeGenerator.override.edited')}</span>}
                            </span>
                            <h3 className="addr-gen-block-title">{block.title}</h3>
                          </div>
                          <div className="addr-gen-block-actions">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  className="addr-gen-btn addr-gen-btn--save"
                                  onClick={() => saveEdit(block.key)}
                                >
                                  {t('addresseeGenerator.override.save')}
                                </button>
                                <button
                                  type="button"
                                  className="addr-gen-btn addr-gen-btn--cancel"
                                  onClick={cancelEdit}
                                >
                                  {t('addresseeGenerator.override.cancel')}
                                </button>
                              </>
                            ) : (
                              <>
                                {isEditable && (
                                  <button
                                    type="button"
                                    className="addr-gen-btn addr-gen-btn--edit"
                                    onClick={() => startEdit(block.key)}
                                  >
                                    {t('addresseeGenerator.override.edit')}
                                  </button>
                                )}
                                <CopyButton
                                  className="addr-gen-copy-btn"
                                  text={effectiveText}
                                  analytics={{ toolSlug: 'addressee-generator', linkType: 'result' }}
                                  onCopied={() => setStatusMessage(t('addresseeGenerator.statusMessages.copied'))}
                                />
                              </>
                            )}
                          </div>
                        </div>
                        {isEditing ? (
                          <textarea
                            className="addr-gen-block-textarea"
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            rows={Math.max(4, editDraft.split('\n').length)}
                            autoFocus
                          />
                        ) : (
                          <pre className="addr-gen-block-content">{effectiveText}</pre>
                        )}
                      </ResultSection>
                    )
                  })}
                </div>

                <div className="addr-gen-export-actions">
                  <button
                    type="button"
                    className="addr-gen-btn addr-gen-btn--secondary addr-gen-btn--export"
                    onClick={handleExportCsv}
                    disabled={!result}
                  >
                    <Icon name="list_ordered" size={16} />
                    {t('addresseeGenerator.buttons.exportCsv')}
                  </button>
                  <button
                    type="button"
                    className="addr-gen-btn addr-gen-btn--secondary addr-gen-btn--export"
                    onClick={handleExportTxt}
                    disabled={!result}
                  >
                    <Icon name="file_text" size={16} />
                    {t('addresseeGenerator.buttons.exportTxt')}
                  </button>
                  <button
                    type="button"
                    className="addr-gen-btn addr-gen-btn--secondary addr-gen-btn--export"
                    onClick={handleExportHtml}
                    disabled={!result}
                  >
                    <Icon name="code" size={16} />
                    {t('addresseeGenerator.buttons.exportHtml')}
                  </button>
                  <button
                    type="button"
                    className="addr-gen-btn addr-gen-btn--secondary addr-gen-btn--export"
                    onClick={handleExportDocx}
                    disabled={!result}
                  >
                    <Icon name="description" size={16} />
                    {t('addresseeGenerator.buttons.downloadDocx')}
                  </button>
                </div>
                <p className="addr-gen-export-note">{t('addresseeGenerator.exportNote')}</p>
              </div>
            )}
          </ToolResult>
        </ToolPageLayout>

        <ToolHelp className="addr-gen-help">
          <ToolDescriptionSection className="addr-gen-info-section">
            <h2>{t('addresseeGenerator.info.title')}</h2>
            <p>{t('addresseeGenerator.info.description')}</p>

            <h3>{t('addresseeGenerator.info.forWhatTitle')}</h3>
            <p>{t('addresseeGenerator.info.forWhatText')}</p>

            <h3>{t('addresseeGenerator.info.howTitle')}</h3>
            <p>{t('addresseeGenerator.info.howText')}</p>

            <h3>{t('addresseeGenerator.info.accuracyTitle')}</h3>
            <p>{t('addresseeGenerator.info.accuracyText')}</p>

            <div className="addr-gen-use-cases" aria-label={t('addresseeGenerator.info.useCasesTitle')}>
              {USE_CASE_KEYS.map((key) => (
                <span className="addr-gen-use-case" key={key}>
                  {t(`addresseeGenerator.info.useCases.${key}`)}
                </span>
              ))}
            </div>

            <ToolFaq title={t('addresseeGenerator.info.faqTitle')} items={faqItems} />
          </ToolDescriptionSection>
        </ToolHelp>

        <ToolRelated>
          <RelatedTools currentPath={`/${language}/generator-adresata`} />
        </ToolRelated>
      </ToolPageShell>
    </>
  )
}

export default AddresseeGenerator
