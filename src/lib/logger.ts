/**
 * Production-ready logging utility to structure application logs.
 * Prepares the codebase for Sentry, Logtail, or Datadog integrations.
 */
class Logger {
  private isProduction = process.env.NODE_ENV === 'production'

  info(message: string, context?: Record<string, unknown>) {
    this.log('INFO', message, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('WARN', message, context)
  }

  error(message: string, context?: Record<string, unknown> | Error) {
    const serializedContext = context instanceof Error 
      ? { name: context.name, message: context.message, stack: context.stack }
      : context
    this.log('ERROR', message, serializedContext)
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (!this.isProduction) {
      this.log('DEBUG', message, context)
    }
  }

  private log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, context?: Record<string, unknown>) {
    const timestamp = new Date().toISOString()
    const logOutput = {
      timestamp,
      level,
      message,
      ...(context ? { context } : {}),
    }

    if (this.isProduction) {
      // Output as single-line JSON for easy production log aggregator parsing
      console.log(JSON.stringify(logOutput))
    } else {
      // Development human-readable terminal log formatting
      const color = level === 'ERROR' ? '\x1b[31m' : level === 'WARN' ? '\x1b[33m' : level === 'DEBUG' ? '\x1b[36m' : '\x1b[32m'
      const reset = '\x1b[0m'
      console.log(`[${timestamp}] ${color}${level}${reset}: ${message}`, context || '')
    }
  }
}

export const logger = new Logger()