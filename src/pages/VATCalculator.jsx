import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import { addVAT, removeVAT, calculateVAT } from '../utils/vatCalculator'
import { filterNumberInput, handleNumberKeyDown } from '../utils/numberInput'
import { safeSetItem, safeRemoveItem } from '../utils/storage'

function VATCalculator() {
  const { t, language } = useLanguage()
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState(22)
  const [mode, setMode] = useState('add')
  const [result, setResult] = useState(null)

  useEffect(() => {
    // Очищаем localStorage при загрузке страницы
    safeRemoveItem('vatCalculator')
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
      safeSetItem('vatCalculator', JSON.stringify({ amount, rate, mode }))
    } else {
      setResult(null)
    }
  }, [amount, rate, mode])

  const handleClear = () => {
    setAmount('')
    setResult(null)
    safeRemoveItem('vatCalculator')
  }

  const faqItems = t('vatCalculator.info.faqTitle')
    ? [
        { q: t('vatCalculator.info.faqList.q1'), a: t('vatCalculator.info.faqList.a1') },
        { q: t('vatCalculator.info.faqList.q2'), a: t('vatCalculator.info.faqList.a2') },
        { q: t('vatCalculator.info.faqList.q3'), a: t('vatCalculator.info.faqList.a3') },
        { q: t('vatCalculator.info.faqList.q4'), a: t('vatCalculator.info.faqList.a4') },
      ]
    : []

  return (
    <>
      <SEO
        title={t('seo.vatCalculator.title')}
        description={t('seo.vatCalculator.description')}
        path={`/${language}/vat-calculator`}
        keywords={t('seo.vatCalculator.keywords')}
      />

      <div className="tool-container">
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {t('vatCalculator.title')}
          <img
            src="/bull-icon.png"
            alt=""
            style={{
              marginLeft: '0.5rem',
              width: '2rem',
              height: '2rem'
            }}
          />
        </h1>
        <p style={{ textAlign: 'center' }}>{t('vatCalculator.subtitle')}</p>

        <div className="field">
          <label htmlFor="amount">{t('vatCalculator.amount')}</label>
          <input
            id="amount"
            type="text"
            value={amount}
            onChange={(e) => setAmount(filterNumberInput(e.target.value))}
            onKeyDown={handleNumberKeyDown}
            placeholder="10000"
            autoComplete="off"
          />
        </div>

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
          <label htmlFor="rate">{t('vatCalculator.rate')}</label>
          <select
            id="rate"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          >
            <option value="22">22%</option>
            <option value="20">20%</option>
            <option value="19">19%</option>
            <option value="18">18%</option>
            <option value="10">10%</option>
            <option value="5">5%</option>
          </select>
        </div>

        {result && (
          <div className="result-box success" style={{ padding: '1rem' }}>
            {mode === 'add' && (
              <>
                <p style={{ margin: '0.25rem 0' }}><strong>{t('vatCalculator.result.withoutVAT')}:</strong> {result.original} ₽</p>
                <p style={{ margin: '0.25rem 0' }}><strong>{t('vatCalculator.result.vat')} ({rate}%):</strong> {result.vat} ₽</p>
                <p style={{ margin: '0.25rem 0' }}><strong>{t('vatCalculator.result.total')}:</strong> {result.total} ₽</p>
                <CopyButton text={`${t('vatCalculator.result.withoutVAT')}: ${result.original} ₽\n${t('vatCalculator.result.vat')}: ${result.vat} ₽\n${t('vatCalculator.result.totalWithVAT')}: ${result.total} ₽`} />
              </>
            )}
            {mode === 'remove' && (
              <>
                <p style={{ margin: '0.25rem 0' }}><strong>{t('vatCalculator.result.withVAT')}:</strong> {result.total} ₽</p>
                <p style={{ margin: '0.25rem 0' }}><strong>{t('vatCalculator.result.vat')} ({rate}%):</strong> {result.vat} ₽</p>
                <p style={{ margin: '0.25rem 0' }}><strong>{t('vatCalculator.result.withoutVAT')}:</strong> {result.original} ₽</p>
                <CopyButton text={`${t('vatCalculator.result.withVAT')}: ${result.total} ₽\n${t('vatCalculator.result.vat')}: ${result.vat} ₽\n${t('vatCalculator.result.withoutVAT')}: ${result.original} ₽`} />
              </>
            )}
            {mode === 'calculate' && (
              <>
                <p style={{ margin: '0.25rem 0' }}><strong>{t('vatCalculator.result.amountLabel')}:</strong> {result.amount} ₽</p>
                <p style={{ margin: '0.25rem 0' }}><strong>{t('vatCalculator.result.vat')} ({rate}%):</strong> {result.vat} ₽</p>
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

        <ToolDescriptionSection>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--text)' }}>
            {t('vatCalculator.info.title')}
          </h2>
          <div className="tool-description-lead">
            <p style={{ marginBottom: '2rem', color: 'var(--text)', lineHeight: '1.8', fontSize: '1.05rem' }}>
              {t('vatCalculator.info.description')}
            </p>
            <p style={{ marginBottom: '2rem', color: 'var(--text)', lineHeight: '1.8' }}>
              {t('vatCalculator.info.subtitle')}
            </p>
          </div>

          <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text)' }}>
            {t('vatCalculator.info.featuresTitle')}
          </h2>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '2', paddingLeft: '0.5rem' }}>
            <li>{t('vatCalculator.info.featuresList.addVat')}</li>
            <li>{t('vatCalculator.info.featuresList.extractVat')}</li>
            <li>{t('vatCalculator.info.featuresList.calculateVat')}</li>
            <li>{t('vatCalculator.info.featuresList.rates')}</li>
            <li>{t('vatCalculator.info.featuresList.realtime')}</li>
            <li>{t('vatCalculator.info.featuresList.accurate')}</li>
          </ul>

          <h3 style={{ fontSize: '1.3rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text)' }}>
            {t('vatCalculator.info.howToTitle')}
          </h3>
          <ol style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '2', paddingLeft: '0.5rem' }}>
            <li>{t('vatCalculator.info.howToList.step1')}</li>
            <li>{t('vatCalculator.info.howToList.step2')}</li>
            <li>{t('vatCalculator.info.howToList.step3')}</li>
            <li>{t('vatCalculator.info.howToList.step4')}</li>
          </ol>

          <h3 style={{ fontSize: '1.3rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text)' }}>
            {t('vatCalculator.info.examplesTitle')}
          </h3>
          <div className="tool-description-paragraph-stack">
            <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '1rem' }}>
              <strong>{t('vatCalculator.operations.add')}:</strong> {t('vatCalculator.info.addExample')}
            </p>

            <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '1rem' }}>
              <strong>{t('vatCalculator.operations.remove')}:</strong> {t('vatCalculator.info.removeExample')}
            </p>

            <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '1rem' }}>
              <strong>{t('vatCalculator.operations.calculate')}:</strong> {t('vatCalculator.info.calculateExample')}
            </p>
          </div>

          <h3 style={{ fontSize: '1.3rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text)' }}>
            {t('vatCalculator.info.keywordsTitle')}
          </h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: '2', paddingLeft: '0.5rem' }}>
            <li>{t('vatCalculator.info.keywordsList.k1')}</li>
            <li>{t('vatCalculator.info.keywordsList.k2')}</li>
            <li>{t('vatCalculator.info.keywordsList.k3')}</li>
            <li>{t('vatCalculator.info.keywordsList.k4')}</li>
            <li>{t('vatCalculator.info.keywordsList.k5')}</li>
            <li>{t('vatCalculator.info.keywordsList.k6')}</li>
          </ul>

          {t('vatCalculator.info.whereTitle') && (
            <>
              <h3 style={{ fontSize: '1.3rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text)' }}>
                {t('vatCalculator.info.whereTitle')}
              </h3>
              <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '2', paddingLeft: '0.5rem' }}>
                <li>{t('vatCalculator.info.whereList.docs')}</li>
                <li>{t('vatCalculator.info.whereList.sales')}</li>
                <li>{t('vatCalculator.info.whereList.accounting')}</li>
                <li>{t('vatCalculator.info.whereList.contracts')}</li>
              </ul>

              <ToolFaq title={t('vatCalculator.info.faqTitle')} items={faqItems} />
            </>
          )}
        </ToolDescriptionSection>

        <RelatedTools currentPath={`/${language}/vat-calculator`} />
      </div>
    </>
  )
}

export default VATCalculator
