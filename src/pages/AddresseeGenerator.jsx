import { useState, useMemo, useCallback } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import Icon from '../components/Icon'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import { ResultSection, ResultNotice } from '../components/ResultSection'
import ToolPageShell, { ToolControls, ToolHelp, ToolPageHero, ToolPageLayout, ToolRelated, ToolResult } from '../components/ToolPageShell'
import { formatAddressee } from '../utils/addresseeFormatter'
import {
  GENDER_MALE,
  GENDER_FEMALE,
  GENDER_UNKNOWN,
  GREETING_NAME_PATRONYMIC,
  GREETING_FULL_NAME,
  GREETING_COLLEAGUES,
  PUNCTUATION_EXCLAMATION,
  PUNCTUATION_COMMA,
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
  },
  {
    key: 'application',
    fullName: 'Петрова Анна Сергеевна',
    position: 'руководитель отдела кадров',
    organization: 'АО «Север»',
    gender: GENDER_FEMALE,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
  },
  {
    key: 'neutral',
    fullName: 'Смирнов Алексей',
    position: 'менеджер',
    organization: 'ИП Смирнов А.А.',
    gender: GENDER_UNKNOWN,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_COMMA,
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

function AddresseeGenerator() {
  const { t, language } = useLanguage()
  const [form, setForm] = useState({
    fullName: '',
    position: '',
    organization: '',
    gender: GENDER_UNKNOWN,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
  })
  const [result, setResult] = useState(null)
  const [activeExampleKey, setActiveExampleKey] = useState('')
  const [copyAllState, setCopyAllState] = useState('idle')

  const handleFieldChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setActiveExampleKey('')
  }, [])

  const handleGenerate = useCallback(() => {
    const formatted = formatAddressee(form)
    setResult(formatted)
    setCopyAllState('idle')
  }, [form])

  const handleClear = useCallback(() => {
    setForm({
      fullName: '',
      position: '',
      organization: '',
      gender: GENDER_UNKNOWN,
      greetingMode: GREETING_NAME_PATRONYMIC,
      punctuation: PUNCTUATION_EXCLAMATION,
    })
    setResult(null)
    setActiveExampleKey('')
    setCopyAllState('idle')
  }, [])

  const handleLoadExample = useCallback((example) => {
    setForm({
      fullName: example.fullName,
      position: example.position,
      organization: example.organization,
      gender: example.gender,
      greetingMode: example.greetingMode,
      punctuation: example.punctuation,
    })
    const formatted = formatAddressee(example)
    setResult(formatted)
    setActiveExampleKey(example.key)
    setCopyAllState('idle')
  }, [])

  const handleExportCsv = useCallback(() => {
    if (!result) return
    const blocks = result.blocks || {}
    const lines = [
      ['field', 'value'],
      ['fullName', form.fullName],
      ['position', form.position],
      ['organization', form.organization],
      ['gender', form.gender],
      ['greetingMode', form.greetingMode],
      ['punctuation', form.punctuation],
      ['to', blocks.to],
      ['from', blocks.from],
      ['greeting', blocks.greeting],
      ['letter', blocks.letter],
      ['confidence', String(result.confidence)],
      ['warnings', serializeWarnings(result.warnings)],
    ].map(toCsvRow)
    const csv = '\uFEFF' + lines.join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'addressee-blocks.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }, [result, form])

  const copyAllText = useMemo(() => {
    if (!result) return ''
    return result.blocks.letter || [result.blocks.to, result.blocks.from, result.blocks.greeting].filter(Boolean).join('\n\n')
  }, [result])

  const handleCopyAll = useCallback(async () => {
    if (!copyAllText) return

    try {
      await navigator.clipboard.writeText(copyAllText)
      setCopyAllState('copied')
      setTimeout(() => setCopyAllState('idle'), 2000)
    } catch {
      setCopyAllState('error')
      setTimeout(() => setCopyAllState('idle'), 2000)
    }
  }, [copyAllText])

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

        <ToolPageLayout className="addr-gen-layout">
          <ToolControls className="addr-gen-controls">
            <div className="addr-gen-panel-heading">
              <span className="addr-gen-panel-kicker">{t('addresseeGenerator.formKicker')}</span>
              <h2 className="addr-gen-panel-title">{t('addresseeGenerator.formTitle')}</h2>
              <p className="addr-gen-panel-desc">{t('addresseeGenerator.formDescription')}</p>
            </div>

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

                <div className="addr-gen-field addr-gen-field--setting">
                  <label className="addr-gen-label" htmlFor="addrPunctuation">{t('addresseeGenerator.fields.punctuation')}</label>
                  <select
                    id="addrPunctuation"
                    value={form.punctuation}
                    onChange={(e) => handleFieldChange('punctuation', e.target.value)}
                    className="addr-gen-select addr-gen-select--punctuation"
                  >
                    <option value={PUNCTUATION_EXCLAMATION}>{t('addresseeGenerator.punctuation.exclamation')}</option>
                    <option value={PUNCTUATION_COMMA}>{t('addresseeGenerator.punctuation.comma')}</option>
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
              <button type="button" className="addr-gen-btn addr-gen-btn--primary" onClick={handleGenerate}>
                <Icon name="refresh" size={18} />
                {t('addresseeGenerator.buttons.generate')}
              </button>
              <button type="button" className="addr-gen-btn addr-gen-btn--secondary" onClick={handleClear}>
                {t('addresseeGenerator.buttons.clear')}
              </button>
            </div>

            <section className="addr-gen-locked" aria-labelledby="addrBulkTitle">
              <div className="addr-gen-locked-head">
                <span className="addr-gen-locked-icon">
                  <Icon name="lock" size={18} />
                </span>
                <div>
                  <span className="addr-gen-coming-soon">{t('addresseeGenerator.buttons.comingSoon')}</span>
                  <h2 id="addrBulkTitle">{t('addresseeGenerator.bulkTitle')}</h2>
                </div>
              </div>
              <p>{t('addresseeGenerator.bulkDescription')}</p>
              <textarea
                className="addr-gen-textarea"
                placeholder={t('addresseeGenerator.bulkPlaceholder')}
                rows={4}
                disabled
                aria-describedby="addrBulkHint"
              />
              <p className="addr-gen-hint" id="addrBulkHint">{t('addresseeGenerator.bulkHint')}</p>
              <button type="button" className="addr-gen-btn addr-gen-btn--disabled" disabled>
                <Icon name="schedule" size={16} />
                {t('addresseeGenerator.buttons.bulkComingSoon')}
              </button>
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
              <div className="addr-gen-results">
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
                  {resultBlocks.map((block) => (
                    <ResultSection tone="default" className={`addr-gen-block-card addr-gen-block-card--${block.key}`} key={block.key}>
                      <div className="addr-gen-block-header">
                        <div>
                          <span className="addr-gen-block-label">{t('addresseeGenerator.resultBlockLabel')}</span>
                          <h3 className="addr-gen-block-title">{block.title}</h3>
                        </div>
                        <CopyButton
                          className="addr-gen-copy-btn"
                          text={block.text}
                          analytics={{ toolSlug: 'addressee-generator', linkType: 'result' }}
                        />
                      </div>
                      <pre className="addr-gen-block-content">{block.text}</pre>
                    </ResultSection>
                  ))}
                </div>

                <div className="addr-gen-export-actions">
                  <button
                    type="button"
                    className="addr-gen-btn addr-gen-btn--secondary addr-gen-btn--export"
                    onClick={handleExportCsv}
                  >
                    <Icon name="list_ordered" size={16} />
                    {t('addresseeGenerator.buttons.exportCsv')}
                  </button>
                  <button
                    type="button"
                    className="addr-gen-btn addr-gen-btn--disabled"
                    disabled
                    title={t('addresseeGenerator.buttons.docxComingSoon')}
                  >
                    <Icon name="lock" size={16} />
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
