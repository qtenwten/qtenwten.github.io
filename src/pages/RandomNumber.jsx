import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import Icon from '../components/Icon'
import { generateRandomNumbers } from '../utils/randomGenerator'
import { filterNumberInput, handleNumberKeyDown } from '../utils/numberInput'
import { safeGetItem, safeSetItem, safeRemoveItem, safeParseJSON } from '../utils/storage'

function RandomNumber() {
  const { t, language } = useLanguage()
  const [min, setMin] = useState('1')
  const [max, setMax] = useState('100')
  const [count, setCount] = useState('1')
  const [unique, setUnique] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const copy = language === 'en'
    ? {
        seo: {
          title: 'Random Number Generator Online - Randomizer from 1 to 100',
          description: 'Online random number generator from 1 to 100 and beyond. Generate unique numbers without repeats for lotteries, raffles, games, and sampling.',
          keywords: 'random number generator, online randomizer, generate random numbers, unique random numbers, raffle number generator'
        },
        title: 'Random Number Generator',
        subtitle: 'Generate random numbers in a custom range',
        min: 'Minimum',
        max: 'Maximum',
        count: 'Number of values',
        unique: 'No duplicates',
        generate: 'Generate',
        clear: 'Clear',
        errors: {
          INVALID_PARAMS: 'Invalid input values',
          MIN_NOT_LESS_THAN_MAX: 'Minimum must be less than maximum',
          COUNT_OUT_OF_RANGE: 'Quantity must be between 1 and 10000',
          UNIQUE_COUNT_EXCEEDS_RANGE: 'Cannot generate that many unique numbers in this range'
        },
        infoTitle: 'How to use the random number generator',
        infoDescription: 'Use this online randomizer to quickly generate numbers in a selected range. It supports both unique values and repeated values for flexible use cases.',
        featuresTitle: 'Features',
        features: [
          'Generate numbers in any range from minimum to maximum',
          'Generate from 1 to 10000 numbers at once',
          'Unique mode without duplicates',
          'Repeated mode for random sampling',
          'Saves your settings between sessions'
        ],
        popularTitle: 'Popular searches',
        popular: [
          'random number generator 1 to 100',
          'online number randomizer',
          'unique random number generator',
          'random number from 1 to 10',
          'number generator without duplicates'
        ],
        examplesTitle: 'Examples',
        lotteryLabel: 'For raffles:',
        lotteryText: 'Set the range from 1 to 100, quantity to 5, and enable "No duplicates". You will get 5 unique random numbers for your draw.',
        gamesLabel: 'For games:',
        gamesText: 'Generate random numbers from 1 to 6 to simulate a dice roll, or from 1 to 52 to pick a random playing card.',
        sampleLabel: 'For sampling:',
        sampleText: 'Create random number lists for participant selection, test datasets, or statistical research.'
      }
    : {
        seo: {
          title: 'Генератор случайных чисел от 1 до 100 - Рандомайзер онлайн',
          description: 'Генератор случайных чисел от 1 до 100, от 1 до 1000 и больше. Уникальные числа без повторений для лотерей, розыгрышей и выборки.',
          keywords: 'генератор случайных чисел, рандомайзер, случайное число, генератор чисел онлайн, random number generator'
        },
        title: 'Генератор случайных чисел',
        subtitle: 'Генерация случайных чисел в заданном диапазоне',
        min: 'Минимум',
        max: 'Максимум',
        count: 'Количество чисел',
        unique: 'Без повторений',
        generate: 'Сгенерировать',
        clear: 'Очистить',
        errors: {
          INVALID_PARAMS: 'Некорректные параметры',
          MIN_NOT_LESS_THAN_MAX: 'Минимум должен быть меньше максимума',
          COUNT_OUT_OF_RANGE: 'Количество должно быть от 1 до 10000',
          UNIQUE_COUNT_EXCEEDS_RANGE: 'Невозможно сгенерировать столько уникальных чисел в заданном диапазоне'
        },
        infoTitle: 'Как пользоваться генератором случайных чисел',
        infoDescription: 'Онлайн генератор случайных чисел (рандомайзер) для быстрой генерации чисел в заданном диапазоне. Поддерживает генерацию как уникальных, так и повторяющихся чисел.',
        featuresTitle: 'Возможности генератора:',
        features: [
          'Генерация чисел в любом диапазоне (от минимума до максимума)',
          'Генерация от 1 до 10000 чисел за раз',
          'Режим уникальных чисел (без повторений)',
          'Режим с повторениями для случайной выборки',
          'Сохранение настроек между сеансами'
        ],
        popularTitle: 'Популярные запросы:',
        popular: [
          'Генератор случайных чисел от 1 до 100',
          'Рандомайзер чисел онлайн',
          'Генератор уникальных чисел',
          'Случайное число от 1 до 10',
          'Генератор чисел без повторений'
        ],
        examplesTitle: 'Примеры использования:',
        lotteryLabel: 'Для лотереи:',
        lotteryText: 'Установите диапазон от 1 до 100, количество 5, включите "Без повторений". Получите 5 уникальных случайных чисел для розыгрыша.',
        gamesLabel: 'Для игр:',
        gamesText: 'Генерируйте случайные числа от 1 до 6 для имитации броска кубика, или от 1 до 52 для выбора случайной карты.',
        sampleLabel: 'Для выборки:',
        sampleText: 'Создайте список случайных чисел для случайной выборки участников, тестовых данных или статистических исследований.'
      }

  useEffect(() => {
    const saved = safeGetItem('randomNumber')
    if (saved) {
      const data = safeParseJSON(saved, {})
      setMin(data.min || '1')
      setMax(data.max || '100')
      setCount(data.count || '1')
      setUnique(data.unique || false)
    }
  }, [])

  const handleGenerate = () => {
    const res = generateRandomNumbers(min, max, count, unique)
    if (res.error) {
      setError(copy.errors[res.error] || res.error)
      setResult(null)
    } else {
      setError('')
      setResult(res.numbers)
      safeSetItem('randomNumber', JSON.stringify({ min, max, count, unique }))
    }
  }

  const handleClear = () => {
    setMin('1')
    setMax('100')
    setCount('1')
    setUnique(false)
    setResult(null)
    setError('')
    safeRemoveItem('randomNumber')
  }

  return (
    <>
      <SEO
        title={copy.seo.title}
        description={copy.seo.description}
        path={`/${language}/random-number`}
        keywords={copy.seo.keywords}
      />

      <div className="tool-container">
        <h1><Icon name="casino" size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />{copy.title}</h1>
        <p>{copy.subtitle}</p>

        <div className="field">
          <label htmlFor="min">{copy.min}</label>
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
          <label htmlFor="max">{copy.max}</label>
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
          <label htmlFor="count">{copy.count}</label>
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
            {copy.unique}
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
            {copy.generate}
          </button>
          <button onClick={handleClear} className="secondary">
            {copy.clear}
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

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{copy.popularTitle}</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            {copy.popular.map((item) => <li key={item}>{item}</li>)}
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{copy.examplesTitle}</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            <strong>{copy.lotteryLabel}</strong> {copy.lotteryText}
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>{copy.gamesLabel}</strong> {copy.gamesText}
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>{copy.sampleLabel}</strong> {copy.sampleText}
          </p>
        </div>

        <RelatedTools currentPath={`/${language}/random-number`} />
      </div>
    </>
  )
}

export default RandomNumber
