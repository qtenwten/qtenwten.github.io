import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import { addTime, subtractTime, timeUntil } from '../utils/timeCalculator'

function TimeCalculator() {
  const { t, language } = useLanguage()
  const [mode, setMode] = useState('add')
  const [time1, setTime1] = useState('')
  const [time2, setTime2] = useState('')
  const [targetTime, setTargetTime] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('timeCalculator')
    if (saved) {
      const data = JSON.parse(saved)
      setMode(data.mode || 'add')
      setTime1(data.time1 || '')
      setTime2(data.time2 || '')
      setTargetTime(data.targetTime || '')
    }
  }, [])

  const handleCalculate = () => {
    let res = null
    if (mode === 'add') {
      res = addTime(time1, time2)
    } else if (mode === 'subtract') {
      res = subtractTime(time1, time2)
    } else if (mode === 'until') {
      res = timeUntil(targetTime)
    }

    if (res.error) {
      setError(res.error)
      setResult(null)
    } else {
      setError('')
      setResult(res.result)
      localStorage.setItem('timeCalculator', JSON.stringify({ mode, time1, time2, targetTime }))
    }
  }

  const handleClear = () => {
    setTime1('')
    setTime2('')
    setTargetTime('')
    setResult(null)
    setError('')
    localStorage.removeItem('timeCalculator')
  }

  return (
    <>
      <SEO
        title="Калькулятор времени - Сложение и вычитание времени онлайн"
        description="Калькулятор времени онлайн. Сложить время, вычесть время, рассчитать разницу. Формат часы:минуты:секунды. Быстрый расчет."
        path={`/${language}/timeCalculator`}
        keywords="калькулятор времени, сложение времени, вычитание времени, разница времени, калькулятор часов и минут"
      />

      <div className="tool-container">
        <h1>⏰ Калькулятор времени</h1>
        <p>Сложение, вычитание и разница времени</p>

        <div className="field">
          <label htmlFor="mode">Операция</label>
          <select
            id="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="add">Сложение времени</option>
            <option value="subtract">Вычитание времени</option>
            <option value="until">Сколько осталось до времени</option>
          </select>
        </div>

        {(mode === 'add' || mode === 'subtract') && (
          <>
            <div className="field">
              <label htmlFor="time1">Время 1 (ЧЧ:ММ или ЧЧ:ММ:СС)</label>
              <input
                id="time1"
                type="text"
                value={time1}
                onChange={(e) => setTime1(e.target.value)}
                placeholder="2:30"
                autoFocus
              />
            </div>

            <div className="field">
              <label htmlFor="time2">Время 2 (ЧЧ:ММ или ЧЧ:ММ:СС)</label>
              <input
                id="time2"
                type="text"
                value={time2}
                onChange={(e) => setTime2(e.target.value)}
                placeholder="1:45"
              />
            </div>
          </>
        )}

        {mode === 'until' && (
          <div className="field">
            <label htmlFor="targetTime">Целевое время (ЧЧ:ММ)</label>
            <input
              id="targetTime"
              type="text"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              placeholder="18:00"
              autoFocus
            />
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {result && (
          <div className="result-box success">
            <div className="result-value">{result}</div>
            <CopyButton text={result} />
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

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Как пользоваться калькулятором времени</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            Онлайн калькулятор времени для сложения, вычитания и расчета разницы времени.
            Поддерживает форматы ЧЧ:ММ и ЧЧ:ММ:СС для точных вычислений.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Возможности калькулятора:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Сложение времени - суммирование временных интервалов</li>
            <li>Вычитание времени - расчет разницы между временными отрезками</li>
            <li>Расчет времени до целевого момента</li>
            <li>Поддержка формата с секундами (ЧЧ:ММ:СС)</li>
            <li>Автоматическое сохранение введенных значений</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Популярные запросы:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Калькулятор времени онлайн сложение</li>
            <li>Вычитание времени калькулятор</li>
            <li>Сколько времени осталось до</li>
            <li>Калькулятор разницы времени</li>
            <li>Сложить часы и минуты онлайн</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Примеры использования:</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            <strong>Сложение времени:</strong> Введите 2:30 и 1:45, чтобы узнать, что суммарное время составляет 4:15.
            Полезно для расчета общей продолжительности задач.
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>Вычитание времени:</strong> Вычтите 1:20 из 3:45, чтобы получить разницу 2:25.
            Удобно для расчета оставшегося времени или перерывов.
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>Время до цели:</strong> Укажите целевое время 18:00, чтобы узнать, сколько часов и минут
            осталось до этого момента. Обновляется в реальном времени.
          </p>
        </div>

        <RelatedTools currentPath={`/${language}/timeCalculator`} />
      </div>
    </>
  )
}

export default TimeCalculator
