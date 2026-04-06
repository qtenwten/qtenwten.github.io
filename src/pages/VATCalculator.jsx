import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import { addVAT, removeVAT, calculateVAT } from '../utils/vatCalculator'
import { filterNumberInput, handleNumberKeyDown } from '../utils/numberInput'

function VATCalculator() {
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
        title="Калькулятор НДС 20% онлайн - Выделить и начислить НДС"
        description="Калькулятор НДС 20%, 18%, 10%. Выделить НДС из суммы, начислить НДС, рассчитать налог. Быстрый расчет для счетов и накладных."
        path="/vat-calculator"
        keywords="калькулятор НДС, НДС 20 процентов, выделить НДС, начислить НДС, убрать НДС, расчет НДС онлайн"
      />

      <div className="tool-container">
        <h1>Калькулятор НДС онлайн</h1>
        <p>Быстрый расчет налога на добавленную стоимость</p>

        <div className="field">
          <label htmlFor="mode">Операция</label>
          <select
            id="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="add">Добавить НДС</option>
            <option value="remove">Убрать НДС</option>
            <option value="calculate">Рассчитать НДС</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="amount">Сумма</label>
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
          <label htmlFor="rate">Ставка НДС (%)</label>
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
                <p><strong>Сумма без НДС:</strong> {result.original} ₽</p>
                <p><strong>НДС ({rate}%):</strong> {result.vat} ₽</p>
                <p><strong>Итого с НДС:</strong> {result.total} ₽</p>
                <CopyButton text={`Без НДС: ${result.original} ₽\nНДС: ${result.vat} ₽\nИтого: ${result.total} ₽`} />
              </>
            )}
            {mode === 'remove' && (
              <>
                <p><strong>Сумма с НДС:</strong> {result.total} ₽</p>
                <p><strong>НДС ({rate}%):</strong> {result.vat} ₽</p>
                <p><strong>Сумма без НДС:</strong> {result.original} ₽</p>
                <CopyButton text={`С НДС: ${result.total} ₽\nНДС: ${result.vat} ₽\nБез НДС: ${result.original} ₽`} />
              </>
            )}
            {mode === 'calculate' && (
              <>
                <p><strong>Сумма:</strong> {result.amount} ₽</p>
                <p><strong>НДС ({rate}%):</strong> {result.vat} ₽</p>
                <CopyButton text={`Сумма: ${result.amount} ₽\nНДС: ${result.vat} ₽`} />
              </>
            )}
          </div>
        )}

        <div className="btn-group">
          <button onClick={handleClear} className="secondary">
            Очистить
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

        <RelatedTools currentPath="/vat-calculator" />
      </div>
    </>
  )
}

export default VATCalculator
