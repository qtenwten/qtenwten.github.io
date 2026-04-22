let parserModulePromise = null

function loadParserModule() {
  if (!parserModulePromise) {
    parserModulePromise = import('expr-eval')
  }

  return parserModulePromise
}

function normalizeExpression(expression) {
  return expression
    .replace(/\u00d7/g, '*')
    .replace(/\u00f7/g, '/')
    .replace(/\u2212/g, '-')
    .replace(/\blog\s*\(/gi, 'log10(')
    .replace(/(\d+(?:\.\d+)?|\))%/g, '($1/100)')
}

function createParser(Parser) {
  return new Parser({
    operators: {
      logical: false,
      comparison: false,
      assignment: false,
      in: false,
    },
  })
}

async function getConfiguredParser() {
  const { Parser } = await loadParserModule()
  const parser = createParser(Parser)

  parser.consts.pi = Math.PI
  parser.consts.e = Math.E
  parser.functions.log10 = (value) => Math.log10(value)
  parser.functions.ln = (value) => Math.log(value)

  return parser
}

export function preloadMathParser() {
  return loadParserModule()
}

export async function calculateExpression(expression) {
  try {
    if (!expression || !expression.trim()) {
      return { error: 'Введите выражение' }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const parser = await getConfiguredParser()
      const result = parser.evaluate(normalizeExpression(expression))
      clearTimeout(timeoutId)

      if (typeof result === 'number') {
        if (!isFinite(result)) {
          return { error: 'Результат вне допустимого диапазона' }
        }

        return { result: parseFloat(result.toFixed(10)) }
      }

      return { result: String(result) }
    } catch (innerErr) {
      clearTimeout(timeoutId)
      if (innerErr.name === 'AbortError' || innerErr.message?.includes('abort')) {
        return { error: 'Превышено время вычисления' }
      }
      return { error: 'Ошибка вычисления' }
    }
  } catch {
    return { error: 'Ошибка вычисления' }
  }
}

export async function compileFunction(expression) {
  try {
    if (!expression || !expression.trim()) {
      return { error: 'Введите функцию' }
    }

    const parser = await getConfiguredParser()
    const cleanExpr = normalizeExpression(expression.replace(/^y\s*=\s*/i, '').trim())
    const parsed = parser.parse(cleanExpr)

    return {
      compiled: {
        evaluate(scope) {
          return parsed.evaluate({
            pi: Math.PI,
            e: Math.E,
            ...scope,
          })
        },
      },
    }
  } catch {
    return { error: 'Некорректная функция' }
  }
}

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
