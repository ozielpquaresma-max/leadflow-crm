/**
 * @file Leads types
 */

export type LeadStatus = 'novo' | 'qualificado' | 'negociacao' | 'convertido' | 'perdido'
export type LeadSource = 'website' | 'referencia' | 'evento' | 'rede' | 'outro'

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: LeadStatus
  source: LeadSource
  estimatedValue: number
  lastContact: string
  createdAt: string
  avatar?: string
}

export interface LeadsStats {
  total: number
  new: number
  negotiating: number
  converted: number
}
