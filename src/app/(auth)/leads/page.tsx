/**
 * @file Leads Page
 * Página de gestão e listagem de leads
 */

'use client'

import React, { useState, useMemo } from 'react'
import { Icons } from '@/lib/icons'
import {
  LeadsStatsCard,
  LeadsTable,
  LeadsFilter,
  mockLeads,
  type Lead,
  type LeadsStats,
} from '@/features/leads'

export default function LeadsPage() {
  const [leads] = useState<Lead[]>(mockLeads)
  const [searchQuery, setSearchQuery] = useState('')

  // Calcular estatísticas
  const stats: LeadsStats = useMemo(() => {
    return {
      total: leads.length,
      new: leads.filter(l => l.status === 'novo').length,
      negotiating: leads.filter(l => l.status === 'negociacao').length,
      converted: leads.filter(l => l.status === 'convertido').length,
    }
  }, [leads])

  // Filtrar leads baseado na busca
  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads

    const query = searchQuery.toLowerCase()
    return leads.filter(lead =>
      lead.name.toLowerCase().includes(query) ||
      lead.email.toLowerCase().includes(query) ||
      lead.company.toLowerCase().includes(query) ||
      lead.phone.includes(query)
    )
  }, [leads, searchQuery])

  const handleEdit = (lead: Lead) => {
    console.log('Editar lead:', lead)
  }

  const handleDelete = (leadId: string) => {
    console.log('Deletar lead:', leadId)
  }

  const handleNewLead = () => {
    console.log('Novo lead')
  }

  return (
    <main className="flex-1 bg-gray-50 p-8 overflow-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
        <p className="text-gray-600 mt-1">
          Gerencie seus leads, acompanhe status e converta em clientes.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <LeadsStatsCard
          title="Total de Leads"
          value={stats.total}
          icon={Icons.users(24)}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <LeadsStatsCard
          title="Novos"
          value={stats.new}
          icon={Icons.zap(24)}
          color="green"
          trend={{ value: 8, isPositive: true }}
        />
        <LeadsStatsCard
          title="Em Negociação"
          value={stats.negotiating}
          icon={Icons.trendingUp(24)}
          color="orange"
          trend={{ value: 3, isPositive: true }}
        />
        <LeadsStatsCard
          title="Convertidos"
          value={stats.converted}
          icon={Icons.calendar(24)}
          color="purple"
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Filter and Search */}
      <LeadsFilter
        onSearch={setSearchQuery}
        onNewLead={handleNewLead}
      />

      {/* Leads Table */}
      <LeadsTable
        leads={filteredLeads}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Empty State */}
      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchQuery ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}
          </p>
        </div>
      )}
    </main>
  )
}
