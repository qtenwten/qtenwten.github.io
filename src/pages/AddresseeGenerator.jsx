import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import Icon from '../components/Icon'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import { ResultSection } from '../components/ResultSection'
import ToolPageShell, { ToolControls, ToolHelp, ToolPageHero, ToolPageLayout, ToolRelated, ToolResult } from '../components/ToolPageShell'
import { formatAddressee } from '../utils/addresseeFormatter'
import { downloadAddresseeDocx } from '../utils/addresseeDocxExport'
import {
  getEffectiveResult,
  buildPlainTextExport,
  buildHtmlExport,
  buildSingleCsvExport,
  downloadTextAsFile,
} from '../utils/addresseeExport'
import {
  parseCsvText,
  getCsvTemplate,
  buildBulkCsvExport,
} from '../utils/addresseeCsv'
import {
  buildManualReviewItems,
  getAddresseeFieldLabel,
  getConfidenceUi,
  getProfileDisplayLabel,
  getScenarioDisplayLabel,
  getWarningSeverityUi,
  getWarningSuggestionText,
  shouldShowTrustLayer,
} from '../utils/addresseeTrustUi'
import {
  applyScenarioToInput,
  getAddresseeScenarioOptions,
  getDefaultAddresseeScenario,
  getScenarioFromQueryParams,
  getScenarioUiConfig,
  isBulkScenario,
} from '../utils/addresseeScenarioUi'
import { mapDocumentTemplateToScenario } from '../utils/addresseeProfiles'
import {
  isPresetStorageAvailable,
  getRecipientPresets,
  getSenderPresets,
  buildRecipientPresetFromInput,
  buildSenderPresetFromInput,
  applyRecipientPresetToInput,
  applySenderPresetToInput,
  saveAddresseePreset,
  deleteAddresseePreset,
  getRecipientPresetLimit,
  getSenderPresetLimit,
} from '../utils/addresseePresets'
import {
  getAddresseeDraft,
  saveAddresseeDraft,
  clearAddresseeDraft,
  isAddresseeDraftStorageAvailable,
  hasMeaningfulAddresseeDraft,
} from '../utils/addresseeDraftStorage'
import {
  trackAddresseeToolOpened,
  trackAddresseeScenarioChange,
  trackAddresseeGenerated,
  trackAddresseeWarningShown,
  trackAddresseeExplanationOpened,
  trackAddresseeCopyClicked,
  trackAddresseeExportClicked,
  trackAddresseeExportSuccess,
  trackAddresseeCsvImportStarted,
  trackAddresseeCsvImportCompleted,
  trackAddresseeCsvExportSuccess,
  trackAddresseePresetAction,
  trackAddresseePremiumIntent,
  trackAddresseePresetLimitReached,
  trackAddresseeBulkApproachingLimit,
  trackAddresseeExportFormatInterest,
  trackAddresseePackView,
  trackAddresseePackSelect,
  trackAddresseeLanguageSwitch,
} from '../utils/addresseeAnalytics'
import { ADDRESSEE_DOC_PACKS, getDocPack } from '../utils/addresseeDocxPacks'
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
    recipientDativeName: '',
    senderGenitiveName: '',
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
    recipientDativeName: '',
    senderGenitiveName: '',
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
    recipientDativeName: '',
    senderGenitiveName: '',
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
const FOCUS_QUERY_VALUES = new Set(['to', 'from', 'salutation'])

function createEmptyAddresseeForm() {
  return {
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
    recipientDativeName: '',
    senderGenitiveName: '',
    selectedPackId: null,
  }
}

function getInitialAddresseeQueryState() {
  if (typeof window === 'undefined' || !window.location) {
    return { scenario: null, focus: '', exportHint: '' }
  }

  const searchParams = new URLSearchParams(window.location.search || '')
  const focus = searchParams.get('focus') || ''
  const exportParam = searchParams.get('export') || ''

  return {
    scenario: getScenarioFromQueryParams(searchParams),
    focus: FOCUS_QUERY_VALUES.has(focus) ? focus : '',
    exportHint: exportParam === 'docx' ? 'docx' : '',
  }
}

