/**
 * @file Common type definitions
 * Shared types used across the application
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Generic error response
 */
export interface ErrorResponse {
  code: string
  message: string
  details?: Record<string, unknown>
}

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc'

/**
 * Pagination params
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: SortOrder
}

/**
 * Filter conditions
 */
export interface FilterCondition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith'
  value: unknown
}

/**
 * User roles
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  SALES = 'sales',
  USER = 'user',
  GUEST = 'guest',
}

/**
 * Base entity with timestamps
 */
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

/**
 * Base pagination request
 */
export interface BasePaginationRequest {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: SortOrder
}
