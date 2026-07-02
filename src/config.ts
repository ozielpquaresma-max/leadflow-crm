/**
 * @file Application configuration
 * Central configuration for the entire application
 */

/**
 * App environment
 */
export const ENV = process.env.NODE_ENV || 'development'
export const IS_PRODUCTION = ENV === 'production'
export const IS_DEVELOPMENT = ENV === 'development'

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  API_TIMEOUT: 30000, // 30 seconds
  MAX_REQUEST_SIZE: '10mb',
}

/**
 * Authentication Configuration
 */
export const AUTH_CONFIG = {
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
}

/**
 * Database Configuration
 */
export const DB_CONFIG = {
  URL: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/leadflow',
  POOL_SIZE: 20,
  CONNECTION_TIMEOUT: 10000,
}

/**
 * Pagination Configuration
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
}

/**
 * File Upload Configuration
 */
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_EXTENSIONS: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'jpg', 'jpeg', 'png', 'gif'],
  UPLOAD_DIR: 'public/uploads',
}

/**
 * Email Configuration
 */
export const EMAIL_CONFIG = {
  FROM_ADDRESS: process.env.EMAIL_FROM || 'noreply@leadflow.com',
  SMTP_HOST: process.env.SMTP_HOST || 'localhost',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
}

/**
 * External Integrations
 */
export const INTEGRATIONS = {
  WHATSAPP: {
    ENABLED: process.env.WHATSAPP_ENABLED === 'true',
    API_URL: process.env.WHATSAPP_API_URL || '',
    API_KEY: process.env.WHATSAPP_API_KEY || '',
  },
  SLACK: {
    ENABLED: process.env.SLACK_ENABLED === 'true',
    WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || '',
  },
}

/**
 * Feature Flags
 */
export const FEATURE_FLAGS = {
  ENABLE_PIPELINE: true,
  ENABLE_CALENDAR: true,
  ENABLE_WHATSAPP: process.env.WHATSAPP_ENABLED === 'true',
  ENABLE_PROPOSALS: true,
  ENABLE_FINANCE: true,
  ENABLE_REPORTS: true,
  ENABLE_API_DOCS: !IS_PRODUCTION,
}
