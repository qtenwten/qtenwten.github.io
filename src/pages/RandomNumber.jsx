import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import { generateRandomNumbers } from '../utils/randomGenerator'
import { filterNumberInput, handleNumberKeyDown } from '../utils/numberInput'

function RandomNumber() {
  const { t, language } = useLanguage()
  const [min, setMin] = useState('1')
  const [max, setMax] = useState('100')
  const [count, setCount] = useState('1')
  const [unique, setUnique] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('randomNumber')
    if (saved) {
      const data = JSON.parse(saved)
      setMin(data.min || '1')
      setMax(data.max || '100')
      setCount(data.count || '1')
      setUnique(data.unique || false)
    }
  }, [])

  const handleGenerate = () => {
    const res = generateRandomNumbers(min, max, count, unique)
    if (res.error) {
      setError(res.error)
      setResult(null)
    } else {
      setError('')
      setResult(res.numbers)
      localStorage.setItem('randomNumber', JSON.stringify({ min, max, count, unique }))
    }
  }

  const handleClear = () => {
    setMin('1')
    setMax('100')
    setCount('1')
    setUnique(false)
    setResult(null)
    setError('')
    localStorage.removeItem('randomNumber')
  }

  return (
    <>
      <SEO
        title="Генератор случайных чисел от 1 до 100 - Рандомайзер онлайн"
        description="Генератор случайных чисел от 1 до 100, от 1 до 1000. Уникальные числа без повторений. Рандомайзер для лотереи и розыгрышей."
        path={`/${language}/randomNumber`}
        keywords="генератор случайных чисел, рандомайзер, случайное число, генератор чисел онлайн, random number generator"
      />

      <div className="tool-container">
        <h1><span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>casino</span>Генератор случайных чисел</h1>
        <p>Генерация случайных чисел в заданном диапазоне</p>

        <div className="field">
          <label htmlFor="min">Минимум</label>
          <input
            id="min"
            type="text"
            value={min}
            onChange={(e) => setMin(filterNumberInput(e.target.value))}
            onKeyDown={handleNumberKeyDown}
            placeholder="1"
          />
        </div>

        <div className="field">
          <label htmlFor="max">Максимум</label>
          <input
            id="max"
            type="text"
            value={max}
            onChange={(e) => setMax(filterNumberInput(e.target.value))}
            onKeyDown={handleNumberKeyDown}
            placeholder="100"
          />
        </div>

        <div className="field">
          <label htmlFor="count">Количество чисел</label>
          <input
            id="count"
            type="text"
            value={count}
            onChange={(e) => setCount(filterNumberInput(e.target.value))}
            onKeyDown={handleNumberKeyDown}
            placeholder="1"
            min="1"
            max="10000"
          />
        </div>

        <div className="field">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={unique}
              onChange={(e) => setUnique(e.target.checked)}
            />
            Без повторений
          </label>
        </div>

        {error && <div className="error">{error}</div>}

        {result && (
          <div className="result-box success">
            <div className="result-value">{result.join(', ')}</div>
            <CopyButton text={result.join(', ')} />
          </div>
        )}

        <div className="btn-group">
          <button onClick={handleGenerate}>
            Сгенерировать
          </button>
          <button onClick={handleClear} className="secondary">
            Очистить
          </button>
        </div>

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Как пользоваться генератором случайных чисел</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            Онлайн генератор случайных чисел (рандомайзер) для быстрой генерации чисел в заданном диапазоне.
            Поддерживает генерацию как уникальных, так и повторяющихся чисел.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Возможности генератора:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Генерация чисел в любом диапазоне (от минимума до максимума)</li>
            <li>Генерация от 1 до 10000 чисел за раз</li>
            <li>Режим уникальных чисел (без повторений)</li>
            <li>Режим с повторениями для случайной выборки</li>
            <li>Сохранение настроек между сеансами</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Популярные запросы:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Генератор случайных чисел от 1 до 100</li>
            <li>Рандомайзер чисел онлайн</li>
            <li>Генератор уникальных чисел</li>
            <li>Случайное число от 1 до 10</li>
            <li>Генератор чисел без повторений</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Примеры использования:</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            <strong>Для лотереи:</strong> Установите диапазон от 1 до 100, количество 5, включите "Без повторений".
            Получите 5 уникальных случайных чисел для розыгрыша.
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>Для игр:</strong> Генерируйте случайные числа от 1 до 6 для имитации броска кубика,
            или от 1 до 52 для выбора случайной карты.
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>Для выборки:</strong> Создайте список случайных чисел для случайной выборки участников,
            тестовых данных или статистических исследований.
          </p>
        </div>

        <RelatedTools currentPath={`/${language}/randomNumber`} />
      </div>
    </>
  )
}

export default RandomNumber
