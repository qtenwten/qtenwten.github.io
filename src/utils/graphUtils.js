import { evaluateAt } from './mathParser'

/**
 * Генерация данных для графика
 * @param {object} compiled - Скомпилированная функция
 * @param {number} xMin - Минимальное значение x
 * @param {number} xMax - Максимальное значение x
 * @param {number} points - Количество точек
 * @returns {object} { xValues, yValues }
 */
export function generateGraphData(compiled, xMin = -10, xMax = 10, points = 200) {
  const xValues = []
  const yValues = []
  const step = (xMax - xMin) / points

  for (let i = 0; i <= points; i++) {
    const x = xMin + i * step
    const y = evaluateAt(compiled, x)

    if (y !== null) {
      xValues.push(parseFloat(x.toFixed(4)))
      yValues.push(parseFloat(y.toFixed(4)))
    }
  }

  return { xValues, yValues }
}

/**
 * Автоматическое определение диапазона Y для графика
 * @param {array} yValues - Массив значений Y
 * @returns {object} { min, max }
 */
export function calculateYRange(yValues) {
  if (!yValues || yValues.length === 0) {
    return { min: -10, max: 10 }
  }

  const min = Math.min(...yValues)
  const max = Math.max(...yValues)
  const padding = (max - min) * 0.1 || 1

  return {
    min: min - padding,
    max: max + padding
  }
}
