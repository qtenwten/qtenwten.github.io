export function capitalizeFirst(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function getMinorDigits(num) {
  const parsed = parseFloat(num)
  if (Number.isNaN(parsed)) return '00'
  return String(Math.round((Math.abs(parsed) - Math.floor(Math.abs(parsed))) * 100)).padStart(2, '0')
}

export function getIntegerPart(num) {
  return Math.floor(parseFloat(num))
}

export function getMinorPart(num) {
  const parsed = parseFloat(num)
  const minor = Math.round((parsed - Math.floor(parsed)) * 100)
  return minor < 10 ? `0${minor}` : minor.toString()
}

export function formatCompactAmount(num, keepMinor = true, separator = '.') {
  const parsed = parseFloat(num)
  if (Number.isNaN(parsed)) return num

  if (!keepMinor) {
    return Math.floor(parsed).toString()
  }

  const fixed = parsed.toFixed(2)
  const [integerPart, minorPart] = fixed.split('.')

  return separator === ','
    ? `${integerPart},${minorPart}`
    : `${integerPart}.${minorPart}`
}

export function getCurrencyForms(curr, language = 'ru') {
  const forms = language === 'en'
    ? {
        RUB: { one: 'ruble', few: 'rubles', many: 'rubles', short: 'rub.' },
        USD: { one: 'dollar', few: 'dollars', many: 'dollars', short: '$' },
        EUR: { one: 'euro', few: 'euros', many: 'euros', short: '€' },
        KZT: { one: 'tenge', few: 'tenge', many: 'tenge', short: '₸' },
        CNY: { one: 'yuan', few: 'yuan', many: 'yuan', short: '¥' },
        UAH: { one: 'hryvnia', few: 'hryvnias', many: 'hryvnias', short: '₴' },
        BYN: { one: 'Belarusian ruble', few: 'Belarusian rubles', many: 'Belarusian rubles', short: 'Br' },
        UZS: { one: 'sum', few: 'sums', many: 'sums', short: "so'm" },
      }
    : {
        RUB: { one: 'рубль', few: 'рубля', many: 'рублей', short: 'руб.' },
        USD: { one: 'доллар', few: 'доллара', many: 'долларов', short: '$' },
        EUR: { one: 'евро', few: 'евро', many: 'евро', short: '€' },
        KZT: { one: 'тенге', few: 'тенге', many: 'тенге', short: '₸' },
        CNY: { one: 'юань', few: 'юаня', many: 'юаней', short: '¥' },
        UAH: { one: 'гривна', few: 'гривны', many: 'гривен', short: '₴' },
        BYN: { one: 'белорусский рубль', few: 'белорусских рубля', many: 'белорусских рублей', short: 'Br' },
        UZS: { one: 'сум', few: 'сума', many: 'сумов', short: "so'm" },
      }

  return forms[curr] || forms.RUB
}

export function getCurrencyWord(num, curr, language = 'ru') {
  const forms = getCurrencyForms(curr, language)
  const value = Math.abs(Number(num))
  const mod10 = value % 10
  const mod100 = value % 100

  if (language === 'en') {
    return value === 1 ? forms.one : forms.many
  }

  if (mod100 >= 11 && mod100 <= 19) return forms.many
  if (mod10 === 1) return forms.one
  if (mod10 >= 2 && mod10 <= 4) return forms.few
  return forms.many
}

export function getCurrencyShort(curr) {
  return getCurrencyForms(curr).short
}

export function pluralizeMinor(number, curr, language = 'ru') {
  const minorForms = language === 'en'
    ? {
        RUB: { one: 'копейка', few: 'копейки', many: 'копеек' },
        USD: { one: 'цент', few: 'цента', many: 'центов' },
        EUR: { one: 'цент', few: 'цента', many: 'центов' },
        KZT: { one: 'тиын', few: 'тиына', many: 'тиынов' },
        CNY: { one: 'фэнь', few: 'фэня', many: 'фэней' },
        UAH: { one: 'копейка', few: 'копейки', many: 'копеек' },
        BYN: { one: 'копейка', few: 'копейки', many: 'копеек' },
        UZS: { one: 'тийин', few: 'тийина', many: 'тийинов' },
      }
    : {
        RUB: { one: 'копейка', few: 'копейки', many: 'копеек' },
        USD: { one: 'цент', few: 'цента', many: 'центов' },
        EUR: { one: 'цент', few: 'цента', many: 'центов' },
        KZT: { one: 'тиын', few: 'тиына', many: 'тиынов' },
        CNY: { one: 'фэнь', few: 'фэня', many: 'фэней' },
        UAH: { one: 'копейка', few: 'копейки', many: 'копеек' },
        BYN: { one: 'копейка', few: 'копейки', many: 'копеек' },
        UZS: { one: 'тийин', few: 'тийина', many: 'тийинов' },
      }

  const forms = minorForms[curr] || minorForms.RUB
  const num = parseInt(number)
  const mod10 = num % 10
  const mod100 = num % 100

  if (language === 'en') {
    return num === 1 ? forms.one : forms.many
  }

  if (mod100 >= 11 && mod100 <= 19) return forms.many
  if (mod10 === 1) return forms.one
  if (mod10 >= 2 && mod10 <= 4) return forms.few
  return forms.many
}