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

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Как пользоваться калькулятором НДС</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            Онлайн калькулятор НДС позволяет быстро рассчитать налог на добавленную стоимость.
            Выберите операцию, введите сумму и получите точный расчет с детализацией.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Возможности калькулятора:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Добавить НДС к сумме - расчет итоговой стоимости с налогом</li>
            <li>Убрать НДС из суммы - выделение налога из общей стоимости</li>
            <li>Рассчитать НДС - вычисление размера налога от суммы</li>
            <li>Поддержка ставок: 5%, 10%, 18%, 19%, 20%</li>
            <li>Автоматический расчет при изменении параметров</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Популярные запросы:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Калькулятор НДС 20 процентов онлайн</li>
            <li>Как выделить НДС из суммы</li>
            <li>Расчет НДС 18 процентов</li>
            <li>Калькулятор НДС с суммы</li>
            <li>Убрать НДС из стоимости</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Примеры использования:</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            <strong>Добавить НДС:</strong> Если товар стоит 10000 рублей без НДС, калькулятор покажет,
            что с НДС 20% итоговая цена составит 12000 рублей (НДС = 2000 рублей).
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>Убрать НДС:</strong> Если счет на 12000 рублей включает НДС 20%, калькулятор выделит
            сумму без налога 10000 рублей и размер НДС 2000 рублей.
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>Рассчитать НДС:</strong> Введите сумму 10000 рублей и ставку 20%, чтобы узнать,
            что размер налога составит 2000 рублей.
          </p>
        </div>

        <RelatedTools currentPath={`/${language}/vat-calculator`} />
      </div>
    </>
  )
}

export default VATCalculator
