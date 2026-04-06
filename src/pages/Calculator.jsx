import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import { calculate, calculatePercentage } from '../utils/calculator'

function Calculator() {
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [percentBase, setPercentBase] = useState('')
  const [percentValue, setPercentValue] = useState('')
  const [percentResult, setPercentResult] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('calculator')
    if (saved) {
      const data = JSON.parse(saved)
      setHistory(data.history || [])
    }
  }, [])

  const handleCalculate = () => {
    const res = calculate(expression)
    if (res.error) {
      setError(res.error)
      setResult(null)
    } else {
      setError('')
      setResult(res.result)
      const newHistory = [{ expression, result: res.result }, ...history.slice(0, 9)]
      setHistory(newHistory)
      localStorage.setItem('calculator', JSON.stringify({ history: newHistory }))
    }
  }

  const handlePercentCalculate = () => {
    const res = calculatePercentage(percentBase, percentValue)
    if (res.error) {
      setError(res.error)
      setPercentResult(null)
    } else {
      setError('')
      setPercentResult(res.result)
    }
  }

  const handleClear = () => {
    setExpression('')
    setResult(null)
    setError('')
    setPercentBase('')
    setPercentValue('')
    setPercentResult(null)
  }

  const handleClearHistory = () => {
    setHistory([])
    localStorage.removeItem('calculator')
  }

  return (
    <>
      <SEO
        title="Онлайн калькулятор - Калькулятор с процентами и историей"
        description="Бесплатный онлайн калькулятор с поддержкой базовых операций, процентов и истории вычислений. Простой и удобный интерфейс."
        path="/calculator"
      />

      <div className="tool-container">
        <h1>🧮 Калькулятор</h1>
        <p>Базовые операции и проценты</p>

        <div className="field">
          <label htmlFor="expression">Выражение</label>
          <input
            id="expression"
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCalculate()}
            placeholder="100 + 20 * 3"
            autoFocus
          />
          <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            Поддерживаются: +, -, *, /, %, ()
          </small>
        </div>

        {error && <div className="error">{error}</div>}

        {result !== null && (
          <div className="result-box success">
            <div className="result-value">{result}</div>
            <CopyButton text={result.toString()} />
          </div>
        )}

        <div className="btn-group">
          <button onClick={handleCalculate}>
            Вычислить
          </button>
          <button onClick={handleClear} className="secondary">
            Очистить
          </button>
        </div>

        <h2 style={{ marginTop: '2rem' }}>Проценты</h2>

        <div className="field">
          <label htmlFor="percentBase">Число</label>
          <input
            id="percentBase"
            type="number"
            value={percentBase}
            onChange={(e) => setPercentBase(e.target.value)}
            placeholder="1000"
          />
        </div>

        <div className="field">
          <label htmlFor="percentValue">Процент</label>
          <input
            id="percentValue"
            type="number"
            value={percentValue}
            onChange={(e) => setPercentValue(e.target.value)}
            placeholder="15"
          />
        </div>

        {percentResult !== null && (
          <div className="result-box success">
            <div className="result-value">{percentResult}</div>
            <CopyButton text={percentResult.toString()} />
          </div>
        )}

        <button onClick={handlePercentCalculate} style={{ width: '100%', marginBottom: '2rem' }}>
          Рассчитать процент
        </button>

        {history.length > 0 && (
          <>
            <h2>История</h2>
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
              {history.map((item, index) => (
                <div key={index} style={{ padding: '0.5rem 0', borderBottom: index < history.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <strong>{item.expression}</strong> = {item.result}
                </div>
              ))}
              <button onClick={handleClearHistory} className="secondary" style={{ marginTop: '1rem', width: '100%' }}>
                Очистить историю
              </button>
            </div>
          </>
        )}

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Как пользоваться онлайн калькулятором</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            Бесплатный онлайн калькулятор для быстрых вычислений. Поддерживает базовые математические операции,
            расчет процентов и сохраняет историю последних вычислений.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Возможности калькулятора:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Базовые операции: сложение, вычитание, умножение, деление</li>
            <li>Расчет процентов от числа</li>
            <li>Поддержка скобок для сложных выражений</li>
            <li>История последних 10 вычислений</li>
            <li>Быстрый ввод с клавиатуры (Enter для расчета)</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Популярные запросы:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Калькулятор онлайн с процентами</li>
            <li>Калькулятор с историей вычислений</li>
            <li>Онлайн калькулятор со скобками</li>
            <li>Рассчитать процент от числа онлайн</li>
            <li>Калькулятор для сложных выражений</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Примеры использования:</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            <strong>Базовые операции:</strong> Введите выражение типа "100 + 20 * 3" и получите результат 160.
            Калькулятор соблюдает порядок операций.
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>Расчет процентов:</strong> Введите число 1000 и процент 15, чтобы узнать, что 15% от 1000 = 150.
            Удобно для расчета скидок и наценок.
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>Сложные выражения:</strong> Используйте скобки для группировки: "(100 + 50) * 2" даст результат 300.
            История сохраняет все ваши вычисления.
          </p>
        </div>

        <RelatedTools currentPath="/calculator" />
      </div>
    </>
  )
}

export default Calculator
