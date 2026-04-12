import { useLanguage } from '../contexts/LanguageContext'
import { lazy, Suspense, useState, useEffect } from 'react'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
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
          title: 'Free Graphing Calculator Online | Plot Functions Fast',
          description: 'Use a graphing calculator online for formulas, functions, trigonometry, and quick plots. Solve expressions and visualize functions in real time.',
          keywords: 'free graphing calculator, graph calculator online, function grapher, scientific calculator online, plot functions'
        },
        graphLoading: 'Loading graph tools...',
        infoTitle: 'A graphing calculator for formulas, functions, and quick checks',
        infoDescription: 'This free graphing calculator helps you solve expressions, plot functions, and review results in one place. It works well for classwork, engineering tasks, quick checks, and visualizing how a function behaves before you move into deeper analysis.',
        featuresTitle: 'What you can do with it:',
        features: [
          'Solve expressions with parentheses, powers, roots, and percentages',
          'Use scientific functions such as sin, cos, tan, log, and ln',
          'Plot functions of x and review the curve instantly',
          'Switch between calculator mode, graph mode, or a split view',
          'See live feedback while typing and keep a running history'
        ],
        graphTitle: 'What you can plot:',
        graphFeatures: [
          'Quadratic, trigonometric, logarithmic, and mixed expressions',
          'Functions like x^2, sin(x), x^3 - 2*x + 1, and similar formulas',
          'Custom X-axis ranges for focused graph analysis',
          'Automatic scaling on the Y-axis',
          'A fast visual check before deeper analysis in other tools'
        ],
        modesTitle: 'Modes:',
        modes: [
          'Calculator: focus on math input and instant results',
          'Graph: focus on plotting and viewing a function',
          'Both: calculate and visualize side by side'
        ],
        examplesTitle: 'Where people use this tool:',
        calcExample: 'Use it for homework, exam prep, engineering-style math, and quick scientific calculations without opening a desktop app.',
        graphExample: 'Use the graph view to preview parabolas, sine waves, growth curves, and custom functions before moving into deeper analysis.',
        faqTitle: 'FAQ',
        faq: [
          { q: 'How do I plot a function online?', a: 'Switch to graph mode, enter a function of x, and the graph appears automatically.' },
          { q: 'Can I use this as a scientific calculator?', a: 'Yes. It supports trigonometric functions, logarithms, roots, powers, and other common scientific operations.' },
          { q: 'Is this graphing calculator free to use?', a: 'Yes. You can use the calculator and graphing features online for free.' },
          { q: 'What kinds of functions can I graph?', a: 'You can graph many standard expressions, including quadratic, trigonometric, logarithmic, and mixed functions of x.' }
        ]
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
        graphExample: 'Графики: x^2 для параболы, sin(x) для синусоиды, x^3 - 2*x + 1 для анализа корней и экстремумов.',
        faqTitle: 'FAQ',
        faq: [
          { q: 'Как построить график функции онлайн?', a: 'Переключитесь в режим графика, введите формулу от x и калькулятор сразу покажет график функции.' },
          { q: 'Можно ли использовать калькулятор как инженерный?', a: 'Да, он поддерживает тригонометрию, логарифмы, степени, корни и другие типовые инженерные функции.' },
          { q: 'Подходит ли инструмент для учебы?', a: 'Да, графический калькулятор удобно использовать для школы, вуза, подготовки к экзаменам и быстрой проверки решений.' },
          { q: 'Можно ли одновременно считать и смотреть график?', a: 'Да, для этого есть режим, в котором калькулятор и график открываются рядом.' }
        ]
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
              <Suspense fallback={<div className="graph-panel graph-panel-skeleton" aria-hidden="true"><span className="skeleton-line graph-skeleton-line graph-skeleton-line--hero" /><span className="skeleton-line graph-skeleton-line" /><span className="skeleton-line graph-skeleton-line" /><span className="skeleton-line graph-skeleton-line graph-skeleton-line--canvas" /></div>}>
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

        <ToolDescriptionSection>
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

          <ToolFaq title={copy.faqTitle} items={copy.faq || []} />
        </ToolDescriptionSection>

        <RelatedTools currentPath={`/${language}/calculator`} />
      </div>
    </>
  )
}

export default Calculator
