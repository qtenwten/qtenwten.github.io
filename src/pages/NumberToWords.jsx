import { useState, useEffect, useRef, useCallback } from 'react'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import { numberToWords } from '../utils/numberToWords'

function NumberToWords() {
  const [number, setNumber] = useState('')
  const [currency, setCurrency] = useState('RUB')
  const [withMinor, setWithMinor] = useState(true)
  const [taxMode, setTaxMode] = useState('none')
  const [taxRate, setTaxRate] = useState(20)
  const [separator, setSeparator] = useState('.')
  const [result, setResult] = useState(null)
  const debounceTimer = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('numberToWords')
    if (saved) {
      const data = JSON.parse(saved)
      setNumber(data.number || '')
      setCurrency(data.currency || 'RUB')
      setWithMinor(data.withMinor !== false)
      setTaxMode(data.taxMode || 'none')
      setTaxRate(data.taxRate || 20)
      setSeparator(data.separator || '.')
    }
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
        const res = numberToWords(normalizedNum, curr, minor, tax, rate)
        setResult(res)
        localStorage.setItem('numberToWords', JSON.stringify({
          number: num,
          currency: curr,
          withMinor: minor,
          taxMode: tax,
          taxRate: rate,
          separator: separator
        }))
      } else {
        setResult(null)
      }
    }, 300)
  }, [])

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
    localStorage.removeItem('numberToWords')
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

  const getCurrencyName = (curr) => {
    const names = {
      RUB: 'рублей',
      USD: 'долларов',
      EUR: 'евро',
      KZT: 'тенге',
      CNY: 'юаней',
      UAH: 'гривен',
      BYN: 'белорусских рублей',
      UZS: 'сумов'
    }
    return names[curr] || curr
  }

  const getMinorName = (curr) => {
    const names = {
      RUB: 'копеек',
      USD: 'центов',
      EUR: 'центов',
      KZT: 'тиынов',
      CNY: 'фэней',
      UAH: 'копеек',
      BYN: 'копеек',
      UZS: 'тийинов'
    }
    return names[curr] || 'копеек'
  }

  const formatNumber = (num) => {
    const parsed = parseFloat(num)
    if (isNaN(parsed)) return num
    const formatted = parsed.toFixed(2)
    return separator === ',' ? formatted.replace('.', ',') : formatted
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

    const num = parseFloat(number)
    const intPart = getIntegerPart(number)
    const minorPart = getMinorPart(number)
    const formatted = formatNumber(number)
    const symbol = getCurrencySymbol(currency)
    const currName = getCurrencyName(currency)
    const minorName = getMinorName(currency)

    const variants = []

    // Получаем текст без копеек
    const textParts = result.text.split(' ')
    const lastTwoWords = textParts.slice(-2).join(' ')
    const isMinorInText = lastTwoWords.includes('копе') || lastTwoWords.includes('цент') || lastTwoWords.includes('тиын') || lastTwoWords.includes('фэн')
    const withoutMinor = isMinorInText ? textParts.slice(0, -2).join(' ') : result.text

    // 1. Полностью прописью строчными (с копейками прописью)
    variants.push({
      label: 'Строчными буквами (копейки прописью)',
      text: result.text
    })

    // 2. С заглавной буквы (с копейками прописью)
    variants.push({
      label: 'С заглавной буквы (копейки прописью)',
      text: capitalizeFirst(result.text)
    })

    // 3. Прописью с цифровыми копейками
    variants.push({
      label: 'Строчными (копейки цифрами)',
      text: `${withoutMinor} ${minorPart} ${minorName}`
    })

    // 4. С заглавной и цифровыми копейками
    variants.push({
      label: 'С заглавной (копейки цифрами)',
      text: `${capitalizeFirst(withoutMinor)} ${minorPart} ${minorName}`
    })

    // Если есть налог
    if (result.details) {
      const taxText = numberToWords(result.details.tax, currency, true, 'none', 0).text
      const taxCapital = capitalizeFirst(taxText)

      // 5. НДС не облагается
      if (taxMode === 'none') {
        variants.push({
          label: 'НДС не облагается',
          text: `${result.text}, НДС не облагается`
        })
      }

      // 6. С НДС прописью
      variants.push({
        label: 'С НДС прописью',
        text: `${result.text}, в т.ч. НДС (${taxRate}%) ${taxText}`
      })

      // 7. Цифры + прописью в скобках
      variants.push({
        label: 'Цифры + прописью',
        text: `${formatted} ${symbol} (${result.text}), в т.ч. НДС (${taxRate}%) ${result.details.tax} ${symbol} (${taxText})`
      })

      // 8. С заглавной в скобках
      variants.push({
        label: 'С заглавной в скобках',
        text: `${formatted} ${symbol} (${capitalizeFirst(result.text)}), в т.ч. НДС ${taxRate}% ${result.details.tax} ${symbol} (${taxCapital})`
      })

      // 9. Цифры в скобках
      variants.push({
        label: 'Цифры в скобках прописью',
        text: `${intPart} (${withoutMinor}) ${currName} ${minorPart} ${minorName}, в том числе НДС - ${result.details.tax} (${taxText})`
      })

      // 10. С заглавной цифры в скобках
      variants.push({
        label: 'С заглавной, цифры в скобках',
        text: `${intPart} (${capitalizeFirst(withoutMinor)}) ${currName} ${minorPart} ${minorName}`
      })

      // 11. Полный формат с цифровыми копейками
      const taxTextParts = taxText.split(' ')
      const taxWithoutMinor = taxTextParts.slice(0, -2).join(' ')
      variants.push({
        label: 'Полный формат',
        text: `${formatted} ${symbol} (${capitalizeFirst(withoutMinor)} ${minorPart} ${minorName}), в т.ч. НДС ${taxRate}% ${result.details.tax} ${symbol} (${capitalizeFirst(taxWithoutMinor)} ${getMinorPart(result.details.tax)} ${minorName})`
      })

      // 12. Включая НДС
      variants.push({
        label: 'Включая НДС',
        text: `${formatted} ${symbol} (${withoutMinor}) ${currName} ${minorPart} ${minorName}, включая НДС (${taxRate}%) в сумме ${result.details.tax} ${symbol} (${taxText})`
      })
    } else {
      // Без налога - дополнительные варианты
      variants.push({
        label: 'Цифры + прописью в скобках',
        text: `${formatted} ${symbol} (${result.text})`
      })

      variants.push({
        label: 'С заглавной в скобках',
        text: `${formatted} ${symbol} (${capitalizeFirst(result.text)})`
      })

      variants.push({
        label: 'Цифры в скобках',
        text: `${intPart} (${withoutMinor}) ${currName} ${minorPart} ${minorName}`
      })

      variants.push({
        label: 'С заглавной, цифры в скобках',
        text: `${intPart} (${capitalizeFirst(withoutMinor)}) ${currName} ${minorPart} ${minorName}`
      })
    }

    return variants
  }

  const variants = result ? generateVariants() : []

  return (
    <>
      <SEO
        title="Число прописью онлайн - Конвертер чисел в текст"
        description="Бесплатный онлайн конвертер числа прописью. Перевод суммы в текст для рублей, долларов, евро с НДС и НДФЛ. Быстро и удобно."
        path="/number-to-words"
      />

      <div className="tool-container">
        <h1>Число прописью онлайн</h1>
        <p>Конвертер числа в текст с поддержкой налогов и разных валют</p>

        <div className="field">
          <label htmlFor="number">Введите сумму:</label>
          <input
            ref={inputRef}
            id="number"
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder={separator === ',' ? '1234,56' : '1234.56'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="field">
            <label htmlFor="taxMode">Налог:</label>
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
              <option value="none">Без НДС</option>
              <option value="addVAT-5">5% НДС</option>
              <option value="addVAT-7">7% НДС</option>
              <option value="addVAT-10">10% НДС</option>
              <option value="addVAT-12">12% НДС</option>
              <option value="addVAT-15">15% НДС</option>
              <option value="addVAT-16">16% НДС</option>
              <option value="addVAT-17">17% НДС</option>
              <option value="addVAT-18">18% НДС</option>
              <option value="addVAT-20">20% НДС</option>
              <option value="addVAT-22">22% НДС</option>
              <option value="NDFL-13">13% НДФЛ</option>
              <option value="NDFL-15">15% НДФЛ</option>
              <option value="NDFL-18">18% НДФЛ</option>
              <option value="NDFL-22">22% НДФЛ</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="currency">Валюта:</label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="RUB">₽ рубль</option>
              <option value="KZT">₸ тенге</option>
              <option value="USD">$ доллар</option>
              <option value="EUR">€ евро</option>
              <option value="CNY">¥ юань</option>
              <option value="UAH">₴ гривня</option>
              <option value="BYN">Br бел.руб.</option>
              <option value="UZS">so'm узб.сум</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="separator">Разделитель:</label>
            <select
              id="separator"
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
            >
              <option value=".">точка (.)</option>
              <option value=",">запятая (,)</option>
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
            С копейками/центами
          </label>
        </div>

        {variants.length > 0 && (
          <>
            <h2 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.25rem' }}>Результат перевода:</h2>

            {result.details && (
              <div className="result-box" style={{ background: 'var(--bg-secondary)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.95rem', lineHeight: '1.8' }}>
                  <p><strong>Исходная сумма:</strong> {result.details.original}</p>
                  <p><strong>{result.details.label}:</strong> {result.details.tax}</p>
                  <p><strong>Итого:</strong> {result.details.final}</p>
                </div>
              </div>
            )}

            {variants.map((variant, index) => (
              <div key={index} className="result-box success" style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {variant.label}:
                </div>
                <div className="result-value" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
                  {variant.text}
                </div>
                <CopyButton text={variant.text} />
              </div>
            ))}
          </>
        )}

        <div className="btn-group" style={{ marginTop: '1.5rem' }}>
          <button onClick={handleClear} className="secondary">
            Очистить
          </button>
        </div>

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Как пользоваться конвертером числа прописью</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            Наш онлайн калькулятор позволяет быстро перевести любое число в текст прописью.
            Это особенно полезно при заполнении документов, договоров, счетов и других официальных бумаг.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Возможности сервиса:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Перевод чисел прописью для рублей, долларов, евро, тенге, юаней, гривен</li>
            <li>Автоматический расчет НДС (5%, 7%, 10%, 12%, 15%, 16%, 17%, 18%, 20%, 22%)</li>
            <li>Расчет НДФЛ (13%, 15%, 18%, 22%)</li>
            <li>Выбор разделителя (точка или запятая)</li>
            <li>Множество вариантов форматирования результата</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Популярные запросы:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>1000000 прописью - один миллион рублей</li>
            <li>377.60 прописью - триста семьдесят семь рублей шестьдесят копеек</li>
            <li>Сумма прописью с НДС - автоматический расчет налога</li>
            <li>Число прописью для договора - все форматы в одном месте</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Примеры использования:</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            <strong>Для договоров:</strong> Введите сумму договора, выберите валюту и налог.
            Получите текст прописью в нужном формате для вставки в документ.
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>Для счетов:</strong> Укажите сумму счета с НДС, выберите ставку налога.
            Сервис автоматически рассчитает и выведет сумму прописью с указанием НДС.
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>Для платежных документов:</strong> Конвертируйте сумму платежа в текст
            с копейками прописью или цифрами - на ваш выбор.
          </p>
        </div>

        <RelatedTools currentPath="/number-to-words" />
      </div>
    </>
  )
}

export default NumberToWords