function AddresseeGenerator() {
  const { t, language } = useLanguage()
  const initialQueryState = useMemo(() => getInitialAddresseeQueryState(), [])
  const initialScenarioId = initialQueryState.scenario || getDefaultAddresseeScenario(language)
  const [form, setForm] = useState(() => applyScenarioToInput(createEmptyAddresseeForm(), initialScenarioId))
  const [result, setResult] = useState(null)
  const [activeExampleKey, setActiveExampleKey] = useState('')
  const [copyAllState, setCopyAllState] = useState('idle')
  const [bulkInput, setBulkInput] = useState('')
  const [fullNameError, setFullNameError] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const resultRef = useRef(null)
  const presetActionLocksRef = useRef(new Set())
  const [bulkResults, setBulkResults] = useState([])
  const [bulkError, setBulkError] = useState(null)
  const [bulkSummary, setBulkSummary] = useState(null)
  const [resultOverrides, setResultOverrides] = useState({ to: null, from: null, greeting: null, documentText: null })
  const [editingBlock, setEditingBlock] = useState(null)
  const [editDraft, setEditDraft] = useState('')
  const [recipientPresets, setRecipientPresets] = useState([])
  const [senderPresets, setSenderPresets] = useState([])
  const [presetBusy, setPresetBusy] = useState({
    recipientSave: false,
    senderSave: false,
    recipientDelete: '',
    senderDelete: '',
  })
  const toolOpenedRef = useRef(false)
  const packViewedRef = useRef(false)
  const draftRestoredRef = useRef(false)
  const saveTimerRef = useRef(null)

  const storageAvailable = useMemo(() => isPresetStorageAvailable(), [])
  const draftStorageAvailable = useMemo(() => isAddresseeDraftStorageAvailable(), [])

  useEffect(() => {
    if (!storageAvailable) return
    setRecipientPresets(getRecipientPresets())
    setSenderPresets(getSenderPresets())
  }, [storageAvailable])

  const releasePresetLock = useCallback((lockKey, busyPatch) => {
    const release = () => {
      presetActionLocksRef.current.delete(lockKey)
      setPresetBusy((prev) => ({ ...prev, ...busyPatch }))
    }

    if (typeof window === 'undefined') {
      release()
      return
    }

    window.setTimeout(release, 300)
  }, [])

  useEffect(() => {
    if (draftRestoredRef.current || !draftStorageAvailable) return
    const draft = getAddresseeDraft()
    if (!draft || !hasMeaningfulAddresseeDraft(draft.form)) return
    draftRestoredRef.current = true
    setForm((prev) => ({ ...prev, ...draft.form }))
    setStatusMessage(t('addresseeGenerator.addressee.draft.restored'))
  }, [draftStorageAvailable, t])

  useEffect(() => {
    if (!draftStorageAvailable) return
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current)
          saveTimerRef.current = null
        }
        saveAddresseeDraft(form)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [form, draftStorageAvailable])

  const scheduleDraftSave = useCallback((formData) => {
    if (!draftStorageAvailable) return
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = setTimeout(() => {
      saveAddresseeDraft(formData)
      saveTimerRef.current = null
    }, 500)
  }, [draftStorageAvailable])

  const handleSaveRecipientPreset = useCallback(() => {
    const lockKey = 'recipient-save'
    if (presetActionLocksRef.current.has(lockKey)) return
    presetActionLocksRef.current.add(lockKey)
    setPresetBusy((prev) => ({ ...prev, recipientSave: true }))

    const preset = buildRecipientPresetFromInput(form)
    if (!preset) {
      setStatusMessage(t('addresseeGenerator.addressee.presets.recipientSection.noData'))
      releasePresetLock(lockKey, { recipientSave: false })
      return
    }
    const saveResult = saveAddresseePreset('recipient', preset)
    if (saveResult.success) {
      setRecipientPresets(getRecipientPresets())
      setStatusMessage(t('addresseeGenerator.addressee.presets.recipientSection.saved'))
      trackAddresseePresetAction('recipient', 'save', { language })
    } else if (saveResult.error === 'limit_reached') {
      setStatusMessage(t('addresseeGenerator.addressee.presets.recipientSection.limitReached', { limit: getRecipientPresetLimit() }))
      trackAddresseePresetLimitReached('recipient', getRecipientPresetLimit(), { language })
      trackAddresseePremiumIntent('preset_limit_reached', { language })
    } else if (saveResult.error === 'limit_close') {
      setStatusMessage(t('addresseeGenerator.addressee.presets.recipientSection.limitClose', { limit: getRecipientPresetLimit(), remaining: saveResult.remaining }))
      trackAddresseePresetLimitReached('recipient', getRecipientPresetLimit(), { approaching: true, language })
      trackAddresseePremiumIntent('preset_limit_close', { language })
    }
    releasePresetLock(lockKey, { recipientSave: false })
  }, [form, t, language, releasePresetLock])

  const handleApplyRecipientPreset = useCallback((presetId) => {
    const preset = recipientPresets.find((p) => p.id === presetId)
    if (!preset) return
    setForm((prev) => applyRecipientPresetToInput(prev, preset))
    setStatusMessage(t('addresseeGenerator.addressee.presets.recipientSection.applied'))
    trackAddresseePresetAction('recipient', 'apply', { language })
  }, [recipientPresets, t, language])

  const handleDeleteRecipientPreset = useCallback((presetId) => {
    const lockKey = `recipient-delete-${presetId}`
    if (presetActionLocksRef.current.has(lockKey)) return
    presetActionLocksRef.current.add(lockKey)
    setPresetBusy((prev) => ({ ...prev, recipientDelete: presetId }))

    const deleteResult = deleteAddresseePreset('recipient', presetId)
    setRecipientPresets(getRecipientPresets())
    if (deleteResult.success) {
      setStatusMessage(t('addresseeGenerator.addressee.presets.recipientSection.deleted'))
      trackAddresseePresetAction('recipient', 'delete', { language })
    }
    releasePresetLock(lockKey, { recipientDelete: '' })
  }, [t, language, releasePresetLock])

  const handleSaveSenderPreset = useCallback(() => {
    const lockKey = 'sender-save'
    if (presetActionLocksRef.current.has(lockKey)) return
    presetActionLocksRef.current.add(lockKey)
    setPresetBusy((prev) => ({ ...prev, senderSave: true }))

    const preset = buildSenderPresetFromInput(form)
    if (!preset) {
      setStatusMessage(t('addresseeGenerator.addressee.presets.senderSection.noData'))
      releasePresetLock(lockKey, { senderSave: false })
      return
    }
    const saveResult = saveAddresseePreset('sender', preset)
    if (saveResult.success) {
      setSenderPresets(getSenderPresets())
      setStatusMessage(t('addresseeGenerator.addressee.presets.senderSection.saved'))
      trackAddresseePresetAction('sender', 'save', { language })
    } else if (saveResult.error === 'limit_reached') {
      setStatusMessage(t('addresseeGenerator.addressee.presets.senderSection.limitReached', { limit: getSenderPresetLimit() }))
      trackAddresseePresetLimitReached('sender', getSenderPresetLimit(), { language })
      trackAddresseePremiumIntent('preset_limit_reached', { language })
    } else if (saveResult.error === 'limit_close') {
      setStatusMessage(t('addresseeGenerator.addressee.presets.senderSection.limitClose', { limit: getSenderPresetLimit(), remaining: saveResult.remaining }))
      trackAddresseePresetLimitReached('sender', getSenderPresetLimit(), { approaching: true, language })
      trackAddresseePremiumIntent('preset_limit_close', { language })
    }
    releasePresetLock(lockKey, { senderSave: false })
  }, [form, t, language, releasePresetLock])

  const handleApplySenderPreset = useCallback((presetId) => {
    const preset = senderPresets.find((p) => p.id === presetId)
    if (!preset) return
    setForm((prev) => applySenderPresetToInput(prev, preset))
    setStatusMessage(t('addresseeGenerator.addressee.presets.senderSection.applied'))
    trackAddresseePresetAction('sender', 'apply', { language })
  }, [senderPresets, t, language])

  const handleDeleteSenderPreset = useCallback((presetId) => {
    const lockKey = `sender-delete-${presetId}`
    if (presetActionLocksRef.current.has(lockKey)) return
    presetActionLocksRef.current.add(lockKey)
    setPresetBusy((prev) => ({ ...prev, senderDelete: presetId }))

    const deleteResult = deleteAddresseePreset('sender', presetId)
    setSenderPresets(getSenderPresets())
    if (deleteResult.success) {
      setStatusMessage(t('addresseeGenerator.addressee.presets.senderSection.deleted'))
      trackAddresseePresetAction('sender', 'delete', { language })
    }
    releasePresetLock(lockKey, { senderDelete: '' })
  }, [t, language, releasePresetLock])

  const handleFieldChange = useCallback((field, value) => {
    setForm((prev) => {
      if (field === 'documentTemplate') {
        const scenarioId = mapDocumentTemplateToScenario(value)
        return {
          ...applyScenarioToInput(prev, scenarioId),
          documentTemplate: value,
        }
      }

      return { ...prev, [field]: value }
    })
    setActiveExampleKey('')
    if (field === 'fullName' && value.trim()) {
      setFullNameError(false)
    }
    scheduleDraftSave({ ...form, [field]: value })
  }, [form, scheduleDraftSave])

  const handleScenarioChange = useCallback((scenarioId) => {
    setForm((prev) => ({ ...applyScenarioToInput(prev, scenarioId), selectedPackId: null }))
    setActiveExampleKey('')
    setBulkError(null)
    const scenarioConfig = getScenarioUiConfig(scenarioId, t, language)
    trackAddresseeScenarioChange(scenarioId, scenarioConfig.profileId, language)
  }, [t, language])

  useEffect(() => {
    scheduleDraftSave(form)
  }, [form.scenario, form.profile, form.documentTemplate, scheduleDraftSave])

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
    trackAddresseeGenerated(form, formatted, { language })
    trackAddresseeWarningShown(form, formatted, { language })
    if (resultRef.current) {
      requestAnimationFrame(() => {
        resultRef.current?.focus()
      })
    }
  }, [form, t, language])

