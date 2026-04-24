/**
 * Text-to-speech utilities for password dictation
 */

/**
 * Chunk password into groups of specified size
 */
export function chunkPassword(password, size = 4) {
  const chunks = []
  for (let i = 0; i < password.length; i += size) {
    chunks.push(password.slice(i, i + size))
  }
  return chunks
}

const RU_CHAR_NAMES = {
  '!': 'восклицательный знак',
  '@': 'собака',
  '#': 'решётка',
  '$': 'доллар',
  '%': 'процент',
  '^': 'крышка',
  '&': 'амперсанд',
  '*': 'звёздочка',
  '(': 'открывающая скобка',
  ')': 'закрывающая скобка',
  '_': 'нижнее подчёркивание',
  '+': 'плюс',
  '=': 'равно',
  '[': 'открывающая квадратная скобка',
  ']': 'закрывающая квадратная скобка',
  '{': 'открывающая фигурная скобка',
  '}': 'закрывающая фигурная скобка',
  '|': 'вертикальная черта',
  ';': 'точка с запятой',
  ':': 'двоеточие',
  ',': 'запятая',
  '.': 'точка',
  '<': 'меньше',
  '>': 'больше',
  '?': 'вопросительный знак'
}

const EN_CHAR_NAMES = {
  '!': 'exclamation mark',
  '@': 'at sign',
  '#': 'hash',
  '$': 'dollar sign',
  '%': 'percent sign',
  '^': 'caret',
  '&': 'ampersand',
  '*': 'asterisk',
  '(': 'left parenthesis',
  ')': 'right parenthesis',
  '_': 'underscore',
  '+': 'plus',
  '=': 'equals',
  '[': 'left square bracket',
  ']': 'right square bracket',
  '{': 'left curly brace',
  '}': 'right curly brace',
  '|': 'vertical bar',
  ';': 'semicolon',
  ':': 'colon',
  ',': 'comma',
  '.': 'period',
  '<': 'less than',
  '>': 'greater than',
  '?': 'question mark'
}

const RU_DIGIT_NAMES = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять']
const EN_DIGIT_NAMES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']

/**
 * Describe a single character for speech
 */
export function describePasswordChar(char, language) {
  const isRU = language === 'ru'

  if (char >= 'A' && char <= 'Z') {
    return isRU ? `заглавная ${char}` : `capital ${char}`
  }

  if (char >= 'a' && char <= 'z') {
    return isRU ? `маленькая ${char}` : `lowercase ${char}`
  }

  if (char >= '0' && char <= '9') {
    const digit = parseInt(char, 10)
    return isRU ? `цифра ${RU_DIGIT_NAMES[digit]}` : `digit ${EN_DIGIT_NAMES[digit]}`
  }

  const charNames = isRU ? RU_CHAR_NAMES : EN_CHAR_NAMES
  return charNames[char] || char
}

/**
 * Build complete speech text for a password
 */
export function buildPasswordSpeechText(rawPassword, language) {
  const isRU = language === 'ru'
  const chunks = chunkPassword(rawPassword, 4)

  const parts = []

  parts.push(isRU ? 'Пароль.' : 'Password.')

  chunks.forEach((chunk, index) => {
    const groupNum = index + 1
    parts.push(isRU ? `Группа ${groupNum}:` : `Group ${groupNum}:`)

    const charDescriptions = chunk.split('').map(char => describePasswordChar(char, language))
    parts.push(charDescriptions.join('. '))

    if (index < chunks.length - 1) {
      parts.push(isRU ? 'Пауза.' : 'Pause.')
    }
  })

  parts.push(isRU ? 'Конец пароля.' : 'End of password.')

  return parts.join(' ')
}

/**
 * Check if browser supports speech synthesis
 */
export function canUseSpeechSynthesis() {
  return typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
}