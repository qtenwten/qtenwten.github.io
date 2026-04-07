import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // You can log error to an error reporting service here
    // console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '4rem auto'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--error)' }}>
            Что-то пошло не так
          </h1>
          <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            Произошла ошибка при загрузке страницы. Попробуйте обновить страницу или вернуться на главную.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.875rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                background: 'var(--primary)',
                color: 'white'
              }}
            >
              Обновить страницу
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '0.875rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                border: '2px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                background: 'var(--bg-secondary)',
                color: 'var(--text)'
              }}
            >
              На главную
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
