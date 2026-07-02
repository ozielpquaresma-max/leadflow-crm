/**
 * @file Dashboard Page
 * Página principal do dashboard com estatísticas e visualizações
 */

'use client'

import React from 'react'
import { Icons } from '@/lib/icons'
import {
  StatsCard,
  SalesChart,
  RecentLeads,
  PipelineColumn,
  Agenda,
} from '@/features/dashboard/components'

export default function DashboardPage() {
  return (
    <main className="flex-1 bg-gray-50 p-8 overflow-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Bem-vindo ao LeadFlow CRM. Aqui você acompanha seus leads, negócios e resultados.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Leads Novos"
          value="248"
          icon={Icons.trendingUp(24)}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        <StatsCard
          title="Clientes Ativos"
          value="87"
          icon={Icons.users(24)}
          trend={{ value: 5, isPositive: true }}
          color="green"
        />
        <StatsCard
          title="Negócios Abertos"
          value="34"
          icon={Icons.barChart(24)}
          trend={{ value: 3, isPositive: false }}
          color="purple"
        />
        <StatsCard
          title="Receita Total"
          value="R$ 285k"
          icon={Icons.dollarSign(24)}
          trend={{ value: 28, isPositive: true }}
          color="orange"
        />
      </div>

      {/* Sales Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>

        {/* Agenda Sidebar */}
        <div>
          <Agenda />
        </div>
      </div>

      {/* Pipeline Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pipeline de Vendas</h2>
        <div className="flex gap-6 overflow-x-auto pb-4">
          <PipelineColumn
            title="Novo"
            count={12}
            deals={[
              {
                id: '1',
                title: 'Projeto TechCorp',
                value: 45000,
                contact: 'Marina Santos',
              },
              {
                id: '2',
                title: 'Consultoria Innovate',
                value: 35000,
                contact: 'Carlos Oliveira',
              },
            ]}
            color="blue"
          />
          <PipelineColumn
            title="Qualificado"
            count={8}
            deals={[
              {
                id: '3',
                title: 'Implementação StartupXYZ',
                value: 55000,
                contact: 'Ana Silva',
                status: 'on_track',
              },
              {
                id: '4',
                title: 'Suporte Enterprise',
                value: 40000,
                contact: 'Roberto Costa',
              },
            ]}
            color="green"
          />
          <PipelineColumn
            title="Proposta"
            count={6}
            deals={[
              {
                id: '5',
                title: 'Desenvolvimento App',
                value: 65000,
                contact: 'João Silva',
                status: 'at_risk',
              },
              {
                id: '6',
                title: 'Treinamento Equipe',
                value: 28000,
                contact: 'Maria Santos',
              },
            ]}
            color="yellow"
          />
          <PipelineColumn
            title="Negociação"
            count={4}
            deals={[
              {
                id: '7',
                title: 'Contrato Master',
                value: 120000,
                contact: 'Pedro Costa',
                status: 'on_track',
              },
            ]}
            color="purple"
          />
        </div>
      </div>

      {/* Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentLeads />
      </div>
    </main>
  )
}
