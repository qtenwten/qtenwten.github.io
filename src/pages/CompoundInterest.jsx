import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import LineChart from '../components/LineChart'
import { calculateCompoundInterest, formatNumber } from '../utils/compoundInterest'
import { filterNumberInput, handleNumberKeyDown } from '../utils/numberInput'

function CompoundInterest() {
  const { t, language } = useLanguage()
  const [principal, setPrincipal] = useState('10000')
  const [rate, setRate] = useState('7')
  const [years, setYears] = useState('10')
  const [frequency, setFrequency] = useState('12')
  const [monthlyContribution, setMonthlyContribution] = useState('0')
  const [result, setResult] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('compoundInterest')
    if (saved) {
      const data = JSON.parse(saved)
      setPrincipal(data.principal || '10000')
      setRate(data.rate || '7')
      setYears(data.years || '10')
      setFrequency(data.frequency || '12')
      setMonthlyContribution(data.monthlyContribution || '0')
    }
  }, [])

  useEffect(() => {
    if (principal && rate && years && frequency) {
      const res = calculateCompoundInterest(principal, rate, years, frequency, monthlyContribution)
      setResult(res)
      localStorage.setItem('compoundInterest', JSON.stringify({
        principal,
        rate,
        years,
        frequency,
        monthlyContribution
      }))
    } else {
      setResult(null)
    }
  }, [principal, rate, years, frequency, monthlyContribution])

  const handleClear = () => {
    setPrincipal('10000')
    setRate('7')
    setYears('10')
    setFrequency('12')
    setMonthlyContribution('0')
    setResult(null)
    localStorage.removeItem('compoundInterest')
  }

  return (
    <>
      <SEO
        title="Калькулятор сложных процентов - Расчет доходности инвестиций"
        description="Калькулятор сложных процентов с ежемесячными взносами. Рассчитайте рост капитала и доходность инвестиций онлайн."
        path={`/${language}/compoundInterest`}
        keywords="сложные проценты, калькулятор инвестиций, доходность инвестиций, капитализация процентов, расчет процентов онлайн"
      />

      <div className="tool-container">
        <h1>Калькулятор сложных процентов</h1>
        <p>Рассчитайте рост ваших инвестиций с учетом реинвестирования</p>

        <div className="field">
          <label htmlFor="principal">Начальная сумма (₽)</label>
          <input
            id="principal"
            type="text"
            value={principal}
            onChange={(e) => setPrincipal(filterNumberInput(e.target.value))}
            onKeyDown={handleNumberKeyDown}
            placeholder="10000"
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="rate">Годовая процентная ставка (%)</label>
          <input
            id="rate"
            type="text"
            value={rate}
            onChange={(e) => setRate(filterNumberInput(e.target.value))}
            onKeyDown={handleNumberKeyDown}
            placeholder="7"
          />
        </div>

        <div className="field">
          <label htmlFor="years">Срок инвестирования (лет)</label>
          <input
            id="years"
            type="text"
            value={years}
            onChange={(e) => setYears(filterNumberInput(e.target.value))}
            onKeyDown={handleNumberKeyDown}
            placeholder="10"
          />
        </div>

        <div className="field">
          <label htmlFor="frequency">Частота начисления процентов</label>
          <select
            id="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            <option value="1">Ежегодно</option>
            <option value="12">Ежемесячно</option>
            <option value="365">Ежедневно</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="monthlyContribution">Ежемесячный взнос (₽, необязательно)</label>
          <input
            id="monthlyContribution"
            type="text"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(filterNumberInput(e.target.value))}
            onKeyDown={handleNumberKeyDown}
            placeholder="0"
          />
        </div>

        {result && (
          <>
            <div className="result-box success" style={{ marginTop: '2rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Итоговая сумма:</strong>
                <div className="result-value" style={{ fontSize: '1.75rem', color: 'var(--success)' }}>
                  {formatNumber(result.finalAmount)} ₽
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <strong>Всего вложено:</strong>
                  <div style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>
                    {formatNumber(result.totalInvested)} ₽
                  </div>
                </div>
                <div>
                  <strong>Заработано:</strong>
                  <div style={{ fontSize: '1.25rem', marginTop: '0.25rem', color: 'var(--success)' }}>
                    {formatNumber(result.earnedInterest)} ₽
                  </div>
                </div>
              </div>
              <CopyButton text={`Итоговая сумма: ${formatNumber(result.finalAmount)} ₽\nВложено: ${formatNumber(result.totalInvested)} ₽\nЗаработано: ${formatNumber(result.earnedInterest)} ₽`} />
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                💡 При регулярном инвестировании ваши деньги могут расти именно так со временем
              </p>
            </div>

            <div style={{ marginTop: '2rem', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>График роста капитала</h2>
              <LineChart data={result.chartData} width={600} height={300} />
            </div>
          </>
        )}

        <div className="btn-group" style={{ marginTop: '1.5rem' }}>
          <button onClick={handleClear} className="secondary">
            Сбросить
          </button>
        </div>

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Как работает калькулятор сложных процентов</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            Калькулятор сложных процентов помогает рассчитать доходность инвестиций с учетом реинвестирования прибыли.
            Сложный процент - это начисление процентов не только на первоначальную сумму, но и на накопленные проценты.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Возможности калькулятора:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Расчет сложных процентов с разной частотой начисления</li>
            <li>Учет регулярных ежемесячных взносов</li>
            <li>Визуализация роста капитала на графике</li>
            <li>Расчет общей суммы инвестиций и заработанных процентов</li>
            <li>Автоматическое сохранение введенных данных</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Формула сложного процента:</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            A = P × (1 + r/n)^(n×t)
          </p>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <li>A - итоговая сумма</li>
            <li>P - начальная сумма</li>
            <li>r - годовая процентная ставка (в десятичном виде)</li>
            <li>n - количество начислений процентов в год</li>
            <li>t - количество лет</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Примеры использования:</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            <strong>Долгосрочные инвестиции:</strong> Вложите 100 000 ₽ под 10% годовых на 20 лет с ежемесячным начислением.
            Итоговая сумма составит более 700 000 ₽.
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>С регулярными взносами:</strong> Начните с 50 000 ₽ и добавляйте по 5 000 ₽ ежемесячно под 8% годовых.
            За 10 лет накопите более 900 000 ₽.
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>Сравнение частоты начисления:</strong> Сравните результаты при ежегодном, ежемесячном и ежедневном начислении процентов,
            чтобы увидеть влияние частоты капитализации на доходность.
          </p>
        </div>

        <RelatedTools currentPath={`/${language}/compoundInterest`} />
      </div>
    </>
  )
}

export default CompoundInterest
