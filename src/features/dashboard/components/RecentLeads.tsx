/**
 * @file Recent Leads Component
 * Tabela com últimos leads adicionados
 */

'use client'

import React from 'react'
import { Card, CardHeader, CardBody, Badge, Avatar } from '@/components/ui'
import { Mail, Phone, Calendar } from 'lucide-react'

interface Lead {
  id: string
  name: string
  email: string
  company: string
  status: 'new' | 'qualified' | 'contacted'
  date: string
  avatar?: string
}

interface RecentLeadsProps {
  leads?: Lead[]
}

export function RecentLeads({ leads }: RecentLeadsProps) {
  const defaultLeads: Lead[] = [
    {
      id: '1',
      name: 'Marina Santos',
      email: 'marina@techcorp.com',
      company: 'TechCorp',
      status: 'new',
      date: '02/07/2026',
    },
    {
      id: '2',
      name: 'Carlos Oliveira',
      email: 'carlos@innovate.com',
      company: 'Innovate Solutions',
      status: 'qualified',
      date: '01/07/2026',
    },
    {
      id: '3',
      name: 'Ana Silva',
      email: 'ana@startupxyz.com',
      company: 'StartupXYZ',
      status: 'contacted',
      date: '30/06/2026',
    },
    {
      id: '4',
      name: 'Roberto Costa',
      email: 'roberto@enterprise.com',
      company: 'Enterprise Corp',
      status: 'new',
      date: '29/06/2026',
    },
  ]

  const displayLeads = leads || defaultLeads

  const statusBadgeVariant = {
    new: 'primary',
    qualified: 'success',
    contacted: 'warning',
  } as const

  const statusLabel = {
    new: 'Novo',
    qualified: 'Qualificado',
    contacted: 'Contatado',
  } as const

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-bold text-gray-900">Últimos Leads</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {displayLeads.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar
                  name={lead.name}
                  src={lead.avatar}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {lead.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {lead.company}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={statusBadgeVariant[lead.status]}
                  size="sm"
                >
                  {statusLabel[lead.status]}
                </Badge>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {lead.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
