import { useLanguage } from '../contexts/LanguageContext'
import { lazy, Suspense, useState, useEffect } from 'react'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import ModeSwitcher from '../components/calculator/ModeSwitcher'
import CalculatorPanel from '../components/calculator/CalculatorPanel'
import HistoryPanel from '../components/calculator/HistoryPanel'
import { safeGetItem, safeSetItem, safeRemoveItem, safeParseJSON } from '../utils/storage'
import '../styles/calculator.css'

const GraphPanel = lazy(() => import('../components/calculator/GraphPanel'))

function Calculator() {
  const { t, language } = useLanguage()
  const [mode, setMode] = useState('calculator')
  const [history, setHistory] = useState([])

  const copy = language === 'en'
    ? {
        seo: {
          title: 'Graph Calculator Online - Engineering Calculator with Function Graphs',
          description: 'Engineering calculator with graph plotting. Solve expressions, use trigonometry, logarithms, powers, and visualize functions in real time.',
          keywords: 'graph calculator, engineering calculator, function grapher, online graphing calculator, scientific calculator'
        },
        graphLoading: 'Loading graph tools...',
        infoTitle: 'Engineering calculator with graphing',
        infoDescription: 'Graph Calculator combines an engineering calculator with a function plotting tool. Perform advanced calculations and visualize mathematical functions in real time.',
        featuresTitle: 'Calculator features:',
        features: [
          'Basic operations: +, -, *, /, and parentheses',
          'Trigonometry: sin, cos, tan',
          'Logarithms: log (base 10), ln (natural log)',
          'Roots and powers: sqrt, ^',
          'Constants: π (pi), e',
          'Factorial: !',
          'Live result preview while typing'
        ],
        graphTitle: 'Graph plotting:',
        graphFeatures: [
          'Plot any function of x: x^2, sin(x), x^3 - 2*x + 1',
          'Adjust the X-axis range',
          'Automatic Y-axis scaling',
          'Smooth real-time updates',
          'Interactive chart with tooltips'
        ],
        modesTitle: 'Modes:',
        modes: [
          'Calculator - calculation mode with function buttons',
          'Graph - function graphing mode',
          'Both - calculator and graph side by side'
        ],
        examplesTitle: 'Examples:',
        calcExample: 'Calculations: sin(pi/2) = 1, sqrt(16) = 4, 2^3 = 8, log(100) = 2',
        graphExample: 'Graphs: enter x^2 for a parabola, sin(x) for a sine wave, or x^3 - 2*x + 1 for a cubic function'
      }
    : {
        seo: {
          title: 'Графический калькулятор онлайн — графики функций и инженерные расчеты',
          description: 'Графический калькулятор онлайн для формул, функций и инженерных вычислений. Построение графиков, sin, cos, log, степени, корни и история расчетов.',
          keywords: 'графический калькулятор онлайн, график функции онлайн, инженерный калькулятор, построить график функции, калькулятор с графиком'
        },
        graphLoading: 'Загрузка графических инструментов...',
        infoTitle: 'Графический калькулятор онлайн для формул и функций',
        infoDescription: 'Графический калькулятор объединяет инженерные вычисления и построение графиков функций в одном окне. Он подходит для учебы, проверки формул, решения задач и быстрого анализа поведения функции без установки программ.',
        featuresTitle: 'Что умеет калькулятор:',
        features: [
          'Решает базовые примеры со скобками, дробями и процентами',
          'Поддерживает функции sin, cos, tan, log, ln, sqrt, степени и факториал',
          'Работает как инженерный калькулятор для учебы и практики',
          'Показывает результат сразу во время ввода выражения',
          'Хранит историю вычислений для повторной проверки'
        ],
        graphTitle: 'Построение графиков функций:',
        graphFeatures: [
          'Строит график функции онлайн по формуле от x',
          'Подходит для парабол, тригонометрии, полиномов и смешанных выражений',
          'Позволяет менять диапазон по оси X и смотреть результат сразу',
          'Автоматически подбирает масштаб по оси Y',
          'Помогает быстро проверить вид графика перед решением задачи'
        ],
        modesTitle: 'Режимы работы:',
        modes: [
          'Калькулятор — для быстрых инженерных вычислений и формул',
          'График — для построения графика функции без лишних полей',
          'Оба — чтобы считать и сразу смотреть график в одном окне'
        ],
        examplesTitle: 'Примеры запросов и задач:',
        calcExample: 'Вычисления: sin(pi/2), sqrt(16), 2^3, log(100), сложные формулы со скобками и степенями.',
        graphExample: 'Графики: x^2 для параболы, sin(x) для синусоиды, x^3 - 2*x + 1 для анализа корней и экстремумов.'
      }

  useEffect(() => {
    const savedHistory = safeGetItem('calculator-history')
    if (savedHistory) {
      setHistory(safeParseJSON(savedHistory, []))
    }
  }, [])

  const handleHistoryAdd = (item) => {
    const newHistory = [item, ...history.slice(0, 19)]
    setHistory(newHistory)
    safeSetItem('calculator-history', JSON.stringify(newHistory))
  }

  const handleHistoryRestore = (item) => {
    console.log('Restore:', item)
  }

  const handleHistoryClear = () => {
    setHistory([])
    safeRemoveItem('calculator-history')
  }

  return (
    <>
      <SEO
        title={copy.seo.title}
        description={copy.seo.description}
        path={`/${language}/calculator`}
        keywords={copy.seo.keywords}
      />

      <div className="calculator-container">
        <div className="calc-header">
          <h1>{t('calculator.title')}</h1>
          <p>{t('calculator.subtitle')}</p>
        </div>

        <ModeSwitcher mode={mode} setMode={setMode} t={t} />

        <div className={`calc-workspace mode-${mode}`}>
          {(mode === 'calculator' || mode === 'split') && (
            <div className="calc-section">
              <CalculatorPanel onHistoryAdd={handleHistoryAdd} />
            </div>
          )}

          {(mode === 'graph' || mode === 'split') && (
            <div className="calc-section">
              <Suspense fallback={<div className="result-box">{copy.graphLoading}</div>}>
                <GraphPanel onHistoryAdd={handleHistoryAdd} />
              </Suspense>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <HistoryPanel
            history={history}
            onRestore={handleHistoryRestore}
            onClear={handleHistoryClear}
          />
        )}

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>{copy.infoTitle}</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)', textAlign: 'center' }}>
            {copy.infoDescription}
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem', textAlign: 'center' }}>{copy.featuresTitle}</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            {copy.features.map((item) => <li key={item}>{item}</li>)}
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem', textAlign: 'center' }}>{copy.graphTitle}</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            {copy.graphFeatures.map((item) => <li key={item}>{item}</li>)}
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem', textAlign: 'center' }}>{copy.modesTitle}</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            {copy.modes.map((item) => <li key={item}>{item}</li>)}
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem', textAlign: 'center' }}>{copy.examplesTitle}</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', textAlign: 'center' }}>
            {copy.calcExample}
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem', textAlign: 'center' }}>
            {copy.graphExample}
          </p>
        </div>

        <RelatedTools currentPath={`/${language}/calculator`} />
      </div>
    </>
  )
}

export default Calculator