const handleGenerate = useCallback(() => {
    const formatted = formatAddressee(form)
    setResult(formatted)
    setResultOverrides({ to: null, from: null, greeting: null, documentText: null })
    setEditingBlock(null)
    setCopyAllState('idle')
    setStatusMessage(t('addresseeGenerator.statusMessages.resultGenerated'))
    trackAddresseeGenerated(form, formatted, { language })
    trackAddresseeWarningShown(form, formatted, { language })
    if (resultRef.current) {
      requestAnimationFrame(() => {
        resultRef.current?.focus()
      })
    }
  }, [form, t, language])

  const handleClear = useCallback(() => {
    setForm(applyScenarioToInput(createEmptyAddresseeForm(), initialScenarioId))
    setResult(null)
    setResultOverrides({ to: null, from: null, greeting: null, documentText: null })
    setEditingBlock(null)
    setActiveExampleKey('')
    setCopyAllState('idle')
    clearAddresseeDraft()
    setStatusMessage(t('addresseeGenerator.addressee.draft.cleared'))
  }, [initialScenarioId, t])

  const handleClearBulk = useCallback(() => {
    setBulkInput('')
    setBulkResults([])
    setBulkError(null)
    setBulkSummary(null)
  }, [])

  const getEffectiveBlockText = useCallback((key) => {
    if (!result) return ''
    const override = resultOverrides[key]
    if (override !== null && override !== undefined) return override
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
    trackAddresseeCsvImportStarted({ language })
    const parseResult = parseCsvText(bulkInput, { maxRows: 50 })

    if (parseResult.errors && parseResult.errors.length > 0) {
      const firstError = parseResult.errors[0]
      const errorCode = firstError.code === 'TOO_MANY_ROWS' ? 'tooManyRows'
        : firstError.code === 'MISSING_FULLNAME' ? 'missingFullName'
        : firstError.code === 'NO_DATA' ? 'empty'
        : 'unrecognized'
      setBulkError(errorCode)
      setBulkResults([])
      setBulkSummary(null)
      setStatusMessage(t(`addresseeGenerator.bulk.${errorCode}`) || t('addresseeGenerator.bulk.uploadError'))
      return
    }

    if (parseResult.rows.length === 0) {
      setBulkError('empty')
      setBulkResults([])
      setBulkSummary(null)
      return
    }

    if (parseResult.rows.length >= 40) {
      trackAddresseeBulkApproachingLimit(parseResult.rows.length, 50, { language })
      trackAddresseePremiumIntent('bulk_approaching_limit', { language })
    }

    const processed = parseResult.rows.map((rowItem) => {
      const formatted = formatAddressee(rowItem.data)
      return { input: rowItem.data, rowNumber: rowItem.rowNumber, fieldErrors: rowItem.fieldErrors, ...formatted }
    })

    setBulkResults(processed)
    setBulkSummary({
      total: processed.length,
      valid: processed.filter((r) => !r.fieldErrors || Object.keys(r.fieldErrors).length === 0).length,
      withWarnings: processed.filter((r) => r.warnings && r.warnings.length > 0).length,
      errors: parseResult.errors.length,
    })
    trackAddresseeCsvImportCompleted(processed.length, { language })

    const unknownColsWarning = parseResult.unknownColumns.length > 0 ? ' ' + t('addresseeGenerator.bulk.unknownColumns') : ''
    setStatusMessage(t('addresseeGenerator.statusMessages.rowsProcessed', { count: processed.length }) + unknownColsWarning)
  }, [bulkInput, t, language])

  const handleCsvFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        setBulkInput(text)
        setBulkError(null)
        trackAddresseeCsvImportStarted({ language })
        const parseResult = parseCsvText(text, { maxRows: 50 })

        if (parseResult.errors && parseResult.errors.length > 0) {
          const firstError = parseResult.errors[0]
          const errorCode = firstError.code === 'TOO_MANY_ROWS' ? 'tooManyRows'
            : firstError.code === 'MISSING_FULLNAME' ? 'missingFullName'
            : firstError.code === 'NO_DATA' ? 'empty'
            : 'unrecognized'
          setBulkError(errorCode)
          setBulkResults([])
          setBulkSummary(null)
          setStatusMessage(t(`addresseeGenerator.bulk.${errorCode}`) || t('addresseeGenerator.bulk.uploadError'))
          return
        }

        if (parseResult.rows.length === 0) {
          setBulkError('empty')
          setBulkResults([])
          setBulkSummary(null)
          return
        }

        if (parseResult.rows.length >= 40) {
          trackAddresseeBulkApproachingLimit(parseResult.rows.length, 50, { language })
          trackAddresseePremiumIntent('bulk_approaching_limit', { language })
        }

        const processed = parseResult.rows.map((rowItem) => {
          const formatted = formatAddressee(rowItem.data)
          return { input: rowItem.data, rowNumber: rowItem.rowNumber, fieldErrors: rowItem.fieldErrors, ...formatted }
        })
        setBulkResults(processed)
        setBulkSummary({
          total: processed.length,
          valid: processed.filter((r) => !r.fieldErrors || Object.keys(r.fieldErrors).length === 0).length,
          withWarnings: processed.filter((r) => r.warnings && r.warnings.length > 0).length,
          errors: parseResult.errors.length,
        })
        trackAddresseeCsvImportCompleted(processed.length, { language })
        const unknownColsWarning = parseResult.unknownColumns.length > 0 ? ' ' + t('addresseeGenerator.bulk.unknownColumns') : ''
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
  }, [t, language])

  const handleDownloadBulkCsv = useCallback(() => {
    if (bulkResults.length === 0) return
    const csv = buildBulkCsvExport(bulkResults)
    downloadTextAsFile(csv, 'addressee-generator-bulk-result.csv', 'text/csv;charset=utf-8;')
    setStatusMessage(t('addresseeGenerator.statusMessages.csvDownloaded'))
  }, [bulkResults, t])

  const handleDownloadCsvTemplate = useCallback(() => {
    const template = getCsvTemplate()
    downloadTextAsFile(template, 'addressee-generator-template.csv', 'text/csv;charset=utf-8;')
    setStatusMessage(t('addresseeGenerator.statusMessages.csvDownloaded'))
  }, [t])

  const handleLoadExample = useCallback((example) => {
    const nextForm = applyScenarioToInput({
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
      recipientDativeName: example.recipientDativeName || '',
      senderGenitiveName: example.senderGenitiveName || '',
    }, mapDocumentTemplateToScenario(example.documentTemplate || DOCUMENT_TEMPLATE_BUSINESS_LETTER))
    setForm(nextForm)
    const formatted = formatAddressee(nextForm)
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
    const csv = buildSingleCsvExport(result, form, resultOverrides)
    downloadTextAsFile(csv, 'addressee-generator-result.csv', 'text/csv;charset=utf-8;')
    setStatusMessage(t('addresseeGenerator.statusMessages.csvDownloaded'))
    trackAddresseeExportClicked(form, result, 'csv', { language })
  }, [result, form, resultOverrides, t, language])

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
      trackAddresseeCopyClicked(form, result, 'full', { language })
    } catch {
      setCopyAllState('error')
      setTimeout(() => setCopyAllState('idle'), 2000)
    }
  }, [copyAllText, t, form, result, language])

  const getWarningMessage = useCallback((warning) => {
    if (!warning || !warning.code) return warning?.message || ''
    const trustKey = `addressee.warnings.${warning.code}`
    const legacyKey = `addresseeGenerator.warningCodes.${warning.code}`
    const trustLocalized = t(trustKey)
    if (trustLocalized && trustLocalized !== trustKey) return trustLocalized
    const legacyLocalized = t(legacyKey)
    return legacyLocalized && legacyLocalized !== legacyKey ? legacyLocalized : (warning.message || warning.code)
  }, [t])

  const getWarningSuggestion = useCallback((warning) => getWarningSuggestionText(warning, t), [t])

  const getDocumentExportText = useCallback(() => {
    if (!result) return ''
    const labels = {
      to: t('addresseeGenerator.export.to'),
      from: t('addresseeGenerator.export.from'),
      greeting: t('addresseeGenerator.export.greeting'),
      documentTemplate: t('addresseeGenerator.export.documentTemplate'),
    }
    return buildPlainTextExport(result, resultOverrides, labels)
  }, [result, resultOverrides, t])

  const handleExportTxt = useCallback(() => {
    if (!result) return
    const text = getDocumentExportText()
    if (!text) return
    const content = '\uFEFF' + text
    downloadTextAsFile(content, 'addressee-generator-document.txt', 'text/plain;charset=utf-8;')
    setStatusMessage(t('addresseeGenerator.statusMessages.txtDownloaded'))
    trackAddresseeExportClicked(form, result, 'txt', { language })
  }, [result, getDocumentExportText, t, form, language])

  const handleExportHtml = useCallback(() => {
    if (!result) return
    const labels = {
      to: t('addresseeGenerator.export.to'),
      from: t('addresseeGenerator.export.from'),
      greeting: t('addresseeGenerator.export.greeting'),
      documentTemplate: t('addresseeGenerator.export.documentTemplate'),
      disclaimer: t('addresseeGenerator.export.disclaimer'),
      docxDocumentLabel: form.documentTemplate
        ? t(`addresseeGenerator.documentTemplate.${form.documentTemplate}`)
        : t('addresseeGenerator.documentTemplate.businessLetter'),
    }
    const html = buildHtmlExport(result, resultOverrides, {
      labels,
      lang: language || 'ru',
      templateTitle: labels.docxDocumentLabel,
    })
    downloadTextAsFile(html, 'addressee-generator-document.html', 'text/html;charset=utf-8;')
    setStatusMessage(t('addresseeGenerator.statusMessages.htmlDownloaded'))
    trackAddresseeExportClicked(form, result, 'html', { language })
  }, [result, resultOverrides, form, language, t])

  const handleExportDocx = useCallback(async () => {
    if (!result) return
    try {
      const resultForExport = getEffectiveResult(result, resultOverrides)
      await downloadAddresseeDocx(resultForExport, { t })
      setStatusMessage(t('addresseeGenerator.statusMessages.docxDownloaded'))
      trackAddresseeExportClicked(form, result, 'docx', { language })
      trackAddresseeExportFormatInterest('docx', { language })
    } catch (err) {
      console.warn('DOCX export failed:', err)
      setStatusMessage(t('addresseeGenerator.statusMessages.docxError'))
    }
  }, [result, resultOverrides, t, form, language])

  const trustLayerVisible = useMemo(() => shouldShowTrustLayer(result), [result])

  const confidenceUi = useMemo(() => {
    if (!result) return getConfidenceUi('low', t)
    const label = result.confidenceLabel || (result.confidence >= 0.8 ? 'high' : result.confidence >= 0.6 ? 'medium' : 'low')
    return getConfidenceUi(label, t)
  }, [result, t])

  const manualReviewItems = useMemo(() => buildManualReviewItems(result, t), [result, t])

  const profileLabel = useMemo(() => getProfileDisplayLabel(result?.profile, t), [result, t])

  const scenarioLabel = useMemo(() => getScenarioDisplayLabel(result?.scenario, t), [result, t])

  const scenarioOptions = useMemo(() => getAddresseeScenarioOptions(t, language), [t, language])

  const activeScenario = useMemo(() => getScenarioUiConfig(form.scenario, t, language), [form.scenario, t, language])

  const activeFocusHint = initialQueryState.focus

  const queryExportHint = initialQueryState.exportHint

  const bulkScenarioSelected = isBulkScenario(form.scenario)

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
              <p className="addr-gen-intro-privacy">{t('addresseeGenerator.introPrivacy')}</p>
            </div>

            <section className="addr-gen-scenario" aria-labelledby="addrScenarioTitle">
              <div className="addr-gen-scenario-head">
                <div>
                  <span className="addr-gen-panel-kicker">{t('addresseeGenerator.addressee.scenarioUx.kicker')}</span>
                  <h3 id="addrScenarioTitle">{t('addresseeGenerator.addressee.scenarioUx.title')}</h3>
                </div>
                <span className="addr-gen-scenario-current">
                  {t('addresseeGenerator.addressee.scenarioUx.currentLabel')}: {activeScenario.label}
                </span>
              </div>

              <div className="addr-gen-scenario-grid" role="list" aria-label={t('addresseeGenerator.addressee.scenarioUx.title')}>
                {scenarioOptions.map((option) => {
                  const isSelected = form.scenario === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`addr-gen-scenario-card ${isSelected ? 'addr-gen-scenario-card--selected' : ''}`.trim()}
                      onClick={() => handleScenarioChange(option.id)}
                      aria-pressed={isSelected}
                    >
                      <span className="addr-gen-scenario-card-title">{option.label}</span>
                      <span className="addr-gen-scenario-card-desc">{option.description}</span>
                    </button>
                  )
                })}
              </div>

              <div className="addr-gen-scenario-guidance">
                <p>{activeScenario.hint}</p>
                {(activeFocusHint || queryExportHint || bulkScenarioSelected) && (
                  <div className="addr-gen-query-hints">
                    {activeFocusHint && (
                      <span>{t(`addresseeGenerator.addressee.scenarioUx.focusHints.${activeFocusHint}`)}</span>
                    )}
                    {queryExportHint === 'docx' && (
                      <span>{t('addresseeGenerator.addressee.scenarioUx.queryHints.exportDocx')}</span>
                    )}
                    {bulkScenarioSelected && (
                      <span>{t('addresseeGenerator.addressee.scenarioUx.queryHints.csvBulk')}</span>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="addr-gen-packs" aria-labelledby="addrPacksTitle">
              <div className="addr-gen-packs-head">
                <span className="addr-gen-panel-kicker">{t('addresseeGenerator.addressee.packs.kicker')}</span>
                <h3 id="addrPacksTitle">{t('addresseeGenerator.addressee.packs.title')}</h3>
              </div>
              <div className="addr-gen-packs-grid" role="list" aria-label={t('addresseeGenerator.addressee.packs.title')}>
                {ADDRESSEE_DOC_PACKS.map((pack) => {
                  const lang = language === 'en' ? 'en' : 'ru';
                  const packContent = pack.pack[lang];
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      className={`addr-gen-pack-card ${form.selectedPackId === pack.id ? 'addr-gen-pack-card--selected' : ''}`.trim()}
                      onClick={() => {
                        const newForm = {
                          ...form,
                          selectedPackId: pack.id,
                          documentTemplate: pack.documentTemplate,
                          scenario: pack.scenarioId,
                        };
                        setForm(newForm);
                      }}
                      aria-pressed={form.selectedPackId === pack.id}
                    >
                      <span className="addr-gen-pack-card-title">{packContent.title}</span>
                      <span className="addr-gen-pack-card-desc">{packContent.shortDescription}</span>
                      {pack.premiumHookLabelKey && (
                        <span className="addr-gen-pack-card-hook">{t(pack.premiumHookLabelKey)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <form onSubmit={handleSubmit} className="addr-gen-form">
            <section className={`addr-gen-form-section ${activeFocusHint === 'to' ? 'addr-gen-form-section--focused' : ''}`.trim()} aria-labelledby="addrRecipientTitle">
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

              {!storageAvailable && (
                <p className="addr-gen-preset-warning" role="alert">
                  {t('addresseeGenerator.addressee.presets.storageUnavailable')}
                </p>
              )}

              {storageAvailable && (
                <details className="addr-gen-presets" open={recipientPresets.length > 0}>
                  <summary className="addr-gen-presets-summary">
                    <span className="addr-gen-presets-title">{t('addresseeGenerator.addressee.presets.recipientSection.title')}</span>
                    <span className="addr-gen-presets-note">{t('addresseeGenerator.addressee.presets.storageNote')}</span>
                  </summary>

                  {recipientPresets.length === 0 ? (
                    <p className="addr-gen-presets-empty">{t('addresseeGenerator.addressee.presets.recipientSection.empty')}</p>
                  ) : (
                    <div className="addr-gen-presets-list">
                      {recipientPresets.map((preset) => {
                        const isDeleting = presetBusy.recipientDelete === preset.id
                        return (
                        <div key={preset.id} className="addr-gen-preset-row">
                          <span className="addr-gen-preset-label">{preset.label}</span>
                          <button
                            type="button"
                            className="addr-gen-btn addr-gen-btn--tiny"
                            onClick={() => handleApplyRecipientPreset(preset.id)}
                            disabled={isDeleting}
                          >
                            {t('addresseeGenerator.addressee.presets.recipientSection.apply')}
                          </button>
                          <button
                            type="button"
                            className="addr-gen-btn addr-gen-btn--tiny addr-gen-btn--danger"
                            onClick={() => handleDeleteRecipientPreset(preset.id)}
                            disabled={isDeleting}
                          >
                            {t('addresseeGenerator.addressee.presets.recipientSection.delete')}
                          </button>
                        </div>
                        )
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    className="addr-gen-btn addr-gen-btn--secondary addr-gen-btn--compact"
                    onClick={handleSaveRecipientPreset}
                    disabled={presetBusy.recipientSave}
                  >
                    <Icon name="bookmark" size={14} />
                    {t('addresseeGenerator.addressee.presets.recipientSection.save')}
                  </button>
                </details>
              )}

{storageAvailable && (
                <>
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
                </>
              )}

              {storageAvailable && (
                <details className="addr-gen-presets" open={senderPresets.length > 0}>
                  <summary className="addr-gen-presets-summary">
                    <span className="addr-gen-presets-title">{t('addresseeGenerator.addressee.presets.senderSection.title')}</span>
                    <span className="addr-gen-presets-note">{t('addresseeGenerator.addressee.presets.storageNote')}</span>
                  </summary>

                  {senderPresets.length === 0 ? (
                    <p className="addr-gen-presets-empty">{t('addresseeGenerator.addressee.presets.senderSection.empty')}</p>
                  ) : (
                    <div className="addr-gen-presets-list">
                      {senderPresets.map((preset) => {
                        const isDeleting = presetBusy.senderDelete === preset.id
                        return (
                        <div key={preset.id} className="addr-gen-preset-row">
                          <span className="addr-gen-preset-label">{preset.label}</span>
                          <button
                            type="button"
                            className="addr-gen-btn addr-gen-btn--tiny"
                            onClick={() => handleApplySenderPreset(preset.id)}
                            disabled={isDeleting}
                          >
                            {t('addresseeGenerator.addressee.presets.senderSection.apply')}
                          </button>
                          <button
                            type="button"
                            className="addr-gen-btn addr-gen-btn--tiny addr-gen-btn--danger"
                            onClick={() => handleDeleteSenderPreset(preset.id)}
                            disabled={isDeleting}
                          >
                            {t('addresseeGenerator.addressee.presets.senderSection.delete')}
                          </button>
                        </div>
                        )
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    className="addr-gen-btn addr-gen-btn--secondary addr-gen-btn--compact"
                    onClick={handleSaveSenderPreset}
                    disabled={presetBusy.senderSave}
                  >
                    <Icon name="bookmark" size={14} />
                    {t('addresseeGenerator.addressee.presets.senderSection.save')}
                  </button>
                </details>
              )}

              <details className="addr-gen-case-forms" aria-labelledby="addrCaseFormsTitle" open={Boolean(form.recipientDativeName || form.senderGenitiveName)}>
                <summary className="addr-gen-case-forms-heading">
                  <span>
                    <h4 id="addrCaseFormsTitle">{t('addresseeGenerator.addressee.scenarioUx.advanced.title')}</h4>
                    <p>{t('addresseeGenerator.addressee.scenarioUx.advanced.description')}</p>
                  </span>
                </summary>

                <div className="addr-gen-case-forms-body">
                  <div className="addr-gen-field">
                    <label className="addr-gen-label" htmlFor="addrRecipientDativeName">
                      {t('addresseeGenerator.fields.recipientDativeName')}
                    </label>
                    <input
                      id="addrRecipientDativeName"
                      className="addr-gen-input"
                      type="text"
                      value={form.recipientDativeName}
                      onChange={(e) => handleFieldChange('recipientDativeName', e.target.value)}
                      placeholder={t('addresseeGenerator.placeholders.recipientDativeName')}
                      aria-describedby="addrRecipientDativeNameHint"
                    />
                    <p className="addr-gen-hint" id="addrRecipientDativeNameHint">{t('addresseeGenerator.hints.recipientDativeName')}</p>
                  </div>

                  <div className="addr-gen-field">
                    <label className="addr-gen-label" htmlFor="addrSenderGenitiveName">
                      {t('addresseeGenerator.fields.senderGenitiveName')}
                    </label>
                    <input
                      id="addrSenderGenitiveName"
                      className="addr-gen-input"
                      type="text"
                      value={form.senderGenitiveName}
                      onChange={(e) => handleFieldChange('senderGenitiveName', e.target.value)}
                      placeholder={t('addresseeGenerator.placeholders.senderGenitiveName')}
                      aria-describedby="addrSenderGenitiveNameHint"
                    />
                    <p className="addr-gen-hint" id="addrSenderGenitiveNameHint">{t('addresseeGenerator.hints.senderGenitiveName')}</p>
                  </div>
                </div>
              </details>
            </section>

            <section className={`addr-gen-form-section ${activeFocusHint === 'salutation' ? 'addr-gen-form-section--focused' : ''}`.trim()} aria-labelledby="addrSettingsTitle">
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

            <section className={`addr-gen-bulk ${bulkScenarioSelected ? 'addr-gen-bulk--active' : ''}`.trim()} aria-labelledby="addrBulkTitle">
              <div className="addr-gen-bulk-header">
                <h2 id="addrBulkTitle">{t('addresseeGenerator.bulk.title')}</h2>
                <p className="addr-gen-bulk-desc">{t('addresseeGenerator.bulk.description')}</p>
                <p className="addr-gen-bulk-pro-hint">{t('addresseeGenerator.bulk.proHint')}</p>
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
                <button
                  type="button"
                  className="addr-gen-btn addr-gen-btn--secondary"
                  onClick={handleDownloadCsvTemplate}
                >
                  <Icon name="download" size={16} />
                  {t('addresseeGenerator.bulk.downloadTemplate')}
                </button>
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
                <p className="addr-gen-free-notice">{t('addresseeGenerator.freeForeverNotice')}</p>

                {trustLayerVisible && (
                  <section className="addr-gen-trust-layer" aria-label={t('addresseeGenerator.addressee.trust.title')}>
                    <div className="addr-gen-trust-summary">
                      <div className="addr-gen-trust-summary-main">
                        <span className="addr-gen-panel-kicker">{t('addresseeGenerator.addressee.trust.title')}</span>
                        <h3 className="addr-gen-trust-title">{confidenceUi.title}</h3>
                        <p className="addr-gen-trust-description">{confidenceUi.description}</p>
                      </div>
                      <div className="addr-gen-trust-badges">
                        <div className="addr-gen-confidence">
                          <span className={`addr-gen-confidence-badge ${confidenceUi.className}`.trim()}>
                            {confidenceUi.title}
                          </span>
                          <span className="addr-gen-confidence-score">{Math.round(result.confidence * 100)}%</span>
                        </div>
                        {(profileLabel || scenarioLabel) && (
                          <div className="addr-gen-profile-context">
                            {profileLabel && (
                              <span className="addr-gen-profile-badge">
                                {t('addresseeGenerator.addressee.trust.profileLabel')}: {profileLabel}
                              </span>
                            )}
                            {scenarioLabel && (
                              <span className="addr-gen-profile-badge">
                                {t('addresseeGenerator.addressee.trust.scenarioLabel')}: {scenarioLabel}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {result.manualReviewRequired && manualReviewItems.length > 0 && (
                      <div className="addr-gen-manual-review">
                        <div>
                          <strong>{t('addresseeGenerator.addressee.trust.manualReview.title')}</strong>
                          <p>{t('addresseeGenerator.addressee.trust.manualReview.description')}</p>
                        </div>
                        <ul className="addr-gen-manual-review-list">
                          {manualReviewItems.map((item) => (
                            <li key={`${item.key}-${item.label}`}>
                              <span>{item.label}</span>
                              <span>{item.reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.warnings && result.warnings.length > 0 && (
                      <div className="addr-gen-trust-panel addr-gen-warnings">
                        <h4>{t('addresseeGenerator.addressee.trust.warnings.title')}</h4>
                        <ul className="addr-gen-warnings-list">
                          {result.warnings.map((warning, idx) => {
                            const severityUi = getWarningSeverityUi(warning.severity, t)
                            const fieldLabel = getAddresseeFieldLabel(warning.field, t)
                            const suggestion = getWarningSuggestion(warning)
                            return (
                              <li className="addr-gen-warning-item" key={`${warning.code}-${idx}`}>
                                <div className="addr-gen-warning-meta">
                                  <span className={`addr-gen-warning-severity ${severityUi.className}`.trim()}>{severityUi.label}</span>
                                  {fieldLabel && <span className="addr-gen-warning-field">{fieldLabel}</span>}
                                </div>
                                <p>{getWarningMessage(warning)}</p>
                                {suggestion && (
                                  <p className="addr-gen-warning-suggestion">
                                    <span>{t('addresseeGenerator.addressee.trust.warning.suggestionPrefix')}</span> {suggestion}
                                  </p>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    {result.explanations && result.explanations.length > 0 && (
                      <div className="addr-gen-trust-panel addr-gen-explanations">
                        <h4>{t('addresseeGenerator.addressee.trust.explanations.title')}</h4>
                        <div className="addr-gen-explanation-list">
                          {result.explanations.map((explanation, idx) => {
                            return (
                              <details
                                className="addr-gen-explanation-card"
                                key={`${explanation.code}-${idx}`}
                                onToggle={() => {
                                  const detailsEl = document.getElementById(`addr-exp-${idx}`)
                                  if (detailsEl?.open) {
                                    trackAddresseeExplanationOpened(form, result, explanation.code, { language })
                                  }
                                }}
                              >
                                <summary id={`addr-exp-${idx}`}>
                                  <span>{explanation.title}</span>
                                </summary>
                                <p>{explanation.text}</p>
                              </details>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                <div className="addr-gen-result-cards">
                  {resultBlocks.map((block) => {
                    const isEditable = ['to', 'from', 'greeting', 'documentText'].includes(block.key)
                    const effectiveText = getEffectiveBlockText(block.key)
                    const hasOverride = resultOverrides[block.key] !== null && resultOverrides[block.key] !== undefined
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
                <p className="addr-gen-export-premium-hint">{t('addresseeGenerator.exportPremiumHint')}</p>
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
