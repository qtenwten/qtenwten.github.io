import { useState, useEffect, useRef } from 'react'
import { calculateExpression } from '../../utils/mathParser'

function CalculatorPanel({ onHistoryAdd, restoredExpression }) {
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const lastValidResultRef = useRef(null)
  const [isExpressionValid, setIsExpressionValid] = useState(true)

  // Live preview
  useEffect(() => {
    let active = true

    const preview = async () => {
      if (expression.trim()) {
        const res = await calculateExpression(expression)

        if (!active) {
          return
        }

        if (res.error) {
          // Не показываем ошибку при незавершенном вводе, но сохраняем последний результат
          setError('')
          setResult(lastValidResultRef.current)
          setIsExpressionValid(false)
        } else {
          setError('')
          setResult(res.result)
          lastValidResultRef.current = res.result
          setIsExpressionValid(true)
        }
      }

      if (!expression.trim()) {
        setResult(null)
        setError('')
        lastValidResultRef.current = null
        setIsExpressionValid(true)
      }
    }

    preview()

    return () => {
      active = false
    }
  }, [expression])

  useEffect(() => {
    if (restoredExpression?.value) {
      setExpression(restoredExpression.value)
      setError('')
    }
  }, [restoredExpression])

  const handleCalculate = async () => {
    if (!expression.trim()) {
      return
    }

    const res = await calculateExpression(expression)

    if (res.error) {
      setError(res.error)
      setIsExpressionValid(false)
      return
    }

    setError('')
    setResult(res.result)
    lastValidResultRef.current = res.result
    setIsExpressionValid(true)
    onHistoryAdd({ type: 'calculation', expression, result: res.result })
  }

  const insertText = (text) => {
    setExpression(prev => prev + text)
  }

  const handleClear = () => {
    setExpression('')
    setResult(null)
    setError('')
    lastValidResultRef.current = null
    setIsExpressionValid(true)
  }

  const handleBackspace = () => {
    setExpression(prev => prev.slice(0, -1))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCalculate()
    } else if (e.key === 'Escape') {
      handleClear()
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      handleBackspace()
    }
  }

  // Компактная сетка кнопок (Casio style)
  const buttons = [
    // Строка 1: Функции очистки и скобки
    [
      { label: 'C', action: handleClear, class: 'func' },
      { label: '⌫', action: handleBackspace, class: 'func' },
      { label: '(', value: '(' },
      { label: ')', value: ')' },
      { label: '^', value: '^', class: 'op' }
    ],
    // Строка 2: Тригонометрия
    [
      { label: 'sin', value: 'sin(' },
      { label: 'cos', value: 'cos(' },
      { label: 'tan', value: 'tan(' },
      { label: '√', value: 'sqrt(' },
      { label: '÷', value: '/', class: 'op' }
    ],
    // Строка 3: Логарифмы и числа
    [
      { label: 'log', value: 'log(' },
      { label: 'ln', value: 'ln(' },
      { label: '7', value: '7', class: 'num' },
      { label: '8', value: '8', class: 'num' },
      { label: '9', value: '9', class: 'num' }
    ],
    // Строка 4: Константы и числа
    [
      { label: 'π', value: 'pi' },
      { label: 'e', value: 'e' },
      { label: '4', value: '4', class: 'num' },
      { label: '5', value: '5', class: 'num' },
      { label: '6', value: '6', class: 'num' }
    ],
    // Строка 5: Операторы и числа
    [
      { label: '!', value: '!' },
      { label: '%', value: '%' },
      { label: '1', value: '1', class: 'num' },
      { label: '2', value: '2', class: 'num' },
      { label: '3', value: '3', class: 'num' }
    ],
    // Строка 6: Нижняя строка
    [
      { label: '×', value: '*', class: 'op' },
      { label: '−', value: '-', class: 'op' },
      { label: '0', value: '0', class: 'num' },
      { label: '.', value: '.' },
      { label: '+', value: '+', class: 'op' }
    ],
    // Строка 7: Равно
    [
      { label: '=', action: handleCalculate, class: 'equals', span: 5 }
    ]
  ]

  return (
    <div className="calc-panel">
      <div className="calc-screen">
        <input
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="0"
          className="calc-input"
          spellCheck="false"
        />
        {result !== null && !error && (
          <div className="calc-preview">= {result}</div>
        )}
        {error && (
          <div className="calc-error">{error}</div>
        )}
      </div>

      <div className="calc-grid">
        {buttons.map((row, i) => (
          <div key={i} className="calc-grid-row">
            {row.map((btn, j) => (
              <button
                key={j}
                onClick={btn.action || (() => insertText(btn.value))}
                className={`calc-key ${btn.class || ''}`}
                style={btn.span ? { gridColumn: `span ${btn.span}` } : {}}
              >
                {btn.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CalculatorPanel
