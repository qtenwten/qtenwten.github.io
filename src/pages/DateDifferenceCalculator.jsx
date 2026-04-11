import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useSearchParams } from 'react-router-dom'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import Icon from '../components/Icon'
import { calculateDateDifference, calculateTimeDifference, calculateCountdown, formatDateDifference, formatTimeDifference } from '../utils/dateDifference'

function DateDifferenceCalculator() {
  const { t, language } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()

  // Режимы: days, time, countdown
  const [mode, setMode] = useState(searchParams.get('mode') || 'days')

  // Для режима "дни"
  const [startDate, setStartDate] = useState(searchParams.get('from') || '')
  const [endDate, setEndDate] = useState(searchParams.get('to') || '')

  // Для режима "дата и время"
  const [startDateTime, setStartDateTime] = useState(searchParams.get('from') || '')
  const [endDateTime, setEndDateTime] = useState(searchParams.get('to') || '')

  // Для режима "обратный отсчёт"
  const [targetDateTime, setTargetDateTime] = useState(searchParams.get('to') || '')
  const [countdown, setCountdown] = useState(null)

  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // Обратный отсчёт - обновление каждую секунду
  useEffect(() => {
    if (mode === 'countdown' && targetDateTime) {
      const updateCountdown = () => {
        const count = calculateCountdown(targetDateTime)

        if (count && count.error === 'EVENT_PASSED') {
          setError(t('dateDifference.errors.eventPassed'))
          setCountdown(null)
        } else if (count) {
          setError('')
          setCountdown(count)
        }
      }

      // Первый расчёт сразу
      updateCountdown()

      // Обновление каждую секунду
      const interval = setInterval(updateCountdown, 1000)

      // Cleanup при размонтировании или изменении зависимостей
      return () => clearInterval(interval)
    }
  }, [mode, targetDateTime, t])

  // Расчёт для режимов "дни" и "дата и время"
  useEffect(() => {
    if (mode === 'days' && startDate && endDate) {
      const diff = calculateDateDifference(startDate, endDate)

      if (diff && diff.error === 'END_BEFORE_START') {
        setError(t('dateDifference.errors.endBeforeStart'))
        setResult(null)
      } else if (diff) {
        setError('')
        setResult(diff)
      } else {
        setError(t('dateDifference.errors.invalidDate'))
        setResult(null)
      }
    } else if (mode === 'time' && startDateTime && endDateTime) {
      const diff = calculateTimeDifference(startDateTime, endDateTime)

      if (diff && diff.error === 'END_BEFORE_START') {
        setError(t('dateDifference.errors.endBeforeStart'))
        setResult(null)
      } else if (diff) {
        setError('')
        setResult(diff)
      } else {
        setError(t('dateDifference.errors.invalidDate'))
        setResult(null)
      }
    } else {
      if (mode !== 'countdown') {
        setResult(null)
        setError('')
      }
    }
  }, [mode, startDate, endDate, startDateTime, endDateTime, t])

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    setStartDateTime('')
    setEndDateTime('')
    setTargetDateTime('')
    setResult(null)
    setCountdown(null)
    setError('')
    setSearchParams({})
  }

  const handleModeChange = (newMode) => {
    setMode(newMode)
    setError('')
    setResult(null)
    setCountdown(null)
    setSearchParams({ mode: newMode })
  }

  // Быстрые кнопки
  const setQuickTime = (type) => {
    const now = new Date()
    let target = new Date()

    switch (type) {
      case '1hour':
        target.setHours(now.getHours() + 1)
        break
      case '3hours':
        target.setHours(now.getHours() + 3)
        break
      case 'tomorrow':
        target.setDate(now.getDate() + 1)
        target.setHours(9, 0, 0, 0)
        break
      case '7days':
        target.setDate(now.getDate() + 7)
        break
      default:
        return
    }

    const formatted = target.toISOString().slice(0, 16)

    if (mode === 'countdown') {
      setTargetDateTime(formatted)
    } else if (mode === 'time') {
      setStartDateTime(now.toISOString().slice(0, 16))
      setEndDateTime(formatted)
    } else {
      setStartDate(now.toISOString().slice(0, 10))
      setEndDate(target.toISOString().slice(0, 10))
    }
  }

  return (
    <>
      <SEO
        title={t('seo.dateDifference.title')}
        description={t('seo.dateDifference.description')}
        path={`/${language}/date-difference`}
        keywords={t('seo.dateDifference.keywords')}
      />

      <div className="tool-container">
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="calendar_month" size={24} style={{ marginRight: '0.5rem' }} />
          {t('dateDifference.title')}
        </h1>
        <p style={{ textAlign: 'center' }}>{t('dateDifference.subtitle')}</p>

        {/* Переключатель режимов */}
        <div className="field">
          <label>{t('dateDifference.mode.label')}</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleModeChange('days')}
              className={mode === 'days' ? 'primary' : 'secondary'}
              style={{ flex: '1', minWidth: '120px' }}
            >
              {t('dateDifference.mode.days')}
            </button>
            <button
              onClick={() => handleModeChange('time')}
              className={mode === 'time' ? 'primary' : 'secondary'}
              style={{ flex: '1', minWidth: '120px' }}
            >
              {t('dateDifference.mode.time')}
            </button>
            <button
              onClick={() => handleModeChange('countdown')}
              className={mode === 'countdown' ? 'primary' : 'secondary'}
              style={{ flex: '1', minWidth: '120px' }}
            >
              {t('dateDifference.mode.countdown')}
            </button>
          </div>
        </div>

        {/* Быстрые кнопки */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {t('dateDifference.quickButtons.label')}
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => setQuickTime('1hour')} className="secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
              {t('dateDifference.quickButtons.1hour')}
            </button>
            <button onClick={() => setQuickTime('3hours')} className="secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
              {t('dateDifference.quickButtons.3hours')}
            </button>
            <button onClick={() => setQuickTime('tomorrow')} className="secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
              {t('dateDifference.quickButtons.tomorrow')}
            </button>
            <button onClick={() => setQuickTime('7days')} className="secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
              {t('dateDifference.quickButtons.7days')}
            </button>
          </div>
        </div>

        {/* Режим "Дни" */}
        {mode === 'days' && (
          <>
            <div className="field">
              <label htmlFor="startDate">{t('dateDifference.startDate')}</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                autoFocus
              />
            </div>

            <div className="field">
              <label htmlFor="endDate">{t('dateDifference.endDate')}</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </>
        )}

        {/* Режим "Дата и время" */}
        {mode === 'time' && (
          <>
            <div className="field">
              <label htmlFor="startDateTime">{t('dateDifference.startDateTime')}</label>
              <input
                id="startDateTime"
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                autoFocus
              />
            </div>

            <div className="field">
              <label htmlFor="endDateTime">{t('dateDifference.endDateTime')}</label>
              <input
                id="endDateTime"
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
              />
            </div>
          </>
        )}

        {/* Режим "Обратный отсчёт" */}
        {mode === 'countdown' && (
          <div className="field">
            <label htmlFor="targetDateTime">{t('dateDifference.targetDateTime')}</label>
            <input
              id="targetDateTime"
              type="datetime-local"
              value={targetDateTime}
              onChange={(e) => setTargetDateTime(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {error && (
          <div className="result-box error" style={{ padding: '1rem' }}>
            <p style={{ margin: 0, color: 'var(--error)' }}>{error}</p>
          </div>
        )}

        {/* Результат для режима "Дни" */}
        {mode === 'days' && result && !error && (
          <div className="result-box success" style={{ padding: '1rem' }}>
            <p style={{ margin: '0.25rem 0', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              {result.days} {t('dateDifference.result.days')}
            </p>

            {result.weeks > 0 && (
              <p style={{ margin: '0.25rem 0' }}>
                <strong>{t('dateDifference.result.weeks')}:</strong> {result.weeks}
              </p>
            )}

            {result.months > 0 && (
              <p style={{ margin: '0.25rem 0' }}>
                <strong>{t('dateDifference.result.months')}:</strong> {result.months}
              </p>
            )}

            {result.years > 0 && (
              <p style={{ margin: '0.25rem 0' }}>
                <strong>{t('dateDifference.result.years')}:</strong> {result.years}
              </p>
            )}

            <p style={{ margin: '0.5rem 0 0.25rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              {formatDateDifference(result, language)}
            </p>

            <CopyButton text={`${t('dateDifference.result.between')} ${result.startDate} ${t('dateDifference.result.and')} ${result.endDate}: ${result.days} ${t('dateDifference.result.days')}`} />
          </div>
        )}

        {/* Результат для режима "Дата и время" */}
        {mode === 'time' && result && !error && (
          <div className="result-box success" style={{ padding: '1rem' }}>
            <p style={{ margin: '0.25rem 0', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              {formatTimeDifference(result, language)}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem', marginTop: '1rem' }}>
              {result.days > 0 && (
                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{result.days}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('dateDifference.result.days')}</div>
                </div>
              )}
              <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg)', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{result.hours}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('dateDifference.result.hours')}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg)', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{result.minutes}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('dateDifference.result.minutes')}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg)', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{result.seconds}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('dateDifference.result.seconds')}</div>
              </div>
            </div>

            <CopyButton text={formatTimeDifference(result, language)} />
          </div>
        )}

        {/* Результат для режима "Обратный отсчёт" */}
        {mode === 'countdown' && countdown && !error && (
          <div className="result-box success" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', color: 'white' }}>
            <p style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center', opacity: 0.9 }}>
              {t('dateDifference.countdown.title')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '1rem' }}>
              {countdown.days > 0 && (
                <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{countdown.days}</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{t('dateDifference.result.days')}</div>
                </div>
              )}
              <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{String(countdown.hours).padStart(2, '0')}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{t('dateDifference.result.hours')}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{String(countdown.minutes).padStart(2, '0')}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{t('dateDifference.result.minutes')}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{String(countdown.seconds).padStart(2, '0')}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{t('dateDifference.result.seconds')}</div>
              </div>
            </div>

            <p style={{ margin: '1rem 0 0', fontSize: '0.95rem', textAlign: 'center', opacity: 0.8 }}>
              {t('dateDifference.countdown.until')} {countdown.targetDate}
            </p>
          </div>
        )}

        <div className="btn-group">
          <button onClick={handleClear} className="secondary">
            {t('common.clear')}
          </button>
        </div>

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--text)' }}>
            {t('dateDifference.info.title')}
          </h2>
          <p style={{ marginBottom: '2rem', color: 'var(--text)', lineHeight: '1.8', fontSize: '1.05rem' }}>
            {t('dateDifference.info.description')}
          </p>

          <h3 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text)' }}>
            {t('dateDifference.info.useCasesTitle')}
          </h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '2', paddingLeft: '0.5rem' }}>
            <li>{t('dateDifference.info.useCases.vacation')}</li>
            <li>{t('dateDifference.info.useCases.project')}</li>
            <li>{t('dateDifference.info.useCases.age')}</li>
            <li>{t('dateDifference.info.useCases.event')}</li>
            <li>{t('dateDifference.info.useCases.deadline')}</li>
          </ul>

          <h3 style={{ fontSize: '1.3rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text)' }}>
            {t('dateDifference.info.howToTitle')}
          </h3>
          <ol style={{ marginLeft: '1.5rem', color: 'var(--text)', lineHeight: '2', paddingLeft: '0.5rem' }}>
            <li>{t('dateDifference.info.howTo.step1')}</li>
            <li>{t('dateDifference.info.howTo.step2')}</li>
            <li>{t('dateDifference.info.howTo.step3')}</li>
          </ol>

          <h3 style={{ fontSize: '1.3rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text)' }}>
            {t('dateDifference.info.keywordsTitle')}
          </h3>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: '2', paddingLeft: '0.5rem' }}>
            <li>{t('dateDifference.info.keywords.k1')}</li>
            <li>{t('dateDifference.info.keywords.k2')}</li>
            <li>{t('dateDifference.info.keywords.k3')}</li>
            <li>{t('dateDifference.info.keywords.k4')}</li>
            <li>{t('dateDifference.info.keywords.k5')}</li>
          </ul>
        </div>

        <RelatedTools currentPath={`/${language}/date-difference`} />
      </div>
    </>
  )
}

export default DateDifferenceCalculator
