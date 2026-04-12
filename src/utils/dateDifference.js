const DAY_MS = 24 * 60 * 60 * 1000

function parseDateParts(value) {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null

  return { year, month, day }
}

function parseLocalDate(value) {
  const parts = parseDateParts(value)
  if (!parts) return null

  const date = new Date(parts.year, parts.month - 1, parts.day)
  if (Number.isNaN(date.getTime())) return null

  if (
    date.getFullYear() !== parts.year ||
    date.getMonth() !== parts.month - 1 ||
    date.getDate() !== parts.day
  ) {
    return null
  }

  return date
}

function getUtcDayNumber(parts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day) / DAY_MS
}

function formatDateForLanguage(date, language) {
  return date.toLocaleDateString(language === 'en' ? 'en-US' : 'ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateTimeForLanguage(date, language) {
  return date.toLocaleString(language === 'en' ? 'en-US' : 'ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function pluralizeRu(number, one, few, many) {
  const mod10 = number % 10
  const mod100 = number % 100

  if (mod100 >= 11 && mod100 <= 19) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

function formatUnit(number, language, unit) {
  if (language === 'en') {
    return `${number} ${number === 1 ? unit.one : unit.many}`
  }

  return `${number} ${pluralizeRu(number, unit.one, unit.few, unit.many)}`
}

function countBusinessDays(startDayNumber, endDayNumber, includeEndDate) {
  const lastDay = includeEndDate ? endDayNumber : endDayNumber - 1
  let businessDays = 0

  for (let dayNumber = startDayNumber; dayNumber <= lastDay; dayNumber += 1) {
    const weekday = new Date(dayNumber * DAY_MS).getUTCDay()
    if (weekday !== 0 && weekday !== 6) {
      businessDays += 1
    }
  }

  return Math.max(0, businessDays)
}

function getWeekBreakdown(totalDays) {
  return {
    weeks: Math.floor(totalDays / 7),
    days: totalDays % 7,
  }
}

function getCalendarBreakdown(startParts, endParts, includeEndDate) {
  const start = new Date(startParts.year, startParts.month - 1, startParts.day)
  const end = new Date(endParts.year, endParts.month - 1, endParts.day)

  if (includeEndDate) {
    end.setDate(end.getDate() + 1)
  }

  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth()
  let days = end.getDate() - start.getDate()

  if (days < 0) {
    const previousMonth = new Date(end.getFullYear(), end.getMonth(), 0)
    days += previousMonth.getDate()
    months -= 1
  }

  if (months < 0) {
    months += 12
    years -= 1
  }

  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days) }
}

export function calculateDateDifference(startDate, endDate, options = {}) {
  const { includeEndDate = false, language = 'ru' } = options

  if (!startDate || !endDate) return null

  const startParts = parseDateParts(startDate)
  const endParts = parseDateParts(endDate)
  const start = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)

  if (!startParts || !endParts || !start || !end) return null

  const startDayNumber = getUtcDayNumber(startParts)
  const endDayNumber = getUtcDayNumber(endParts)

  if (endDayNumber < startDayNumber) {
    return { error: 'END_BEFORE_START' }
  }

  const differenceDays = endDayNumber - startDayNumber
  const calendarDays = differenceDays + (includeEndDate ? 1 : 0)
  const businessDays = countBusinessDays(startDayNumber, endDayNumber, includeEndDate)
  const weekendDays = Math.max(0, calendarDays - businessDays)
  const weekBreakdown = getWeekBreakdown(calendarDays)
  const calendarBreakdown = getCalendarBreakdown(startParts, endParts, includeEndDate)

  return {
    mode: 'days',
    includeEndDate,
    calendarDays,
    businessDays,
    weekendDays,
    weekBreakdown,
    calendarBreakdown,
    startDate: formatDateForLanguage(start, language),
    endDate: formatDateForLanguage(end, language),
    startRaw: startDate,
    endRaw: endDate,
  }
}

export function calculateTimeDifference(startDateTime, endDateTime, options = {}) {
  const { language = 'ru' } = options

  if (!startDateTime || !endDateTime) return null

  const start = new Date(startDateTime)
  const end = new Date(endDateTime)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null

  if (end < start) {
    return { error: 'END_BEFORE_START' }
  }

  const diffMs = end - start
  const days = Math.floor(diffMs / DAY_MS)
  const hours = Math.floor((diffMs % DAY_MS) / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

  return {
    mode: 'time',
    days,
    hours,
    minutes,
    seconds,
    totalMs: diffMs,
    totalHours: Math.floor(diffMs / (1000 * 60 * 60)),
    totalMinutes: Math.floor(diffMs / (1000 * 60)),
    startDate: formatDateTimeForLanguage(start, language),
    endDate: formatDateTimeForLanguage(end, language),
  }
}

export function calculateCountdown(targetDateTime, options = {}) {
  const { language = 'ru' } = options

  if (!targetDateTime) return null

  const target = new Date(targetDateTime)
  const now = new Date()

  if (Number.isNaN(target.getTime())) return null

  if (target < now) {
    return { error: 'EVENT_PASSED' }
  }

  const diffMs = target - now
  const days = Math.floor(diffMs / DAY_MS)
  const hours = Math.floor((diffMs % DAY_MS) / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

  return {
    mode: 'countdown',
    days,
    hours,
    minutes,
    seconds,
    totalMs: diffMs,
    targetDate: formatDateTimeForLanguage(target, language),
  }
}

export function formatDateDifference(diff, language = 'ru') {
  if (!diff || diff.error) return null

  const { calendarDays, weekBreakdown } = diff

  const dayUnit = language === 'en'
    ? { one: 'day', many: 'days' }
    : { one: 'день', few: 'дня', many: 'дней' }

  const weekUnit = language === 'en'
    ? { one: 'week', many: 'weeks' }
    : { one: 'неделя', few: 'недели', many: 'недель' }

  const parts = [formatUnit(calendarDays, language, dayUnit)]

  if (weekBreakdown.weeks > 0) {
    const weekText = formatUnit(weekBreakdown.weeks, language, weekUnit)
    const daysText = weekBreakdown.days > 0 ? formatUnit(weekBreakdown.days, language, dayUnit) : null
    parts.push(language === 'en'
      ? `${weekText}${daysText ? ` and ${daysText}` : ''}`
      : `${weekText}${daysText ? ` и ${daysText}` : ''}`)
  }

  return parts.join(language === 'en' ? ' · ' : ' · ')
}

export function formatTimeDifference(diff, language = 'ru') {
  if (!diff || diff.error) return null

  const units = language === 'en'
    ? {
        day: { one: 'day', many: 'days' },
        hour: { one: 'hour', many: 'hours' },
        minute: { one: 'minute', many: 'minutes' },
        second: { one: 'second', many: 'seconds' },
      }
    : {
        day: { one: 'день', few: 'дня', many: 'дней' },
        hour: { one: 'час', few: 'часа', many: 'часов' },
        minute: { one: 'минута', few: 'минуты', many: 'минут' },
        second: { one: 'секунда', few: 'секунды', many: 'секунд' },
      }

  const parts = []

  if (diff.days) parts.push(formatUnit(diff.days, language, units.day))
  if (diff.hours) parts.push(formatUnit(diff.hours, language, units.hour))
  if (diff.minutes) parts.push(formatUnit(diff.minutes, language, units.minute))
  if (diff.seconds || parts.length === 0) parts.push(formatUnit(diff.seconds, language, units.second))

  return parts.join(language === 'en' ? ' ' : ' ')
}
