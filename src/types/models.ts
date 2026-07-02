/**
 * @file Domain model types
 * Types for core CRM entities
 */

import { BaseEntity } from './common'

/**
 * User model
 */
export interface User extends BaseEntity {
  email: string
  name: string
  avatar?: string
  phone?: string
  role: string
  organizationId: string
  isActive: boolean
  lastLoginAt?: Date
}

/**
 * Organization model
 */
export interface Organization extends BaseEntity {
  name: string
  slug: string
  logo?: string
  description?: string
  website?: string
  industry?: string
  size?: string
  plan: 'free' | 'pro' | 'enterprise'
  subscriptionStatus: 'active' | 'paused' | 'cancelled'
  metadata?: Record<string, unknown>
}

/**
 * Contact model
 */
export interface Contact extends BaseEntity {
  email: string
  firstName: string
  lastName: string
  phone?: string
  mobile?: string
  company?: string
  jobTitle?: string
  website?: string
  address?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
  organizationId: string
  status: 'active' | 'inactive' | 'prospect' | 'customer'
  tags?: string[]
  notes?: string
  metadata?: Record<string, unknown>
}

/**
 * Company model
 */
export interface Company extends BaseEntity {
  name: string
  slug: string
  website?: string
  industry?: string
  size?: string
  revenue?: number
  description?: string
  address?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
  organizationId: string
  contactPersonId?: string
  metadata?: Record<string, unknown>
}

/**
 * Deal/Pipeline Stage model
 */
export interface Deal extends BaseEntity {
  title: string
  description?: string
  value: number
  currency: string
  stage: string
  probability: number
  expectedCloseDate: Date
  organizationId: string
  contactId: string
  companyId?: string
  ownerId: string
  metadata?: Record<string, unknown>
}

/**
 * Task model
 */
export interface Task extends BaseEntity {
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate: Date
  organizationId: string
  assignedToId: string
  contactId?: string
  dealId?: string
  metadata?: Record<string, unknown>
}

/**
 * Interaction/Activity model
 */
export interface Interaction extends BaseEntity {
  type: 'email' | 'call' | 'meeting' | 'note' | 'whatsapp' | 'sms'
  subject?: string
  content: string
  organizationId: string
  userId: string
  contactId: string
  dealId?: string
  metadata?: Record<string, unknown>
}
