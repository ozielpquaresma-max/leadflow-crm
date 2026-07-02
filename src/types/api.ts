/**
 * @file API-specific type definitions
 */

import { ApiResponse, PaginatedResponse } from './common'

/**
 * Generic endpoint request handler
 */
export type ApiHandler<T = unknown> = (data?: T) => Promise<ApiResponse<unknown>>

/**
 * API Route Method types
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

/**
 * API Request context
 */
export interface ApiRequestContext {
  userId?: string
  organizationId?: string
  userRole?: string
  headers: Record<string, string>
}

/**
 * API Error codes
 */
export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CONFLICT = 'CONFLICT',
}
