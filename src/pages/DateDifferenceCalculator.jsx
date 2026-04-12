import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useSearchParams } from 'react-router-dom'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import Icon from '../components/Icon'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import { ResultSection, ResultSummary, ResultMetrics, ResultMetric } from '../components/ResultSection'
import {
  calculateDateDifference,
  calculateTimeDifference,
  calculateCountdown,
  formatDateDifference,
  formatTimeDifference,
} from '../utils/dateDifference'
import './DateDifferenceCalculator.css'

function formatDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateTimeInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(date, months) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function addYears(date, years) {
  const next = new Date(date)
  next.setFullYear(next.getFullYear() + years)
  return next
}

function DateDifferenceCalculator() {
  const { t, language } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()

  const copy = language === 'en'
    ? {
        eyebrow: 'Date Tools',
        title: 'Date Difference Calculator',
        subtitle: 'Calculate calendar days, business days, time differences, or a countdown without extra steps.',
        intro: 'Choose the dates you want to compare, and the tool will instantly show the result in a clear, practical format.',
        modeLabel: 'What do you want to calculate?',
        modeDays: 'Days between dates',
        modeTime: 'Date & time difference',
        modeCountdown: 'Countdown to a date',
        startDate: 'Start date',
        endDate: 'End date',
        startDateTime: 'Start date and time',
        endDateTime: 'End date and time',
        targetDateTime: 'Target date and time',
        placeholders: {
          startDate: 'Select the first date',
          endDate: 'Select the second date',
          startDateTime: 'Choose the starting date and time',
          endDateTime: 'Choose the ending date and time',
          targetDateTime: 'Choose the event date and time',
        },
        quickActionsTitle: 'Quick actions',
        clear: 'Clear',
        swap: 'Swap dates',
        today: 'Today',
        toToday: 'Up to today',
        next7Days: 'Next 7 days',
        next30Days: 'Next 30 days',
        nextYear: 'Next year',
        nextHour: 'Next 1 hour',
        next3Hours: 'Next 3 hours',
        tomorrowMorning: 'Tomorrow 9:00 AM',
        advancedTitle: 'Advanced options',
        includeEndDate: 'Include the end date in the total',
        businessDaysHint: 'Business days are calculated as Monday–Friday and do not account for public holidays.',
        resultTitle: 'Result',
        emptyDaysTitle: 'Pick two dates to compare',
        emptyDaysText: 'You will instantly see calendar days, business days, weekend days, and a helpful breakdown in weeks, months, and years.',
        emptyTimeTitle: 'Compare exact date and time values',
        emptyTimeText: 'Use this mode when you need the difference in days, hours, minutes, and seconds.',
        emptyCountdownTitle: 'Set a future date for a live countdown',
        emptyCountdownText: 'This mode is useful for launches, deadlines, events, and important reminders.',
        errors: {
          endBeforeStart: 'The end date must be later than the start date.',
          invalidDate: 'Please enter a valid date.',
          eventPassed: 'That date has already passed. Choose a future date to run a countdown.',
        },
        resultLabels: {
          betweenDates: (value) => `Between the dates: ${value}`,
          calendarDays: 'Calendar days',
          businessDays: 'Business days',
          weekendDays: 'Weekend days',
          weeksAndDays: 'Weeks and days',
          monthsYears: 'Months and years',
          includesEndDate: 'Includes the end date',
          exactDifference: 'Exact time difference',
          totalHours: 'Total hours',
          totalMinutes: 'Total minutes',
          countdownHeadline: 'Time left until the event',
          targetDate: 'Target date',
        },
        copySummary: 'Copy summary',
        infoEyebrow: 'Helpful guide',
        faqTitle: 'FAQ',
      }
    : {
        eyebrow: 'Калькулятор дат',
        title: 'Калькулятор дней между датами',
        subtitle: 'Считайте календарные и рабочие дни, точную разницу по времени и обратный отсчёт без лишних действий.',
        intro: 'Выберите две даты или будущую дату события — результат появится сразу и будет понятен без дополнительных пояснений.',
        modeLabel: 'Что нужно посчитать?',
        modeDays: 'Дни между датами',
        modeTime: 'Разница даты и времени',
        modeCountdown: 'Обратный отсчёт',
        startDate: 'Дата начала',
        endDate: 'Дата окончания',
        startDateTime: 'Дата и время начала',
        endDateTime: 'Дата и время окончания',
        targetDateTime: 'Дата и время события',
        placeholders: {
          startDate: 'Выберите начальную дату',
          endDate: 'Выберите конечную дату',
          startDateTime: 'Выберите начальную дату и время',
          endDateTime: 'Выберите конечную дату и время',
          targetDateTime: 'Выберите дату и время события',
        },
        quickActionsTitle: 'Быстрые действия',
        clear: 'Очистить',
        swap: 'Поменять даты местами',
        today: 'Сегодня',
        toToday: 'До сегодня',
        next7Days: 'Следующие 7 дней',
        next30Days: 'Следующие 30 дней',
        nextYear: 'Следующий год',
        nextHour: 'Следующий час',
        next3Hours: 'Следующие 3 часа',
        tomorrowMorning: 'Завтра в 09:00',
        advancedTitle: 'Дополнительные настройки',
        includeEndDate: 'Включать конечную дату в итог',
        businessDaysHint: 'Рабочие дни считаются по будням (понедельник–пятница) и не учитывают праздники.',
        resultTitle: 'Результат',
        emptyDaysTitle: 'Выберите две даты',
        emptyDaysText: 'Инструмент сразу покажет календарные дни, рабочие дни, выходные, а также удобную разбивку по неделям, месяцам и годам.',
        emptyTimeTitle: 'Сравните точные дату и время',
        emptyTimeText: 'Этот режим нужен, когда важна разница не только в днях, но и в часах, минутах и секундах.',
        emptyCountdownTitle: 'Задайте будущую дату',
        emptyCountdownText: 'Режим обратного отсчёта удобен для дедлайнов, отпусков, запусков и любых важных событий.',
        errors: {
          endBeforeStart: 'Дата окончания должна быть позже даты начала.',
          invalidDate: 'Введите корректную дату.',
          eventPassed: 'Эта дата уже прошла. Выберите будущий момент для обратного отсчёта.',
        },
        resultLabels: {
          betweenDates: (value) => `Между датами: ${value}`,
          calendarDays: 'Календарных дней',
          businessDays: 'Рабочих дней',
          weekendDays: 'Выходных дней',
          weeksAndDays: 'Это',
          monthsYears: 'По месяцам и годам',
          includesEndDate: 'Конечная дата включена',
          exactDifference: 'Точная разница',
          totalHours: 'Всего часов',
          totalMinutes: 'Всего минут',
          countdownHeadline: 'До события осталось',
          targetDate: 'Дата события',
        },
        copySummary: 'Скопировать итог',
        infoEyebrow: 'Полезная информация',
        faqTitle: 'FAQ',
      }

  const [mode, setMode] = useState(searchParams.get('mode') || 'days')
  const [includeEndDate, setIncludeEndDate] = useState(searchParams.get('includeEnd') === '1')
  const [startDate, setStartDate] = useState(searchParams.get('from') || '')
  const [endDate, setEndDate] = useState(searchParams.get('to') || '')
  const [startDateTime, setStartDateTime] = useState(searchParams.get('fromTime') || '')
  const [endDateTime, setEndDateTime] = useState(searchParams.get('toTime') || '')
  const [targetDateTime, setTargetDateTime] = useState(searchParams.get('target') || '')
  const [countdown, setCountdown] = useState(null)
  const [countdownError, setCountdownError] = useState('')

  const faqItems = t('dateDifference.info.faqTitle')
    ? [
        { q: t('dateDifference.info.faqList.q1'), a: t('dateDifference.info.faqList.a1') },
        { q: t('dateDifference.info.faqList.q2'), a: t('dateDifference.info.faqList.a2') },
        { q: t('dateDifference.info.faqList.q3'), a: t('dateDifference.info.faqList.a3') },
        { q: t('dateDifference.info.faqList.q4'), a: t('dateDifference.info.faqList.a4') },
      ]
    : []

  const dayResult = useMemo(() => {
    if (mode !== 'days' || !startDate || !endDate) return null
    return calculateDateDifference(startDate, endDate, { includeEndDate, language })
  }, [mode, startDate, endDate, includeEndDate, language])

  const timeResult = useMemo(() => {
    if (mode !== 'time' || !startDateTime || !endDateTime) return null
    return calculateTimeDifference(startDateTime, endDateTime, { language })
  }, [mode, startDateTime, endDateTime, language])

  useEffect(() => {
    if (mode !== 'countdown' || !targetDateTime) {
      setCountdown(null)
      setCountdownError('')
      return
    }

    const updateCountdown = () => {
      const countdownResult = calculateCountdown(targetDateTime, { language })

      if (!countdownResult) {
        setCountdown(null)
        setCountdownError(copy.errors.invalidDate)
        return
      }

      if (countdownResult.error === 'EVENT_PASSED') {
        setCountdown(null)
        setCountdownError(copy.errors.eventPassed)
        return
      }

      setCountdown(countdownResult)
      setCountdownError('')
    }

    updateCountdown()
    const interval = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(interval)
  }, [mode, targetDateTime, language])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('mode', mode)

    if (mode === 'days') {
      if (startDate) params.set('from', startDate)
      if (endDate) params.set('to', endDate)
      if (includeEndDate) params.set('includeEnd', '1')
    }

    if (mode === 'time') {
      if (startDateTime) params.set('fromTime', startDateTime)
      if (endDateTime) params.set('toTime', endDateTime)
    }

    if (mode === 'countdown' && targetDateTime) {
      params.set('target', targetDateTime)
    }

    setSearchParams(params, { replace: true })
  }, [mode, includeEndDate, startDate, endDate, startDateTime, endDateTime, targetDateTime, setSearchParams])

  const activeError = useMemo(() => {
    if (mode === 'days') {
      if (dayResult?.error === 'END_BEFORE_START') return copy.errors.endBeforeStart
      if (dayResult === null && startDate && endDate) return copy.errors.invalidDate
      return ''
    }

    if (mode === 'time') {
      if (timeResult?.error === 'END_BEFORE_START') return copy.errors.endBeforeStart
      if (timeResult === null && startDateTime && endDateTime) return copy.errors.invalidDate
      return ''
    }

    return countdownError
  }, [mode, dayResult, timeResult, countdownError, copy.errors, startDate, endDate, startDateTime, endDateTime])

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
  }

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    setStartDateTime('')
    setEndDateTime('')
    setTargetDateTime('')
    setCountdown(null)
    setCountdownError('')
    setIncludeEndDate(false)
  }

  const swapDates = () => {
    if (mode === 'days') {
      setStartDate(endDate)
      setEndDate(startDate)
      return
    }

    if (mode === 'time') {
      setStartDateTime(endDateTime)
      setEndDateTime(startDateTime)
    }
  }

  const applyQuickAction = (action) => {
    const now = new Date()

    if (mode === 'days') {
      if (action === 'today') {
        const today = formatDateInput(now)
        setStartDate(today)
        setEndDate(today)
        return
      }

      if (action === 'toToday') {
        const today = formatDateInput(now)
        setEndDate(today)
        if (!startDate) setStartDate(today)
        return
      }

      const start = new Date(now)
      let end = new Date(now)

      if (action === '7days') end = addDays(now, 7)
      if (action === '30days') end = addDays(now, 30)
      if (action === '1year') end = addYears(now, 1)

      setStartDate(formatDateInput(start))
      setEndDate(formatDateInput(end))
      return
    }

    if (mode === 'time') {
      const start = new Date(now)
      let end = new Date(now)

      if (action === '1hour') end.setHours(end.getHours() + 1)
      if (action === '3hours') end.setHours(end.getHours() + 3)
      if (action === 'tomorrowMorning') {
        end = addDays(now, 1)
        end.setHours(9, 0, 0, 0)
      }
      if (action === '7days') end = addDays(now, 7)

      setStartDateTime(formatDateTimeInput(start))
      setEndDateTime(formatDateTimeInput(end))
      return
    }

    if (mode === 'countdown') {
      let target = new Date(now)

      if (action === '1hour') target.setHours(target.getHours() + 1)
      if (action === 'tomorrowMorning') {
        target = addDays(now, 1)
        target.setHours(9, 0, 0, 0)
      }
      if (action === '7days') target = addDays(now, 7)
      if (action === '30days') target = addMonths(now, 1)
      if (action === '1year') target = addYears(now, 1)

      setTargetDateTime(formatDateTimeInput(target))
    }
  }

  const dayCopyText = useMemo(() => {
    if (!dayResult || dayResult.error) return ''
    const summary = `${copy.resultLabels.betweenDates(formatDateDifference(dayResult, language))}`
    const calendar = `${copy.resultLabels.calendarDays}: ${dayResult.calendarDays}`
    const business = `${copy.resultLabels.businessDays}: ${dayResult.businessDays}`
    return [summary, calendar, business].join('\n')
  }, [dayResult, language, copy.resultLabels])

  const timeCopyText = useMemo(() => {
    if (!timeResult || timeResult.error) return ''
    return `${copy.resultLabels.exactDifference}: ${formatTimeDifference(timeResult, language)}`
  }, [timeResult, language, copy.resultLabels])

  const renderDaysResult = () => {
    if (!startDate || !endDate) {
      return (
        <div className="date-diff-placeholder">
          <h2>{copy.emptyDaysTitle}</h2>
          <p>{copy.emptyDaysText}</p>
        </div>
      )
    }

    if (activeError) {
      return <div className="date-diff-inline-error">{activeError}</div>
    }

    if (!dayResult) return null

    return (
      <ResultSection tone="success" className="date-diff-result-card">
        <ResultSummary
          kicker={copy.resultTitle}
          title={copy.resultLabels.betweenDates(formatDateDifference(dayResult, language))}
          description={`${dayResult.startDate} - ${dayResult.endDate}`}
          actions={<CopyButton text={dayCopyText} />}
        />

        <ResultMetrics columns={2}>
          <ResultMetric label={copy.resultLabels.calendarDays} value={dayResult.calendarDays} />
          <ResultMetric label={copy.resultLabels.businessDays} value={dayResult.businessDays} />
          <ResultMetric label={copy.resultLabels.weekendDays} value={dayResult.weekendDays} />
          <ResultMetric
            label={copy.resultLabels.weeksAndDays}
            value={
              dayResult.weekBreakdown.weeks > 0
                ? `${dayResult.weekBreakdown.weeks} ${language === 'en' ? 'wk' : 'нед.'}${dayResult.weekBreakdown.days ? ` ${dayResult.weekBreakdown.days} ${language === 'en' ? 'd' : 'д.'}` : ''}`
                : `${dayResult.weekBreakdown.days} ${language === 'en' ? 'days' : 'дней'}`
            }
          />
        </ResultMetrics>

        <div className="date-diff-summary-grid">
          <div className="surface-panel surface-panel--subtle">
            <h3>{copy.resultLabels.monthsYears}</h3>
            <p>
              {language === 'en'
                ? `${dayResult.calendarBreakdown.years} years, ${dayResult.calendarBreakdown.months} months, ${dayResult.calendarBreakdown.days} days`
                : `${dayResult.calendarBreakdown.years} лет, ${dayResult.calendarBreakdown.months} месяцев, ${dayResult.calendarBreakdown.days} дней`}
            </p>
          </div>
          <div className="surface-panel surface-panel--subtle">
            <h3>{copy.resultLabels.includesEndDate}</h3>
            <p>{includeEndDate ? (language === 'en' ? 'Yes' : 'Да') : (language === 'en' ? 'No' : 'Нет')}</p>
          </div>
        </div>
      </ResultSection>
    )
  }

  const renderTimeResult = () => {
    if (!startDateTime || !endDateTime) {
      return (
        <div className="date-diff-placeholder">
          <h2>{copy.emptyTimeTitle}</h2>
          <p>{copy.emptyTimeText}</p>
        </div>
      )
    }

    if (activeError) {
      return <div className="date-diff-inline-error">{activeError}</div>
    }

    if (!timeResult) return null

    return (
      <ResultSection tone="success" className="date-diff-result-card">
        <ResultSummary
          kicker={copy.resultTitle}
          title={`${copy.resultLabels.exactDifference}: ${formatTimeDifference(timeResult, language)}`}
          description={`${timeResult.startDate} - ${timeResult.endDate}`}
          actions={<CopyButton text={timeCopyText} />}
        />

        <ResultMetrics columns={2}>
          <ResultMetric label={language === 'en' ? 'Days' : 'Дни'} value={timeResult.days} />
          <ResultMetric label={language === 'en' ? 'Hours' : 'Часы'} value={timeResult.hours} />
          <ResultMetric label={language === 'en' ? 'Minutes' : 'Минуты'} value={timeResult.minutes} />
          <ResultMetric label={language === 'en' ? 'Seconds' : 'Секунды'} value={timeResult.seconds} />
        </ResultMetrics>

        <div className="date-diff-summary-grid">
          <div className="surface-panel surface-panel--subtle">
            <h3>{copy.resultLabels.totalHours}</h3>
            <p>{timeResult.totalHours}</p>
          </div>
          <div className="surface-panel surface-panel--subtle">
            <h3>{copy.resultLabels.totalMinutes}</h3>
            <p>{timeResult.totalMinutes}</p>
          </div>
        </div>
      </ResultSection>
    )
  }

  const renderCountdownResult = () => {
    if (!targetDateTime) {
      return (
        <div className="date-diff-placeholder">
          <h2>{copy.emptyCountdownTitle}</h2>
          <p>{copy.emptyCountdownText}</p>
        </div>
      )
    }

    if (activeError) {
      return <div className="date-diff-inline-error">{activeError}</div>
    }

    if (!countdown) return null

    return (
      <ResultSection tone="accent" className="date-diff-result-card is-countdown">
        <ResultSummary
          kicker={copy.resultTitle}
          title={copy.resultLabels.countdownHeadline}
          description={countdown.targetDate}
        />

        <ResultMetrics columns={4} className="date-diff-countdown-grid">
          <ResultMetric className="date-diff-countdown-card" label={language === 'en' ? 'Days' : 'Дни'} value={countdown.days} />
          <ResultMetric className="date-diff-countdown-card" label={language === 'en' ? 'Hours' : 'Часы'} value={String(countdown.hours).padStart(2, '0')} />
          <ResultMetric className="date-diff-countdown-card" label={language === 'en' ? 'Minutes' : 'Минуты'} value={String(countdown.minutes).padStart(2, '0')} />
          <ResultMetric className="date-diff-countdown-card" label={language === 'en' ? 'Seconds' : 'Секунды'} value={String(countdown.seconds).padStart(2, '0')} />
        </ResultMetrics>

        <div className="date-diff-summary-grid">
          <div className="surface-panel surface-panel--subtle">
            <h3>{copy.resultLabels.targetDate}</h3>
            <p>{countdown.targetDate}</p>
          </div>
        </div>
      </ResultSection>
    )
  }

  const renderQuickActions = () => {
    const actions = mode === 'days'
      ? [
          { key: 'today', label: copy.today },
          { key: 'toToday', label: copy.toToday },
          { key: '7days', label: copy.next7Days },
          { key: '30days', label: copy.next30Days },
          { key: '1year', label: copy.nextYear },
          { key: 'swap', label: copy.swap },
        ]
      : mode === 'time'
        ? [
            { key: '1hour', label: copy.nextHour },
            { key: '3hours', label: copy.next3Hours },
            { key: 'tomorrowMorning', label: copy.tomorrowMorning },
            { key: '7days', label: copy.next7Days },
            { key: 'swap', label: copy.swap },
          ]
        : [
            { key: '1hour', label: copy.nextHour },
            { key: 'tomorrowMorning', label: copy.tomorrowMorning },
            { key: '7days', label: copy.next7Days },
            { key: '30days', label: copy.next30Days },
            { key: '1year', label: copy.nextYear },
          ]

    return (
      <div className="date-diff-quick-actions">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            className="secondary date-diff-chip"
            onClick={() => (action.key === 'swap' ? swapDates() : applyQuickAction(action.key))}
          >
            {action.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <>
      <SEO
        title={t('seo.dateDifference.title')}
        description={t('seo.dateDifference.description')}
        path={`/${language}/date-difference`}
        keywords={t('seo.dateDifference.keywords')}
      />

      <div className="tool-container date-diff-page">
        <div className="date-diff-hero">
          <div className="date-diff-eyebrow">{copy.eyebrow}</div>
          <h1><Icon name="calendar_month" size={24} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />{copy.title}</h1>
          <p>{copy.subtitle}</p>
          <p className="date-diff-hero-note">{copy.intro}</p>
        </div>

        <div className="date-diff-layout">
          <section className="date-diff-card date-diff-card--controls">
            <div className="field">
              <label>{copy.modeLabel}</label>
              <div className="date-diff-mode-switcher">
                <button type="button" className={mode === 'days' ? '' : 'secondary'} onClick={() => handleModeChange('days')}>{copy.modeDays}</button>
                <button type="button" className={mode === 'time' ? '' : 'secondary'} onClick={() => handleModeChange('time')}>{copy.modeTime}</button>
                <button type="button" className={mode === 'countdown' ? '' : 'secondary'} onClick={() => handleModeChange('countdown')}>{copy.modeCountdown}</button>
              </div>
            </div>

            {mode === 'days' && (
              <div className="date-diff-fields-grid">
                <div className="field">
                  <label htmlFor="startDate">{copy.startDate}</label>
                  <input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="endDate">{copy.endDate}</label>
                  <input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            )}

            {mode === 'time' && (
              <div className="date-diff-fields-grid">
                <div className="field">
                  <label htmlFor="startDateTime">{copy.startDateTime}</label>
                  <input id="startDateTime" type="datetime-local" value={startDateTime} onChange={(e) => setStartDateTime(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="endDateTime">{copy.endDateTime}</label>
                  <input id="endDateTime" type="datetime-local" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)} />
                </div>
              </div>
            )}

            {mode === 'countdown' && (
              <div className="field">
                <label htmlFor="targetDateTime">{copy.targetDateTime}</label>
                <input id="targetDateTime" type="datetime-local" value={targetDateTime} onChange={(e) => setTargetDateTime(e.target.value)} />
              </div>
            )}

            <div>
              <label className="date-diff-section-label">{copy.quickActionsTitle}</label>
              {renderQuickActions()}
            </div>

            {mode === 'days' && (
              <details className="date-diff-advanced">
                <summary>{copy.advancedTitle}</summary>
                <label className="date-diff-checkbox">
                  <input
                    type="checkbox"
                    checked={includeEndDate}
                    onChange={(e) => setIncludeEndDate(e.target.checked)}
                  />
                  <span>{copy.includeEndDate}</span>
                </label>
                <p className="date-diff-helper-text">{copy.businessDaysHint}</p>
              </details>
            )}

            <div className="date-diff-actions-row">
              <button type="button" className="secondary" onClick={handleClear}>{copy.clear}</button>
            </div>
          </section>

          <section className="date-diff-card date-diff-card--result">
            {mode === 'days' && renderDaysResult()}
            {mode === 'time' && renderTimeResult()}
            {mode === 'countdown' && renderCountdownResult()}
          </section>
        </div>

        <ToolDescriptionSection eyebrow={copy.infoEyebrow}>
          <h2>{t('dateDifference.info.title')}</h2>
          <p>{t('dateDifference.info.description')}</p>

          <h3>{t('dateDifference.info.useCasesTitle')}</h3>
          <ul>
            <li>{t('dateDifference.info.useCases.vacation')}</li>
            <li>{t('dateDifference.info.useCases.project')}</li>
            <li>{t('dateDifference.info.useCases.age')}</li>
            <li>{t('dateDifference.info.useCases.event')}</li>
            <li>{t('dateDifference.info.useCases.deadline')}</li>
          </ul>

          <h3>{t('dateDifference.info.howToTitle')}</h3>
          <ol>
            <li>{t('dateDifference.info.howTo.step1')}</li>
            <li>{t('dateDifference.info.howTo.step2')}</li>
            <li>{t('dateDifference.info.howTo.step3')}</li>
          </ol>

          <ToolFaq title={copy.faqTitle} items={faqItems} />
        </ToolDescriptionSection>

        <RelatedTools currentPath={`/${language}/date-difference`} />
      </div>
    </>
  )
}

export default DateDifferenceCalculator
