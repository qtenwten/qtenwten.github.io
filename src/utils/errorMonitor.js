// Simple error monitoring system
class ErrorMonitor {
  constructor() {
    this.errors = []
    this.maxErrors = 50
    this.enabled = import.meta.env.PROD
  }

  init() {
    if (!this.enabled) return

    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      })
    })

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'unhandledrejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      })
    })

    // React error boundary errors are caught by ErrorBoundary component
  }

  logError(error) {
    this.errors.push(error)

    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    // Log to console in development
    if (!this.enabled) {
      console.error('Error logged:', error)
    }

    // In production, you could send to a logging service here
    // Example: fetch('/api/log-error', { method: 'POST', body: JSON.stringify(error) })
  }

  getErrors() {
    return this.errors
  }

  clearErrors() {
    this.errors = []
  }
}

export const errorMonitor = new ErrorMonitor()
