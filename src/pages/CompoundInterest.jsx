import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import LineChart from '../components/LineChart'
import { calculateCompoundInterest, formatNumber } from '../utils/compoundInterest'
import { filterNumberInput, handleNumberKeyDown } from '../utils/numberInput'
import { safeGetItem, safeSetItem, safeRemoveItem, safeParseJSON } from '../utils/storage'

function CompoundInterest() {
  const { t, language } = useLanguage()
  const [principal, setPrincipal] = useState('10000')
  const [rate, setRate] = useState('7')
  const [years, setYears] = useState('10')
  const [frequency, setFrequency] = useState('12')
  const [monthlyContribution, setMonthlyContribution] = useState('0')
  const [result, setResult] = useState(null)

  const locale = language === 'en' ? 'en-US' : 'ru-RU'
  const copy = language === 'en'
    ? {
        seo: {
          title: 'Compound Interest Calculator - Investment Growth Forecast',
          description: 'Online compound interest calculator with recurring contributions. Estimate capital growth, invested amount, and earned interest over time.',
          keywords: 'compound interest calculator, investment growth, savings calculator, capital growth chart, recurring contributions'
        },
        title: 'Compound Interest Calculator',
        subtitle: 'Estimate the growth of your investments with reinvestment',
        principal: 'Initial amount (₽)',
        rate: 'Annual interest rate (%)',
        years: 'Investment period (years)',
        frequency: 'Compounding frequency',
        yearly: 'Yearly',
        monthly: 'Monthly',
        daily: 'Daily',
        monthlyContribution: 'Monthly contribution (₽, optional)',
        finalAmount: 'Final amount:',
        totalInvested: 'Total invested:',
        earned: 'Earned interest:',
        copyText: (finalAmount, totalInvested, earnedInterest) => `Final amount: ${finalAmount} ₽\nInvested: ${totalInvested} ₽\nEarned: ${earnedInterest} ₽`,
        note: 'Regular investing can grow your money like this over time',
        chartTitle: 'Capital growth chart',
        reset: 'Reset',
        infoTitle: 'How the compound interest calculator works',
        infoDescription: 'This calculator helps estimate investment returns with reinvested earnings. Compound interest means interest is earned both on the initial amount and on previously accumulated interest.',
        featuresTitle: 'Features:',
        features: [
          'Compound interest calculation with different compounding frequencies',
          'Support for recurring monthly contributions',
          'Capital growth visualization on a chart',
          'Calculation of total invested amount and earned interest',
          'Automatic save of entered values'
        ],
        formulaTitle: 'Compound interest formula:',
        formulaItems: [
          'A - final amount',
          'P - initial amount',
          'r - annual interest rate (in decimal form)',
          'n - number of interest postings per year',
          't - number of years'
        ],
        examplesTitle: 'Examples:',
        longTerm: 'Long-term investing:',
        longTermText: 'Invest 100,000 ₽ at 10% annual interest for 20 years with monthly compounding. The final amount will exceed 700,000 ₽.',
        recurring: 'With recurring deposits:',
        recurringText: 'Start with 50,000 ₽ and add 5,000 ₽ every month at 8% annual interest. In 10 years you can grow the balance to more than 900,000 ₽.',
        compare: 'Compounding frequency comparison:',
        compareText: 'Compare yearly, monthly, and daily compounding to see how capitalization frequency affects total return.'
      }
    : {
        seo: {
          title: 'Калькулятор сложных процентов онлайн — с капитализацией и пополнением',
          description: 'Калькулятор сложных процентов для вклада, инвестиций и накоплений. Покажет итоговую сумму, доход, пополнения и график роста капитала.',
          keywords: 'калькулятор сложных процентов, сложные проценты онлайн, калькулятор сложных процентов с капитализацией, доходность вклада, рост капитала'
        },
        title: 'Калькулятор сложных процентов онлайн',
        subtitle: 'Рассчитайте рост вклада, инвестиций и накоплений с капитализацией',
        principal: 'Начальная сумма (₽)',
        rate: 'Годовая процентная ставка (%)',
        years: 'Срок инвестирования (лет)',
        frequency: 'Частота начисления процентов',
        yearly: 'Ежегодно',
        monthly: 'Ежемесячно',
        daily: 'Ежедневно',
        monthlyContribution: 'Ежемесячный взнос (₽, необязательно)',
        finalAmount: 'Итоговая сумма:',
        totalInvested: 'Всего вложено:',
        earned: 'Заработано:',
        copyText: (finalAmount, totalInvested, earnedInterest) => `Итоговая сумма: ${finalAmount} ₽\nВложено: ${totalInvested} ₽\nЗаработано: ${earnedInterest} ₽`,
        note: 'Так выглядит рост капитала при регулярных пополнениях и капитализации процентов',
        chartTitle: 'График роста капитала',
        reset: 'Сбросить',
        infoTitle: 'Как работает калькулятор сложных процентов',
        infoDescription: 'Калькулятор сложных процентов помогает понять, как будет расти вклад, инвестиционный портфель или личные накопления при капитализации процентов. Вы задаете стартовую сумму, ставку, срок и пополнения, а сервис показывает итоговый результат и динамику роста.',
        featuresTitle: 'Что показывает калькулятор:',
        features: [
          'Расчет сложных процентов онлайн с капитализацией по разной частоте',
          'Учет регулярных ежемесячных пополнений',
          'Отдельный расчет вложенной суммы и заработанных процентов',
          'Наглядный график роста капитала по годам',
          'Подходит для вкладов, инвестиций и долгосрочных накоплений'
        ],
        formulaTitle: 'Формула сложного процента:',
        formulaItems: [
          'A - итоговая сумма',
          'P - начальная сумма',
          'r - годовая процентная ставка (в десятичном виде)',
          'n - количество начислений процентов в год',
          't - количество лет'
        ],
        examplesTitle: 'Когда это особенно полезно:',
        longTerm: 'Для вклада или облигаций:',
        longTermText: 'Можно быстро сравнить, как растет сумма без пополнений и с капитализацией процентов на длинном сроке.',
        recurring: 'Для накоплений с пополнением:',
        recurringText: 'Укажите ежемесячный взнос и посмотрите, сколько денег можно накопить к нужной дате.',
        compare: 'Для сравнения условий:',
        compareText: 'Сравните разные ставки и частоту начисления процентов, чтобы выбрать более выгодный вариант.'
      }

  useEffect(() => {
    const saved = safeGetItem('compoundInterest')
    if (saved) {
      const data = safeParseJSON(saved, {})
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
      safeSetItem('compoundInterest', JSON.stringify({
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
    safeRemoveItem('compoundInterest')
  }

  return (
    <>
      <SEO
        title={copy.seo.title}
        description={copy.seo.description}
        path={`/${language}/compound-interest`}
        keywords={copy.seo.keywords}
      />

      <div className="tool-container">
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>

        <div className="field">
          <label htmlFor="principal">{copy.principal}</label>
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
          <label htmlFor="rate">{copy.rate}</label>
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
          <label htmlFor="years">{copy.years}</label>
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
          <label htmlFor="frequency">{copy.frequency}</label>
          <select
            id="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            <option value="1">{copy.yearly}</option>
            <option value="12">{copy.monthly}</option>
            <option value="365">{copy.daily}</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="monthlyContribution">{copy.monthlyContribution}</label>
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
                <strong>{copy.finalAmount}</strong>
                <div className="result-value" style={{ fontSize: '1.75rem', color: 'var(--success)' }}>
                  {formatNumber(result.finalAmount, locale)} ₽
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <strong>{copy.totalInvested}</strong>
                  <div style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>
                    {formatNumber(result.totalInvested, locale)} ₽
                  </div>
                </div>
                <div>
                  <strong>{copy.earned}</strong>
                  <div style={{ fontSize: '1.25rem', marginTop: '0.25rem', color: 'var(--success)' }}>
                    {formatNumber(result.earnedInterest, locale)} ₽
                  </div>
                </div>
              </div>
              <CopyButton text={copy.copyText(formatNumber(result.finalAmount, locale), formatNumber(result.totalInvested, locale), formatNumber(result.earnedInterest, locale))} />
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                💡 {copy.note}
              </p>
            </div>

            <div style={{ marginTop: '2rem', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{copy.chartTitle}</h2>
              <LineChart data={result.chartData} width={600} height={300} />
            </div>
          </>
        )}

        <div className="btn-group" style={{ marginTop: '1.5rem' }}>
          <button onClick={handleClear} className="secondary">
            {copy.reset}
          </button>
        </div>

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{copy.infoTitle}</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            {copy.infoDescription}
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{copy.featuresTitle}</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            {copy.features.map((item) => <li key={item}>{item}</li>)}
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{copy.formulaTitle}</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            A = P × (1 + r/n)^(n×t)
          </p>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            {copy.formulaItems.map((item) => <li key={item}>{item}</li>)}
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{copy.examplesTitle}</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            <strong>{copy.longTerm}</strong> {copy.longTermText}
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>{copy.recurring}</strong> {copy.recurringText}
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>{copy.compare}</strong> {copy.compareText}
          </p>
        </div>

        <RelatedTools currentPath={`/${language}/compound-interest`} />
      </div>
    </>
  )
}

export default CompoundInterest
