/**
 * Безопасный генератор паролей с использованием crypto.getRandomValues
 */

const CHAR_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
}

const SIMILAR_CHARS = '0Ool1I'

/**
 * Генерация криптографически безопасного случайного числа
 */
function getSecureRandomInt(max) {
  const randomBuffer = new Uint32Array(1)
  crypto.getRandomValues(randomBuffer)
  return randomBuffer[0] % max
}

/**
 * Перемешивание массива (Fisher-Yates shuffle)
 */
function shuffleArray(array) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Генерация пароля
 */
export function generatePassword(options) {
  const {
    length = 16,
    lowercase = true,
    uppercase = true,
    numbers = true,
    symbols = false,
    excludeSimilar = false,
    excludeChars = ''
  } = options

  // Собираем набор символов
  let charset = ''
  if (lowercase) charset += CHAR_SETS.lowercase
  if (uppercase) charset += CHAR_SETS.uppercase
  if (numbers) charset += CHAR_SETS.numbers
  if (symbols) charset += CHAR_SETS.symbols

  // Исключаем похожие символы
  if (excludeSimilar) {
    charset = charset.split('').filter(char => !SIMILAR_CHARS.includes(char)).join('')
  }

  // Исключаем пользовательские символы
  if (excludeChars) {
    charset = charset.split('').filter(char => !excludeChars.includes(char)).join('')
  }

  if (charset.length === 0) {
    return { error: 'Выберите хотя бы один тип символов' }
  }

  if (length < 6 || length > 64) {
    return { error: 'Длина должна быть от 6 до 64 символов' }
  }

  // Генерируем пароль
  let password = ''
  const charArray = charset.split('')

  // Гарантируем наличие хотя бы одного символа каждого выбранного типа
  const requiredChars = []
  if (lowercase) requiredChars.push(CHAR_SETS.lowercase[getSecureRandomInt(CHAR_SETS.lowercase.length)])
  if (uppercase) requiredChars.push(CHAR_SETS.uppercase[getSecureRandomInt(CHAR_SETS.uppercase.length)])
  if (numbers) requiredChars.push(CHAR_SETS.numbers[getSecureRandomInt(CHAR_SETS.numbers.length)])
  if (symbols) requiredChars.push(CHAR_SETS.symbols[getSecureRandomInt(CHAR_SETS.symbols.length)])

  // Добавляем обязательные символы
  for (const char of requiredChars) {
    password += char
  }

  // Заполняем оставшуюся длину
  for (let i = password.length; i < length; i++) {
    const randomIndex = getSecureRandomInt(charArray.length)
    password += charArray[randomIndex]
  }

  // Перемешиваем символы
  password = shuffleArray(password.split('')).join('')

  return { password }
}

/**
 * Оценка силы пароля
 */
export function calculatePasswordStrength(password) {
  if (!password) return { score: 0, label: 'Очень слабый', color: '#ef4444' }

  let score = 0

  // Длина
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Разнообразие символов
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  // Определяем уровень
  if (score <= 2) return { score: 1, label: 'Слабый', color: '#ef4444' }
  if (score <= 4) return { score: 2, label: 'Средний', color: '#f59e0b' }
  if (score <= 6) return { score: 3, label: 'Сильный', color: '#10b981' }
  return { score: 4, label: 'Очень сильный', color: '#059669' }
}
