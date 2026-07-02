/**
 * @file Leads Table Component
 * Tabela com listagem de leads
 */

'use client'

import React from 'react'
import { Card, CardHeader, CardBody, Badge, Avatar, DropdownMenu } from '@/components/ui'
import { Lead } from '../types'
import { Icons } from '@/lib/icons'

interface LeadsTableProps {
  leads: Lead[]
  onEdit?: (lead: Lead) => void
  onDelete?: (leadId: string) => void
  onStatusChange?: (leadId: string, status: string) => void
}

const statusBadgeVariant = {
  novo: 'primary',
  qualificado: 'info',
  negociacao: 'warning',
  convertido: 'success',
  perdido: 'danger',
} as const

const statusLabel = {
  novo: 'Novo',
  qualificado: 'Qualificado',
  negociacao: 'Em negociação',
  convertido: 'Convertido',
  perdido: 'Perdido',
} as const

const sourceLabel = {
  website: 'Website',
  referencia: 'Referência',
  evento: 'Evento',
  rede: 'Rede',
  outro: 'Outro',
} as const

export function LeadsTable({
  leads,
  onEdit,
  onDelete,
  onStatusChange,
}: LeadsTableProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-bold text-gray-900">Leads</h3>
      </CardHeader>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Nome</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Empresa</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">E-mail</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Telefone</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Origem</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Valor</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Último contato</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={lead.name}
                        src={lead.avatar}
                        size="sm"
                      />
                      <span className="font-medium text-gray-900">{lead.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{lead.company}</td>
                  <td className="px-6 py-4 text-gray-600">{lead.email}</td>
                  <td className="px-6 py-4 text-gray-600">{lead.phone}</td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700">{sourceLabel[lead.source]}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={statusBadgeVariant[lead.status]}
                      size="sm"
                    >
                      {statusLabel[lead.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    R$ {lead.estimatedValue.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{lead.lastContact}</td>
                  <td className="px-6 py-4 text-center">
                    <DropdownMenu
                      trigger={
                        <div className="inline-flex items-center justify-center p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors cursor-pointer">
                          {Icons.settings(16)}
                        </div>
                      }
                      items={[
                        {
                          label: 'Editar',
                          icon: Icons.settings(14),
                          onClick: () => onEdit?.(lead),
                        },
                        {
                          label: 'Atualizar Status',
                          icon: Icons.clock(14),
                          onClick: () => console.log('Status'),
                        },
                        {
                          divider: true,
                          label: 'Excluir',
                          icon: Icons.logOut(14),
                          danger: true,
                          onClick: () => onDelete?.(lead.id),
                        },
                      ]}
                      align="right"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}
