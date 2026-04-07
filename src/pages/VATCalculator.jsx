import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import { addVAT, removeVAT, calculateVAT } from '../utils/vatCalculator'
import { filterNumberInput, handleNumberKeyDown } from '../utils/numberInput'

function VATCalculator() {
  const { t, language } = useLanguage()
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState(20)
  const [mode, setMode] = useState('add')
  const [result, setResult] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('vatCalculator')
    if (saved) {
      const data = JSON.parse(saved)
      setAmount(data.amount || '')
      setRate(data.rate || 20)
      setMode(data.mode || 'add')
    }
  }, [])

  useEffect(() => {
    if (amount) {
      let res = null
      if (mode === 'add') {
        res = addVAT(amount, rate)
      } else if (mode === 'remove') {
        res = removeVAT(amount, rate)
      } else if (mode === 'calculate') {
        res = calculateVAT(amount, rate)
      }
      setResult(res)
      localStorage.setItem('vatCalculator', JSON.stringify({ amount, rate, mode }))
    } else {
      setResult(null)
    }
  }, [amount, rate, mode])

  const handleClear = () => {
    setAmount('')
    setResult(null)
    localStorage.removeItem('vatCalculator')
  }

  return (
    <>
      <SEO
        title={t('seo.vatCalculator.title')}
        description={t('seo.vatCalculator.description')}
        path={`/${language}/vat-calculator`}
        keywords={t('seo.vatCalculator.keywords')}
      />

      <div className="tool-container">
        <h1>{t('vatCalculator.title')}</h1>
        <p>{t('vatCalculator.subtitle')}</p>

        <div className="field">
          <label htmlFor="mode">{t('vatCalculator.operation')}</label>
          <select
            id="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="add">{t('vatCalculator.operations.add')}</option>
            <option value="remove">{t('vatCalculator.operations.remove')}</option>
            <option value="calculate">{t('vatCalculator.operations.calculate')}</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="amount">{t('vatCalculator.amount')}</label>
          <input
            id="amount"
            type="text"
            value={amount}
            onChange={(e) => setAmount(filterNumberInput(e.target.value))}
            onKeyDown={handleNumberKeyDown}
            placeholder="10000"
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="rate">{t('vatCalculator.rate')}</label>
          <select
            id="rate"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          >
            <option value="20">20%</option>
            <option value="19">19%</option>
            <option value="18">18%</option>
            <option value="10">10%</option>
            <option value="5">5%</option>
          </select>
        </div>

        {result && (
          <div className="result-box success">
            {mode === 'add' && (
              <>
                <p><strong>{t('vatCalculator.result.withoutVAT')}:</strong> {result.original} ₽</p>
                <p><strong>{t('vatCalculator.result.vat')} ({rate}%):</strong> {result.vat} ₽</p>
                <p><strong>{t('vatCalculator.result.total')}:</strong> {result.total} ₽</p>
                <CopyButton text={`${t('vatCalculator.result.withoutVAT')}: ${result.original} ₽\n${t('vatCalculator.result.vat')}: ${result.vat} ₽\n${t('vatCalculator.result.totalWithVAT')}: ${result.total} ₽`} />
              </>
            )}
            {mode === 'remove' && (
              <>
                <p><strong>{t('vatCalculator.result.withVAT')}:</strong> {result.total} ₽</p>
                <p><strong>{t('vatCalculator.result.vat')} ({rate}%):</strong> {result.vat} ₽</p>
                <p><strong>{t('vatCalculator.result.withoutVAT')}:</strong> {result.original} ₽</p>
                <CopyButton text={`${t('vatCalculator.result.withVAT')}: ${result.total} ₽\n${t('vatCalculator.result.vat')}: ${result.vat} ₽\n${t('vatCalculator.result.withoutVAT')}: ${result.original} ₽`} />
              </>
            )}
            {mode === 'calculate' && (
              <>
                <p><strong>{t('vatCalculator.result.amountLabel')}:</strong> {result.amount} ₽</p>
                <p><strong>{t('vatCalculator.result.vat')} ({rate}%):</strong> {result.vat} ₽</p>
                <CopyButton text={`${t('vatCalculator.result.amountLabel')}: ${result.amount} ₽\n${t('vatCalculator.result.vat')}: ${result.vat} ₽`} />
              </>
            )}
          </div>
        )}

        <div className="btn-group">
          <button onClick={handleClear} className="secondary">
            {t('common.clear')}
          </button>
        </div>

        <RelatedTools currentPath={`/${language}/vat-calculator`} />
      </div>
    </>
  )
}

export default VATCalculator
