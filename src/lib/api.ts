/**
 * @file API utilities and helpers
 */

import { ApiResponse, ApiErrorCode } from '@/types'

/**
 * Create a success API response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: string,
  code?: ApiErrorCode,
): ApiResponse<null> {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  }
}

/**
 * API error class
 */
export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public statusCode: number = 500,
    message?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Validate API request data using Zod schema
 */
export async function validateRequest<T>(
  data: unknown,
  schema: any,
): Promise<{ valid: boolean; data?: T; error?: string }> {
  try {
    const validated = await schema.parseAsync(data)
    return { valid: true, data: validated }
  } catch (error: any) {
    return {
      valid: false,
      error: error?.message || 'Validation failed',
    }
  }
}
