import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import ModeSwitcher from '../components/calculator/ModeSwitcher'
import CalculatorPanel from '../components/calculator/CalculatorPanel'
import GraphPanel from '../components/calculator/GraphPanel'
import HistoryPanel from '../components/calculator/HistoryPanel'
import '../styles/calculator.css'

function Calculator() {
  const [mode, setMode] = useState('calculator')
  const [history, setHistory] = useState([])

  useEffect(() => {
    const savedHistory = localStorage.getItem('calculator-history')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  const handleHistoryAdd = (item) => {
    const newHistory = [item, ...history.slice(0, 19)]
    setHistory(newHistory)
    localStorage.setItem('calculator-history', JSON.stringify(newHistory))
  }

  const handleHistoryRestore = (item) => {
    console.log('Restore:', item)
  }

  const handleHistoryClear = () => {
    setHistory([])
    localStorage.removeItem('calculator-history')
  }

  return (
    <>
      <SEO
        title="Graph Calculator - Инженерный калькулятор с графиками функций"
        description="Современный онлайн калькулятор с построением графиков. Инженерные функции: sin, cos, tan, log, sqrt. Построение графиков функций в реальном времени."
        path="/calculator"
        keywords="калькулятор онлайн, инженерный калькулятор, график функции онлайн, построить график, калькулятор с графиками"
      />

      <div className="calculator-container">
        <div className="calc-header">
          <h1>Graph Calculator</h1>
          <p>Инженерный калькулятор с построением графиков функций</p>
        </div>

        <ModeSwitcher mode={mode} setMode={setMode} />

        <div className={`calc-workspace mode-${mode}`}>
          {(mode === 'calculator' || mode === 'split') && (
            <div className="calc-section">
              <CalculatorPanel onHistoryAdd={handleHistoryAdd} />
            </div>
          )}

          {(mode === 'graph' || mode === 'split') && (
            <div className="calc-section">
              <GraphPanel onHistoryAdd={handleHistoryAdd} />
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
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Инженерный калькулятор с графиками</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            Graph Calculator - современный онлайн калькулятор, объединяющий функции инженерного калькулятора
            и построителя графиков функций. Выполняйте сложные вычисления и визуализируйте математические функции
            в реальном времени.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Возможности калькулятора:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>Базовые операции: +, -, *, /, скобки</li>
            <li>Тригонометрия: sin, cos, tan</li>
            <li>Логарифмы: log (десятичный), ln (натуральный)</li>
            <li>Корни и степени: sqrt, ^</li>
            <li>Константы: π (pi), e</li>
            <li>Факториал: !</li>
            <li>Live preview результата при вводе</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Построение графиков:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li>График любой функции от x: x^2, sin(x), x^3 - 2*x + 1</li>
            <li>Настройка диапазона по оси X</li>
            <li>Автоматическое масштабирование по Y</li>
            <li>Плавное обновление в реальном времени</li>
            <li>Интерактивный график с подсказками</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Режимы работы:</h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '1.8' }}>
            <li><strong>Калькулятор</strong> - режим вычислений с кнопками функций</li>
            <li><strong>График</strong> - режим построения графиков функций</li>
            <li><strong>Оба</strong> - одновременная работа с калькулятором и графиком</li>
          </ul>

          <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Примеры использования:</h3>
          <p style={{ color: 'var(--text)', lineHeight: '1.8' }}>
            <strong>Вычисления:</strong> sin(pi/2) = 1, sqrt(16) = 4, 2^3 = 8, log(100) = 2
          </p>
          <p style={{ color: 'var(--text)', lineHeight: '1.8', marginTop: '0.5rem' }}>
            <strong>Графики:</strong> Введите x^2 для параболы, sin(x) для синусоиды,
            x^3 - 2*x + 1 для кубической функции
          </p>
        </div>

        <RelatedTools currentPath="/calculator" />
      </div>
    </>
  )
}

export default Calculator
