import { evaluate, compile } from 'mathjs'

/**
 * Безопасное вычисление математического выражения
 * @param {string} expression - Математическое выражение
 * @returns {object} { result, error }
 */
export function calculateExpression(expression) {
  try {
    if (!expression || !expression.trim()) {
      return { error: 'Введите выражение' }
    }

    const result = evaluate(expression)

    if (typeof result === 'number') {
      if (!isFinite(result)) {
        return { error: 'Результат вне допустимого диапазона' }
      }
      return { result: parseFloat(result.toFixed(10)) }
    }

    // Если результат не число (например, комплексное число)
    return { result: result.toString() }
  } catch (error) {
    return { error: 'Ошибка вычисления' }
  }
}

/**
 * Компиляция функции для построения графика
 * @param {string} expression - Функция от x (например: "x^2", "sin(x)")
 * @returns {object} { compiled, error }
 */
export function compileFunction(expression) {
  try {
    if (!expression || !expression.trim()) {
      return { error: 'Введите функцию' }
    }

    // Убираем "y =" если есть
    let cleanExpr = expression.replace(/^y\s*=\s*/i, '').trim()

    const compiled = compile(cleanExpr)
    return { compiled }
  } catch (error) {
    return { error: 'Некорректная функция' }
  }
}

/**
 * Вычисление значения функции в точке
 * @param {object} compiled - Скомпилированная функция
 * @param {number} x - Значение x
 * @returns {number|null} Значение y или null если ошибка
 */
export function evaluateAt(compiled, x) {
  try {
    const result = compiled.evaluate({ x })
    if (typeof result === 'number' && isFinite(result)) {
      return result
    }
    return null
  } catch {
    return null
  }
}
