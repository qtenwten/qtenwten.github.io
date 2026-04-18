import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import ToolPageShell, { ToolControls, ToolHelp, ToolPageHero, ToolRelated } from '../components/ToolPageShell'
import Icon from '../components/Icon'
import { ResultActions, ResultNotice, ResultSection, ResultSummary } from '../components/ResultSection'
import { numberToWords } from '../utils/numberToWords'
import { filterNumberInput, handleNumberKeyDown } from '../utils/numberInput'
import { safeGetItem, safeParseJSON, safeSetItem } from '../utils/storage'
import './NumberToWords.css'

const NUMBER_TO_WORDS_STORAGE_KEY = 'numberToWords'
const DEFAULT_PINNED_VARIANT = 'format-1'

function getStoredNumberToWordsState() {
  return safeParseJSON(safeGetItem(NUMBER_TO_WORDS_STORAGE_KEY), {}) || {}
}

function NumberToWords() {
  const { t, language } = useLanguage()
  const storedState = useMemo(() => getStoredNumberToWordsState(), [])
  const [number, setNumber] = useState(storedState.number || '')
  const [currency, setCurrency] = useState(storedState.currency || 'RUB')
  const [withMinor, setWithMinor] = useState(storedState.withMinor ?? true)
  const [taxMode, setTaxMode] = useState(storedState.taxMode || 'none')
  const [taxRate, setTaxRate] = useState(storedState.taxRate ?? 20)
  const [separator, setSeparator] = useState(storedState.separator || '.')
  const [pinnedVariantId, setPinnedVariantId] = useState(storedState.pinnedVariantId || DEFAULT_PINNED_VARIANT)
  const [result, setResult] = useState(null)
  const debounceTimer = useRef(null)
  const inputRef = useRef(null)

  const templateCopy = language === 'en'
    ? {
        vatLabel: 'VAT',
        incomeTaxLabel: 'Income Tax',
        notApplicable: 'VAT not applicable',
        inclShort: 'incl.',
        including: 'including',
        amountIn: 'amounting to',
        longTax: 'including',
      }
    : {
        vatLabel: 'НДС',
        incomeTaxLabel: 'НДФЛ',
        notApplicable: 'НДС не облагается',
        inclShort: 'в т.ч.',
        including: 'включая',
        amountIn: 'в сумме',
        longTax: 'в том числе',
      }

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const calculateResult = useCallback((num, curr, minor, tax, rate) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      if (num) {
        // Нормализуем число с учетом разделителя
        const normalizedNum = num.replace(',', '.')
        const res = numberToWords(normalizedNum, curr, minor, tax, rate, language)
        setResult(res)
      } else {
        setResult(null)
      }
    }, 300)
  }, [language])

  useEffect(() => {
    safeSetItem(NUMBER_TO_WORDS_STORAGE_KEY, JSON.stringify({
      number,
      currency,
      withMinor,
      taxMode,
      taxRate,
      separator,
      pinnedVariantId,
    }))
  }, [number, currency, withMinor, taxMode, taxRate, separator, pinnedVariantId])

  useEffect(() => {
    calculateResult(number, currency, withMinor, taxMode, taxRate)
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [number, currency, withMinor, taxMode, taxRate, calculateResult])

  const handleClear = () => {
    setNumber('')
    setResult(null)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const capitalizeFirst = (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  const getCurrencySymbol = (curr) => {
    const symbols = {
      RUB: '₽',
      USD: '$',
      EUR: '€',
      KZT: '₸',
      CNY: '¥',
      UAH: '₴',
      BYN: 'Br',
      UZS: "so'm"
    }
    return symbols[curr] || curr
  }

  const getCurrencyForms = (curr) => {
    const forms = language === 'en'
      ? {
          RUB: { one: 'ruble', few: 'rubles', many: 'rubles', short: 'rub.' },
          USD: { one: 'dollar', few: 'dollars', many: 'dollars', short: '$' },
          EUR: { one: 'euro', few: 'euros', many: 'euros', short: '€' },
          KZT: { one: 'tenge', few: 'tenge', many: 'tenge', short: '₸' },
          CNY: { one: 'yuan', few: 'yuan', many: 'yuan', short: '¥' },
          UAH: { one: 'hryvnia', few: 'hryvnias', many: 'hryvnias', short: '₴' },
          BYN: { one: 'Belarusian ruble', few: 'Belarusian rubles', many: 'Belarusian rubles', short: 'Br' },
          UZS: { one: 'sum', few: 'sums', many: 'sums', short: "so'm" }
        }
      : {
          RUB: { one: 'рубль', few: 'рубля', many: 'рублей', short: 'руб.' },
          USD: { one: 'доллар', few: 'доллара', many: 'долларов', short: '$' },
          EUR: { one: 'евро', few: 'евро', many: 'евро', short: '€' },
          KZT: { one: 'тенге', few: 'тенге', many: 'тенге', short: '₸' },
          CNY: { one: 'юань', few: 'юаня', many: 'юаней', short: '¥' },
          UAH: { one: 'гривна', few: 'гривны', many: 'гривен', short: '₴' },
          BYN: { one: 'белорусский рубль', few: 'белорусских рубля', many: 'белорусских рублей', short: 'Br' },
          UZS: { one: 'сум', few: 'сума', many: 'сумов', short: "so'm" }
        }

    return forms[curr] || forms.RUB
  }

  const getCurrencyWord = (num, curr) => {
    const forms = getCurrencyForms(curr)
    const value = Math.abs(Number(num))
    const mod10 = value % 10
    const mod100 = value % 100

    if (language === 'en') {
      return value === 1 ? forms.one : forms.many
    }

    if (mod100 >= 11 && mod100 <= 19) return forms.many
    if (mod10 === 1) return forms.one
    if (mod10 >= 2 && mod10 <= 4) return forms.few
    return forms.many
  }

  const getCurrencyShort = (curr) => getCurrencyForms(curr).short

  const pluralizeMinor = (number, curr) => {
    const minorForms = language === 'en'
      ? {
          RUB: { one: 'kopeck', few: 'kopecks', many: 'kopecks' },
          USD: { one: 'cent', few: 'cents', many: 'cents' },
          EUR: { one: 'cent', few: 'cents', many: 'cents' },
          KZT: { one: 'tiyn', few: 'tiyns', many: 'tiyns' },
          CNY: { one: 'fen', few: 'fen', many: 'fen' },
          UAH: { one: 'kopeck', few: 'kopecks', many: 'kopecks' },
          BYN: { one: 'kopeck', few: 'kopecks', many: 'kopecks' },
          UZS: { one: 'tiyin', few: 'tiyins', many: 'tiyins' }
        }
      : {
          RUB: { one: 'копейка', few: 'копейки', many: 'копеек' },
          USD: { one: 'цент', few: 'цента', many: 'центов' },
          EUR: { one: 'цент', few: 'цента', many: 'центов' },
          KZT: { one: 'тиын', few: 'тиына', many: 'тиынов' },
          CNY: { one: 'фэнь', few: 'фэня', many: 'фэней' },
          UAH: { one: 'копейка', few: 'копейки', many: 'копеек' },
          BYN: { one: 'копейка', few: 'копейки', many: 'копеек' },
          UZS: { one: 'тийин', few: 'тийина', many: 'тийинов' }
        }

    const forms = minorForms[curr] || minorForms.RUB
    const num = parseInt(number)
    const mod10 = num % 10
    const mod100 = num % 100

    if (language === 'en') {
      return num === 1 ? forms.one : forms.many
    }

    if (mod100 >= 11 && mod100 <= 19) return forms.many
    if (mod10 === 1) return forms.one
    if (mod10 >= 2 && mod10 <= 4) return forms.few
    return forms.many
  }

  const formatNumber = (num) => {
    const parsed = parseFloat(num)
    if (isNaN(parsed)) return num
    const formatted = parsed.toFixed(2)
    return separator === ',' ? formatted.replace('.', ',') : formatted
  }

  const formatCompactAmount = (num, keepMinor = true) => {
    const parsed = parseFloat(num)
    if (Number.isNaN(parsed)) return num

    if (!keepMinor) {
      return Math.floor(parsed).toString()
    }

    const fixed = parsed.toFixed(2)
    const [integerPart, minorPart] = fixed.split('.')

    return separator === ','
      ? `${integerPart},${minorPart}`
      : `${integerPart}.${minorPart}`
  }

  const getMinorDigits = (num) => {
    const parsed = parseFloat(num)
    if (Number.isNaN(parsed)) return '00'

    return String(Math.round((Math.abs(parsed) - Math.floor(Math.abs(parsed))) * 100)).padStart(2, '0')
  }

  const buildWordsWithMinor = (num, curr, options = {}) => {
    const { capitalize = false, digitMinor = false, forceMinor = true } = options
    const parsed = parseFloat(num)
    if (Number.isNaN(parsed)) return ''

    const normalized = Math.abs(parsed).toFixed(2)
    const integerValue = Math.floor(Math.abs(parsed))
    const minorDigits = getMinorDigits(parsed)
    const baseWithoutMinor = numberToWords(integerValue, curr, false, 'none', 0, language).text
    const currencyWord = getCurrencyWord(integerValue, curr)
    const textWithoutCurrency = baseWithoutMinor.endsWith(` ${currencyWord}`)
      ? baseWithoutMinor.slice(0, -(` ${currencyWord}`).length)
      : baseWithoutMinor

    let resultText = baseWithoutMinor

    if (forceMinor) {
      if (digitMinor) {
        resultText = `${textWithoutCurrency} ${currencyWord} ${minorDigits} ${pluralizeMinor(Number(minorDigits), curr)}`
      } else {
        const fullText = numberToWords(normalized, curr, true, 'none', 0, language).text
        resultText = Number(minorDigits) === 0
          ? `${baseWithoutMinor} ${language === 'en' ? 'zero' : 'ноль'} ${pluralizeMinor(0, curr)}`
          : fullText
      }
    }

    return capitalize ? capitalizeFirst(resultText) : resultText
  }

  const buildIntegerWordsOnly = (num, curr, capitalize = false) => {
    const parsed = parseFloat(num)
    if (Number.isNaN(parsed)) return ''

    const integerValue = Math.floor(Math.abs(parsed))
    const baseWithoutMinor = numberToWords(integerValue, curr, false, 'none', 0, language).text
    const currencyWord = getCurrencyWord(integerValue, curr)
    const wordsOnly = baseWithoutMinor.endsWith(` ${currencyWord}`)
      ? baseWithoutMinor.slice(0, -(` ${currencyWord}`).length)
      : baseWithoutMinor

    return capitalize ? capitalizeFirst(wordsOnly) : wordsOnly
  }

  const getIntegerPart = (num) => {
    return Math.floor(parseFloat(num))
  }

  const getMinorPart = (num) => {
    const parsed = parseFloat(num)
    const minor = Math.round((parsed - Math.floor(parsed)) * 100)
    return minor < 10 ? `0${minor}` : minor.toString()
  }

  const generateVariants = () => {
    if (!result || !result.text) return []

    // Определяем, какое число использовать для форматирования
    // Для НДФЛ используем исходную сумму, для НДС - итоговую
    let displayNumber = number
    if (result.details) {
      if (taxMode === 'addVAT') {
        // Добавить НДС: показываем итоговую сумму с НДС
        displayNumber = result.details.final
      } else if (taxMode === 'removeVAT') {
        // Убрать НДС: показываем сумму без НДС
        displayNumber = result.details.original
      } else if (taxMode === 'NDFL') {
        // НДФЛ: показываем исходную сумму
        displayNumber = result.details.original
      }
    }

    const num = parseFloat(displayNumber)
    const integerDigits = formatCompactAmount(displayNumber, false)
    const amountCompact = formatCompactAmount(displayNumber, true)
    const minorPartStr = getMinorDigits(displayNumber)
    const currencyWord = getCurrencyWord(num, currency)
    const currencyShort = getCurrencyShort(currency)
    const fullLower = buildWordsWithMinor(displayNumber, currency, { forceMinor: withMinor, digitMinor: false })
    const fullCapital = buildWordsWithMinor(displayNumber, currency, { forceMinor: withMinor, digitMinor: false, capitalize: true })
    const fullDigitMinorLower = buildWordsWithMinor(displayNumber, currency, { forceMinor: withMinor, digitMinor: true })
    const fullDigitMinorCapital = buildWordsWithMinor(displayNumber, currency, { forceMinor: withMinor, digitMinor: true, capitalize: true })
    const integerOnlyLower = buildIntegerWordsOnly(displayNumber, currency, false)
    const integerOnlyCapital = buildIntegerWordsOnly(displayNumber, currency, true)

    const taxAmount = result.details ? parseFloat(result.details.tax) : 0
    const effectiveTaxRate = result.details ? taxRate : 0
    const taxLabel = taxMode === 'NDFL' ? templateCopy.incomeTaxLabel : templateCopy.vatLabel
    const taxCompact = formatCompactAmount(taxAmount, true)
    const taxIntegerDigits = formatCompactAmount(taxAmount, false)
    const taxMinorDigits = getMinorDigits(taxAmount)
    const taxAmountShort = Number(taxMinorDigits) === 0 ? taxIntegerDigits : taxCompact
    const taxCurrencyWord = getCurrencyWord(taxAmount, currency)
    const taxWordsLower = buildWordsWithMinor(taxAmount, currency, { forceMinor: true, digitMinor: false })
    const taxWordsCapital = buildWordsWithMinor(taxAmount, currency, { forceMinor: true, digitMinor: false, capitalize: true })
    const taxWordsDigitMinorCapital = buildWordsWithMinor(taxAmount, currency, { forceMinor: true, digitMinor: true, capitalize: true })
    const taxIntegerWordsLower = buildIntegerWordsOnly(taxAmount, currency, false)

    return [
      {
        id: 'format-1',
        label: t('numberToWords.variants.format1.label'),
        description: t('numberToWords.variants.format1.description'),
        text: fullLower,
      },
      {
        id: 'format-2',
        label: t('numberToWords.variants.format2.label'),
        description: t('numberToWords.variants.format2.description'),
        text: fullCapital,
      },
      {
        id: 'format-3',
        label: t('numberToWords.variants.format3.label'),
        description: t('numberToWords.variants.format3.description'),
        text: fullDigitMinorLower,
      },
      {
        id: 'format-4',
        label: t('numberToWords.variants.format4.label'),
        description: t('numberToWords.variants.format4.description'),
        text: taxMode === 'none'
          ? `${fullLower}, ${templateCopy.notApplicable}`
          : `${fullLower}, ${templateCopy.inclShort} ${taxLabel} ${effectiveTaxRate}%`,
      },
      {
        id: 'format-5',
        label: t('numberToWords.variants.format5.label'),
        description: t('numberToWords.variants.format5.description'),
        text: `${fullLower}, ${templateCopy.inclShort} ${taxLabel} (${effectiveTaxRate}%) ${taxAmountShort} ${currencyShort} (${taxWordsLower})`,
      },
      {
        id: 'format-6',
        label: t('numberToWords.variants.format6.label'),
        description: t('numberToWords.variants.format6.description'),
        text: `${amountCompact} ${currencyShort} (${fullLower}), ${templateCopy.inclShort} ${taxLabel} (${effectiveTaxRate}%) ${taxAmountShort} ${currencyShort} (${taxWordsLower})`,
      },
      {
        id: 'format-7',
        label: t('numberToWords.variants.format7.label'),
        description: t('numberToWords.variants.format7.description'),
        text: `${amountCompact} ${currencyShort} (${fullCapital}), ${templateCopy.inclShort} ${taxLabel} ${effectiveTaxRate}% ${taxAmountShort} ${currencyShort} (${taxWordsCapital})`,
      },
      {
        id: 'format-8',
        label: t('numberToWords.variants.format8.label'),
        description: t('numberToWords.variants.format8.description'),
        text: `${integerDigits} (${integerOnlyLower}) ${currencyWord} ${minorPartStr} ${pluralizeMinor(Number(minorPartStr), currency)}, ${templateCopy.longTax} ${taxLabel} - ${taxIntegerDigits} (${taxIntegerWordsLower}) ${taxCurrencyWord} ${taxMinorDigits} ${pluralizeMinor(Number(taxMinorDigits), currency)}`,
      },
      {
        id: 'format-9',
        label: t('numberToWords.variants.format9.label'),
        description: t('numberToWords.variants.format9.description'),
        text: `${integerDigits} (${integerOnlyCapital}) ${currencyWord} ${minorPartStr} ${pluralizeMinor(Number(minorPartStr), currency)}`,
      },
      {
        id: 'format-10',
        label: t('numberToWords.variants.format10.label'),
        description: t('numberToWords.variants.format10.description'),
        text: `${amountCompact} ${currencyShort} (${fullDigitMinorCapital}), ${templateCopy.inclShort} ${taxLabel} ${effectiveTaxRate}% ${taxAmountShort} ${currencyShort} (${taxWordsDigitMinorCapital})`,
      },
      {
        id: 'format-11',
        label: t('numberToWords.variants.format11.label'),
        description: t('numberToWords.variants.format11.description'),
        text: `${amountCompact} ${currencyShort} (${integerOnlyLower}) ${currencyWord} ${minorPartStr} ${pluralizeMinor(Number(minorPartStr), currency)}, ${templateCopy.including} ${taxLabel} (${effectiveTaxRate}%) ${templateCopy.amountIn} ${taxIntegerDigits} ${currencyShort} (${taxIntegerWordsLower}) ${taxCurrencyWord} ${taxMinorDigits} ${pluralizeMinor(Number(taxMinorDigits), currency)}`,
      },
    ]
  }

  const variants = useMemo(() => {
    return result ? generateVariants() : []
  }, [result, number, currency, taxMode, taxRate, separator, withMinor, language])

  const orderedVariants = useMemo(() => {
    if (!variants.length) return []

    const activePin = variants.some((variant) => variant.id === pinnedVariantId)
      ? pinnedVariantId
      : variants[0].id

    return [...variants].sort((a, b) => {
      if (a.id === activePin) return -1
      if (b.id === activePin) return 1
      return 0
    })
  }, [variants, pinnedVariantId])

  const primaryVariant = orderedVariants[0] || null
  const secondaryVariants = orderedVariants.slice(1)

  const faqItems = [
    { q: t('numberToWords.info.faqList.q1'), a: t('numberToWords.info.faqList.a1') },
    { q: t('numberToWords.info.faqList.q2'), a: t('numberToWords.info.faqList.a2') },
    { q: t('numberToWords.info.faqList.q3'), a: t('numberToWords.info.faqList.a3') }
  ]

  return (
    <>
      <SEO
        title={t('seo.numberToWords.title')}
        description={t('seo.numberToWords.description')}
        path={`/${language}/number-to-words`}
        keywords={t('seo.numberToWords.keywords')}
      />

      <ToolPageShell>
        <ToolPageHero title={t('numberToWords.title')} subtitle={t('numberToWords.subtitle')} />

        <ToolControls>
        <div className="field">
          <label htmlFor="number">{t('numberToWords.enterAmount')}</label>
          <div className="number-to-words-input-row">
            <input
              ref={inputRef}
              id="number"
              type="text"
              value={number}
              onChange={(e) => setNumber(filterNumberInput(e.target.value))}
              onKeyDown={handleNumberKeyDown}
              placeholder={separator === ',' ? '1234,56' : '1234.56'}
              style={{ flex: 1, minWidth: 0 }}
              autoComplete="off"
            />
            <button
              onClick={handleClear}
              className="secondary"
              style={{ flexShrink: 0, width: 'auto', padding: '0 1rem' }}
            >
              {t('numberToWords.reset')}
            </button>
          </div>
        </div>

        <div className="number-to-words-options-grid">
          <div className="field">
            <label htmlFor="taxMode">{t('numberToWords.tax')}</label>
            <select
              id="taxMode"
              value={taxMode === 'none' ? 'none' : `${taxMode}-${taxRate}`}
              onChange={(e) => {
                const value = e.target.value
                if (value === 'none') {
                  setTaxMode('none')
                } else {
                  const [mode, rate] = value.split('-')
                  setTaxMode(mode)
                  setTaxRate(Number(rate))
                }
              }}
            >
              <option value="none">{t('numberToWords.noVAT')}</option>
              <option value="addVAT-5">5% {t('numberToWords.vat')}</option>
              <option value="addVAT-7">7% {t('numberToWords.vat')}</option>
              <option value="addVAT-10">10% {t('numberToWords.vat')}</option>
              <option value="addVAT-12">12% {t('numberToWords.vat')}</option>
              <option value="addVAT-15">15% {t('numberToWords.vat')}</option>
              <option value="addVAT-16">16% {t('numberToWords.vat')}</option>
              <option value="addVAT-17">17% {t('numberToWords.vat')}</option>
              <option value="addVAT-18">18% {t('numberToWords.vat')}</option>
              <option value="addVAT-20">20% {t('numberToWords.vat')}</option>
              <option value="addVAT-22">22% {t('numberToWords.vat')}</option>
              <option value="NDFL-13">13% {t('numberToWords.incomeTax')}</option>
              <option value="NDFL-15">15% {t('numberToWords.incomeTax')}</option>
              <option value="NDFL-18">18% {t('numberToWords.incomeTax')}</option>
              <option value="NDFL-22">22% {t('numberToWords.incomeTax')}</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="currency">{t('numberToWords.currency')}</label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="RUB">₽ {t('numberToWords.ruble')}</option>
              <option value="KZT">₸ {t('numberToWords.tenge')}</option>
              <option value="USD">$ {t('numberToWords.dollar')}</option>
              <option value="EUR">€ {t('numberToWords.euro')}</option>
              <option value="CNY">¥ {t('numberToWords.yuan')}</option>
              <option value="UAH">₴ {t('numberToWords.hryvnia')}</option>
              <option value="BYN">Br {t('numberToWords.belRuble')}</option>
              <option value="UZS">so'm {t('numberToWords.sum')}</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="separator">{t('numberToWords.separator')}</label>
            <select
              id="separator"
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
            >
              <option value=".">{t('numberToWords.dot')}</option>
              <option value=",">{t('numberToWords.comma')}</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={withMinor}
              onChange={(e) => setWithMinor(e.target.checked)}
            />
            {t('numberToWords.withMinor')}
          </label>
        </div>

        {variants.length > 0 && (
          <div className="number-to-words-result-stack">
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.25rem' }}>{t('numberToWords.conversionResult')}</h2>

            {result.details && (
              <ResultNotice className="number-to-words-tax-summary">
                <div style={{ fontSize: '0.95rem', lineHeight: '1.8' }}>
                  <p><strong>{t('numberToWords.originalAmount')}</strong> {result.details.original}</p>
                  <p><strong>{result.details.label}:</strong> {result.details.tax}</p>
                  <p><strong>{t('numberToWords.total')}</strong> {result.details.final}</p>
                </div>
              </ResultNotice>
            )}

            {primaryVariant && (
              <ResultSection tone="success" className="number-to-words-primary-card">
                <div className="number-to-words-card-header">
                  <div className="number-to-words-card-title">
                    <div className="number-to-words-pin-badge">
                      <Icon name="push_pin" size={14} />
                      <span>{t('numberToWords.pinnedVariant')}</span>
                    </div>
                    <ResultSummary title={primaryVariant.label} description={primaryVariant.description} />
                  </div>
                </div>
                <div className="number-to-words-result-block">
                  <p className="number-to-words-result-text">{primaryVariant.text}</p>
                  <div className="number-to-words-result-actions">
                    <CopyButton text={primaryVariant.text} className="number-to-words-copy number-to-words-main-copy" />
                  </div>
                </div>
              </ResultSection>
            )}

            {secondaryVariants.length > 0 && (
              <div className="number-to-words-variants-grid">
                {secondaryVariants.map((variant) => (
                  <ResultSection key={variant.id} className="number-to-words-variant-card">
                    <div className="number-to-words-card-header">
                      <div className="number-to-words-card-title">
                        <ResultSummary title={variant.label} description={variant.description} />
                      </div>
                    </div>
                    <div className="number-to-words-result-block">
                      <p className="number-to-words-result-text">{variant.text}</p>
                      <div className="number-to-words-result-actions">
                        <button
                          type="button"
                          className={`secondary number-to-words-pin ${pinnedVariantId === variant.id ? 'is-active' : ''}`}
                          onClick={() => setPinnedVariantId(variant.id)}
                          title={t('numberToWords.pinVariant')}
                          aria-label={t('numberToWords.pinVariant')}
                        >
                          <Icon name="push_pin" size={14} />
                          <span>{language === 'ru' ? 'Закрепить' : 'Pin'}</span>
                        </button>
                        <CopyButton text={variant.text} className="number-to-words-copy" />
                      </div>
                    </div>
                  </ResultSection>
                ))}
              </div>
            )}
          </div>
        )}
        </ToolControls>

        <ToolHelp>
        <ToolDescriptionSection>
          <div className="tool-help-prose">
          <h2 className="tool-help-heading">{t('numberToWords.info.title')}</h2>
          <p>
            {t('numberToWords.info.description')}
          </p>

          <h3 className="tool-help-subheading">{t('numberToWords.info.currencySupport')}</h3>
          <p>
            {t('numberToWords.info.currencySupportDesc')}
          </p>

          <h3 className="tool-help-subheading">{t('numberToWords.info.taxSupport')}</h3>
          <p>
            {t('numberToWords.info.taxSupportDesc')}
          </p>

          <h3 className="tool-help-subheading">{t('numberToWords.info.features')}</h3>
          <ul>
            <li>{t('numberToWords.info.featuresList.instant')}</li>
            <li>{t('numberToWords.info.featuresList.separator')}</li>
            <li>{t('numberToWords.info.featuresList.formats')}</li>
            <li>{t('numberToWords.info.featuresList.large')}</li>
            <li>{t('numberToWords.info.featuresList.browser')}</li>
          </ul>

          <h3 className="tool-help-subheading">{t('numberToWords.info.popularExamples')}</h3>
          <ul>
            <li>{t('numberToWords.info.popularExamplesList.million')}</li>
            <li>{t('numberToWords.info.popularExamplesList.decimal')}</li>
            <li>{t('numberToWords.info.popularExamplesList.vat')}</li>
            <li>{t('numberToWords.info.popularExamplesList.contract')}</li>
          </ul>

          <h3 className="tool-help-subheading">{t('numberToWords.info.howToUse')}</h3>
          <ol>
            <li>{t('numberToWords.info.howToUseSteps.step1')}</li>
            <li>{t('numberToWords.info.howToUseSteps.step2')}</li>
            <li>{t('numberToWords.info.howToUseSteps.step3')}</li>
            <li>{t('numberToWords.info.howToUseSteps.step4')}</li>
          </ol>

          <h3 className="tool-help-subheading">{t('numberToWords.info.useCases')}</h3>
          <ul>
            <li>{t('numberToWords.info.useCasesList.contracts')}</li>
            <li>{t('numberToWords.info.useCasesList.invoices')}</li>
            <li>{t('numberToWords.info.useCasesList.payments')}</li>
          </ul>

          <ToolFaq title={t('numberToWords.info.faq')} items={faqItems} />
          </div>
        </ToolDescriptionSection>

        </ToolHelp>

        <ToolRelated>
          <RelatedTools currentPath={`/${language}/number-to-words`} />
        </ToolRelated>
      </ToolPageShell>
    </>
  )
}

export default NumberToWords
