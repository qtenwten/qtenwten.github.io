import { Parser } from 'expr-eval'

function normalizeExpression(expression) {
  return expression
    .replace(/\u00d7/g, '*')
    .replace(/\u00f7/g, '/')
    .replace(/\u2212/g, '-')
    .replace(/(\d+(?:\.\d+)?|\))%/g, '($1/100)')
}

function createParser() {
  return new Parser({
    operators: {
      logical: false,
      comparison: false,
      assignment: false,
      in: false,
    },
  })
}

const parser = createParser()
parser.consts.pi = Math.PI
parser.consts.e = Math.E
parser.functions.log10 = (value) => Math.log10(value)
parser.functions.ln = (value) => Math.log(value)

export function calculate(expression) {
  if (!expression || typeof expression !== 'string') {
    return { error: 'Некорректное выражение' }
  }

  try {
    const sanitized = expression.replace(/[^0-9+\-*/.()%\sEDed]/g, '').trim()

    if (!sanitized) {
      return { error: 'Некорректное выражение' }
    }

    if (/[^0-9+\-*/.()%\sEDed]/.test(expression)) {
      return { error: 'Ошибка вычисления' }
    }

    const result = parser.evaluate(normalizeExpression(sanitized))

    if (result === undefined || result === null) {
      return { error: 'Ошибка вычисления' }
    }

    if (!Number.isFinite(result)) {
      if (result === Infinity || result === -Infinity) {
        const divisionByZeroRegex = /\/\s*0+(\.0*)?(?=\D|$)/
        if (divisionByZeroRegex.test(sanitized)) {
          return { error: 'Деление на ноль' }
        }
      }
      return { error: 'Результат вне допустимого диапазона' }
    }

    if (typeof result !== 'number' || Number.isNaN(result)) {
      return { error: 'Ошибка вычисления' }
    }

    return { result: parseFloat(result.toFixed(10)) }
  } catch {
    return { error: 'Ошибка вычисления' }
  }
}

export function calculatePercentage(base, percent) {
  const baseNum = parseFloat(base)
  const percentNum = parseFloat(percent)

  if (isNaN(baseNum) || isNaN(percentNum)) {
    return { error: 'Некорректные числа' }
  }

  const result = (baseNum * percentNum) / 100
  return { result: parseFloat(result.toFixed(10)) }
}