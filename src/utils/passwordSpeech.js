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

const NATO_PHONETIC = {
  A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta',
  E: 'Echo', F: 'Foxtrot', G: 'Golf', H: 'Hotel',
  I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima',
  M: 'Mike', N: 'November', O: 'Oscar', P: 'Papa',
  Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango',
  U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'X-ray',
  Y: 'Yankee', Z: 'Zulu'
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
 * Describe a single character for speech with phonetic hint
 */
export function describePasswordChar(char, language) {
  const isRU = language === 'ru'

  if (char >= 'A' && char <= 'Z') {
    const phonetic = NATO_PHONETIC[char]
    return isRU
      ? `заглавная ${char}, как ${phonetic}`
      : `capital ${char} as in ${phonetic}`
  }

  if (char >= 'a' && char <= 'z') {
    const upperChar = char.toUpperCase()
    const phonetic = NATO_PHONETIC[upperChar]
    return isRU
      ? `маленькая ${char}, как ${phonetic}`
      : `lowercase ${char} as in ${phonetic}`
  }

  if (char >= '0' && char <= '9') {
    const digit = parseInt(char, 10)
    return isRU
      ? `цифра ${RU_DIGIT_NAMES[digit]}`
      : `digit ${EN_DIGIT_NAMES[digit]}`
  }

  const charNames = isRU ? RU_CHAR_NAMES : EN_CHAR_NAMES
  return charNames[char] || char
}

/**
 * Build complete speech text for a password with group repetition
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

  parts.push(isRU ? 'Повтор.' : 'Repeat.')
  parts.push(isRU ? 'Группа 1:' : 'Group 1:')

  chunks.forEach((chunk, index) => {
    const charDescriptions = chunk.split('').map(char => describePasswordChar(char, language))
    parts.push(charDescriptions.join('. '))
    if (index < chunks.length - 1) {
      parts.push(isRU ? `Группа ${index + 2}:` : `Group ${index + 2}:`)
    }
  })

  parts.push(isRU ? 'Конец пароля.' : 'End of password.')

  return parts.join(' ')
}

/**
 * Select best voice for given language
 */
export function selectBestVoice(language) {
  const voices = speechSynthesis.getVoices()
  if (!voices.length) return null

  const isRU = language === 'ru'

  if (isRU) {
    const ruVoice = voices.find(v => v.lang.startsWith('ru'))
    if (ruVoice) return ruVoice
    return voices[0]
  } else {
    const enUSVoice = voices.find(v => v.lang === 'en-US' || v.lang === 'en-GB')
    if (enUSVoice) return enUSVoice
    const enVoice = voices.find(v => v.lang.startsWith('en'))
    if (enVoice) return enVoice
    return voices[0]
  }
}

/**
 * Check if browser supports speech synthesis
 */
export function canUseSpeechSynthesis() {
  return typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
}