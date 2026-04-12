import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import Icon from '../components/Icon'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
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
          title: 'Random Number Generator Online | Free Number Picker',
          description: 'Generate random numbers online with custom ranges and optional no-repeat mode. Great for raffles, giveaways, games, and sampling.',
          keywords: 'random number generator online, free number picker, randomizer, random number tool, no repeat number generator'
        },
        title: 'Free Random Number Generator',
        subtitle: 'Generate random numbers online for raffles, games, sampling, and quick picks',
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
        infoTitle: 'A simple random number generator for quick picks',
        infoDescription: 'Use this free random number generator to pick one or more numbers from a custom range. It works well for raffles, classroom activities, test data, games, and any situation where you need a quick random result.',
        featuresTitle: 'What you can do with it',
        features: [
          'Generate numbers in any custom range',
          'Pick one value or generate larger random sets',
          'Use no-repeat mode for fair random draws',
          'Allow repeats for sampling or simulation use cases',
          'Keep your latest settings in the browser'
        ],
        popularTitle: 'Common use cases people search for',
        popular: [
          'random number generator 1 to 100',
          'online number randomizer',
          'unique random number generator',
          'random number from 1 to 10',
          'number generator without duplicates'
        ],
        examplesTitle: 'Where this tool works well',
        lotteryLabel: 'For raffles:',
        lotteryText: 'Pick winners from a participant range and use no-repeat mode to avoid duplicate selections.',
        gamesLabel: 'For games:',
        gamesText: 'Use the generator for dice-style rolls, card picks, challenge numbers, or quick random choices.',
        sampleLabel: 'For sampling:',
        sampleText: 'Create random number lists for participant selection, simple sampling, testing, or practice datasets.',
        faqTitle: 'FAQ',
        faq: [
          { q: 'How do I generate a random number online?', a: 'Enter the minimum and maximum values, choose how many numbers you want, and click the generate button.' },
          { q: 'Can I generate numbers without duplicates?', a: 'Yes. Turn on the no-repeat option to generate unique values only.' },
          { q: 'Is this randomizer free to use?', a: 'Yes. You can use it online for free with no registration.' },
          { q: 'What can I use it for?', a: 'It works well for raffles, classroom activities, games, quick picks, and sampling tasks.' }
        ]
      }
    : {
        seo: {
          title: 'Генератор случайных чисел онлайн — рандомайзер от 1 до 100',
          description: 'Генератор случайных чисел онлайн для розыгрышей, выборки, лотерей и игр. Задайте диапазон, количество чисел и режим без повторений.',
          keywords: 'генератор случайных чисел онлайн, рандомайзер, генератор чисел без повторений, случайное число от 1 до 100, генератор для розыгрыша'
        },
        title: 'Генератор случайных чисел онлайн',
        subtitle: 'Рандомайзер для розыгрышей, выборки и случайного выбора чисел',
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
        infoTitle: 'Как работает генератор случайных чисел',
        infoDescription: 'Генератор случайных чисел онлайн помогает быстро получить одно или несколько чисел в нужном диапазоне. Такой рандомайзер подходит для конкурсов, розыгрышей, жеребьевки, тестов, игр и любой случайной выборки.',
        featuresTitle: 'Что умеет генератор:',
        features: [
          'Генерирует случайные числа в любом диапазоне от минимума до максимума',
          'Подходит для сценариев от 1 числа до больших списков',
          'Есть режим без повторений для честного розыгрыша',
          'Можно включать повторы для случайной выборки и тестов',
          'Запоминает последние настройки в браузере'
        ],
        popularTitle: 'Частые запросы пользователей:',
        popular: [
          'Генератор случайных чисел от 1 до 100',
          'Рандомайзер онлайн',
          'Генератор уникальных чисел',
          'Случайное число от 1 до 10',
          'Генератор чисел без повторений'
        ],
        examplesTitle: 'Где использовать рандомайзер:',
        lotteryLabel: 'Для лотереи:',
        lotteryText: 'Задайте диапазон участников, выберите количество победителей и включите режим без повторений, чтобы получить честный список победных номеров.',
        gamesLabel: 'Для игр:',
        gamesText: 'Можно быстро получить случайное число для кубика, карты, задания или любой игровой механики.',
        sampleLabel: 'Для выборки:',
        sampleText: 'Используйте генератор для случайной выборки клиентов, тестовых данных, номеров заказов или статистических сценариев.',
        faqTitle: 'FAQ',
        faq: [
          { q: 'Как сгенерировать случайное число онлайн?', a: 'Укажите минимальное и максимальное значение, задайте количество чисел и нажмите кнопку генерации.' },
          { q: 'Можно ли получить числа без повторений?', a: 'Да, достаточно включить режим «Без повторений», и сервис выдаст только уникальные значения.' },
          { q: 'Подходит ли генератор для розыгрыша?', a: 'Да, инструмент можно использовать для конкурсов, жеребьевки, лотерей и случайного выбора победителей.' },
          { q: 'Какой диапазон поддерживается?', a: 'Вы можете выбрать практически любой числовой диапазон и сгенерировать от одного до тысяч значений за раз.' }
        ]
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

      <div className="tool-container random-number-page">
        <section className="random-number-hero" aria-labelledby="random-number-heading">
          <h1 id="random-number-heading" className="random-number-hero__title">
            <span className="random-number-hero__title-wrap">
              <Icon name="casino" size={22} className="random-number-hero__icon" />
              <span className="random-number-hero__title-text">{copy.title}</span>
            </span>
          </h1>
          <p className="random-number-hero__subtitle">{copy.subtitle}</p>
        </section>

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

        <ToolDescriptionSection>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{copy.infoTitle}</h2>
          <div className="tool-description-lead">
            <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
              {copy.infoDescription}
            </p>
          </div>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{copy.featuresTitle}</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            {copy.features.map((item) => <li key={item}>{item}</li>)}
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{copy.popularTitle}</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            {copy.popular.map((item) => <li key={item}>{item}</li>)}
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{copy.examplesTitle}</h3>
          <div className="tool-description-paragraph-stack">
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

          <ToolFaq title={copy.faqTitle} items={copy.faq || []} />
        </ToolDescriptionSection>

        <RelatedTools currentPath={`/${language}/random-number`} />
      </div>
    </>
  )
}

export default RandomNumber
