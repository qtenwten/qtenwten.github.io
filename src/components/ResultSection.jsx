import './ResultSection.css'

export function ResultSection({ children, className = '', tone = 'default', ...props }) {
  return <section className={`result-section result-section--${tone} ${className}`.trim()} {...props}>{children}</section>
}

export function ResultSummary({ kicker, title, description, actions = null, centered = false, score = null, scoreColor = null }) {
  return (
    <div className={`result-summary ${centered ? 'is-centered' : ''}`.trim()}>
      <div className="result-summary__main">
        {kicker ? <div className="result-summary__kicker">{kicker}</div> : null}
        {typeof score === 'number' ? (
          <div className="result-summary__score" style={scoreColor ? { color: scoreColor } : undefined}>
            {score}
          </div>
        ) : null}
        <h2 className="result-summary__title">{title}</h2>
        {description ? <p className="result-summary__description">{description}</p> : null}
      </div>
      {actions ? <div className="result-summary__actions">{actions}</div> : null}
    </div>
  )
}

export function ResultMetrics({ children, columns = 2, className = '' }) {
  return <div className={`result-metrics result-metrics--cols-${columns} ${className}`.trim()}>{children}</div>
}

export function ResultMetric({ label, value, hint = null, className = '' }) {
  return (
    <div className={`result-metric ${className}`.trim()}>
      <span className="result-metric__label">{label}</span>
      <strong className="result-metric__value">{value}</strong>
      {hint ? <p className="result-metric__hint">{hint}</p> : null}
    </div>
  )
}

export function ResultActions({ children, className = '', align = 'start' }) {
  return <div className={`result-actions result-actions--${align} ${className}`.trim()}>{children}</div>
}

export function ResultNotice({ title, children, tone = 'info', className = '', ...props }) {
  return (
    <div className={`result-notice result-notice--${tone} ${className}`.trim()} {...props}>
      {title ? <strong className="result-notice__title">{title}</strong> : null}
      <div className="result-notice__body">{children}</div>
    </div>
  )
}

export function ResultDetails({ title, children, className = '' }) {
  return (
    <section className={`result-details ${className}`.trim()}>
      {title ? <h3 className="result-details__title">{title}</h3> : null}
      <div className="result-details__body">{children}</div>
    </section>
  )
}
