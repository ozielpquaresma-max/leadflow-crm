/**
 * @file Application constants
 * Routes, UI constants, and other shared constants
 */

/**
 * Route paths
 */
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',

  // Protected routes
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',

  // Leads
  LEADS: '/leads',
  LEAD_DETAIL: (id: string) => `/leads/${id}`,
  LEAD_CREATE: '/leads/create',
  LEAD_EDIT: (id: string) => `/leads/${id}/edit`,

  // Contacts
  CONTACTS: '/contacts',
  CONTACT_DETAIL: (id: string) => `/contacts/${id}`,
  CONTACT_CREATE: '/contacts/create',
  CONTACT_EDIT: (id: string) => `/contacts/${id}/edit`,

  // Companies
  COMPANIES: '/companies',
  COMPANY_DETAIL: (id: string) => `/companies/${id}`,
  COMPANY_CREATE: '/companies/create',
  COMPANY_EDIT: (id: string) => `/companies/${id}/edit`,

  // Pipeline
  PIPELINE: '/pipeline',
  DEAL_DETAIL: (id: string) => `/pipeline/deals/${id}`,
  DEAL_CREATE: '/pipeline/deals/create',
  DEAL_EDIT: (id: string) => `/pipeline/deals/${id}/edit`,

  // Tasks
  TASKS: '/tasks',
  TASK_DETAIL: (id: string) => `/tasks/${id}`,
  TASK_CREATE: '/tasks/create',
  TASK_EDIT: (id: string) => `/tasks/${id}/edit`,

  // Calendar
  CALENDAR: '/calendar',

  // Proposals
  PROPOSALS: '/proposals',
  PROPOSAL_DETAIL: (id: string) => `/proposals/${id}`,
  PROPOSAL_CREATE: '/proposals/create',

  // Finance
  INVOICES: '/finance/invoices',
  INVOICE_DETAIL: (id: string) => `/finance/invoices/${id}`,

  // Reports
  REPORTS: '/reports',

  // Settings
  SETTINGS: '/settings',
  SETTINGS_ACCOUNT: '/settings/account',
  SETTINGS_ORGANIZATION: '/settings/organization',
  SETTINGS_TEAM: '/settings/team',
  SETTINGS_INTEGRATIONS: '/settings/integrations',
} as const

/**
 * Entity status constants
 */
export const ENTITY_STATUS = {
  CONTACT: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PROSPECT: 'prospect',
    CUSTOMER: 'customer',
  },
  LEAD: {
    NEW: 'new',
    QUALIFIED: 'qualified',
    CONVERTED: 'converted',
    REJECTED: 'rejected',
  },
  DEAL: {
    NEGOTIATION: 'negotiation',
    PROPOSAL_SENT: 'proposal_sent',
    WAITING_SIGNATURE: 'waiting_signature',
    WON: 'won',
    LOST: 'lost',
  },
  TASK: {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    DONE: 'done',
  },
} as const

/**
 * Priority levels
 */
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

/**
 * Currency options
 */
export const CURRENCIES = {
  USD: 'USD',
  EUR: 'EUR',
  BRL: 'BRL',
  GBP: 'GBP',
  AUD: 'AUD',
} as const

/**
 * Interaction types
 */
export const INTERACTION_TYPE = {
  EMAIL: 'email',
  CALL: 'call',
  MEETING: 'meeting',
  NOTE: 'note',
  WHATSAPP: 'whatsapp',
  SMS: 'sms',
} as const

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo é obrigatório',
  INVALID_EMAIL: 'Email inválido',
  PASSWORD_TOO_SHORT: 'Senha deve ter pelo menos 8 caracteres',
  PASSWORDS_DO_NOT_MATCH: 'Senhas não correspondem',
  SOMETHING_WENT_WRONG: 'Algo deu errado. Tente novamente.',
  UNAUTHORIZED: 'Você não tem permissão para acessar este recurso',
  NOT_FOUND: 'Recurso não encontrado',
} as const

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  CREATED: 'Criado com sucesso',
  UPDATED: 'Atualizado com sucesso',
  DELETED: 'Deletado com sucesso',
  SAVED: 'Salvo com sucesso',
} as const

/**
 * Time formatting
 */
export const TIME_FORMAT = {
  DATE: 'dd/MM/yyyy',
  DATE_TIME: 'dd/MM/yyyy HH:mm',
  TIME: 'HH:mm',
} as const

/**
 * Debounce delays (ms)
 */
export const DEBOUNCE_DELAY = {
  SHORT: 300,
  MEDIUM: 500,
  LONG: 1000,
} as const
