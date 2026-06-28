import { logger } from './logger'

/**
 * Standardized server-side operations response interface.
 * Ensures consistent output format for all Next.js Server Actions and Route Handlers.
 */
export interface ServerResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: {
    code: string
    details?: unknown
  }
}

/**
 * Custom application error class to standardize internal errors with codes
 * and map them safely to user-friendly UI messages.
 */
export class AppError extends Error {
  public code: string
  public details?: unknown

  constructor(message: string, code: string = 'INTERNAL_ERROR', details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
    
    // Maintain correct stack trace in V8 engine
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }
}

/**
 * Global utility to format any error safely, map raw database or external API failures
 * to user-friendly messages, log them for developers, and output a standardized ServerResponse.
 */
export function handleServerError(err: unknown, fallbackMessage = 'An unexpected system error occurred'): ServerResponse {
  // Check if it's already an instance of our structured AppError
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.code}]: ${err.message}`, { details: err.details })
    return {
      success: false,
      message: err.message,
      error: {
        code: err.code,
        details: err.details,
      },
    }
  }

  // Handle generic native Errors
  if (err instanceof Error) {
    logger.error(`Uncaught Server Error: ${err.message}`, err)
    
    // Map common raw Supabase database error patterns to safe messages
    if (err.message.includes('RLS') || err.message.includes('row-level security')) {
      return {
        success: false,
        message: 'Permission denied. You do not have authorization to modify this record.',
        error: { code: 'FORBIDDEN' },
      }
    }

    if (err.message.includes('network') || err.message.includes('fetch failed')) {
      return {
        success: false,
        message: 'Network connection timeout. Please verify your connection and try again.',
        error: { code: 'NETWORK_ERROR' },
      }
    }

    return {
      success: false,
      message: fallbackMessage,
      error: {
        code: 'INTERNAL_ERROR',
      },
    }
  }

  // Fallback for completely unknown object formats thrown
  logger.error('Unknown raw error occurred:', { raw: err })
  return {
    success: false,
    message: fallbackMessage,
    error: {
      code: 'UNKNOWN_ERROR',
    },
  }
}