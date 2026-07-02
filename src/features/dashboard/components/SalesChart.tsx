/**
 * @file Sales Chart Component
 * Gráfico de vendas simples com dados fictícios
 */

'use client'

import React from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui'

interface ChartData {
  month: string
  value: number
}

interface SalesChartProps {
  title?: string
  data?: ChartData[]
}

export function SalesChart({
  title = 'Receita por Mês',
  data,
}: SalesChartProps) {
  const defaultData: ChartData[] = [
    { month: 'Jan', value: 12000 },
    { month: 'Fev', value: 19000 },
    { month: 'Mar', value: 15000 },
    { month: 'Abr', value: 25000 },
    { month: 'Mai', value: 22000 },
    { month: 'Jun', value: 30000 },
  ]

  const chartData = data || defaultData
  const maxValue = Math.max(...chartData.map((d) => d.value))

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-6">
          {/* Chart Bars */}
          <div className="flex items-end justify-between h-48 gap-2">
            {chartData.map((item, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                    style={{
                      height: `${(item.value / maxValue) * 100}%`,
                    }}
                    title={`${item.month}: R$ ${item.value.toLocaleString('pt-BR')}`}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {item.month}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
            <span>
              Total: R$ {chartData.reduce((acc, d) => acc + d.value, 0).toLocaleString('pt-BR')}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded" />
              Receita
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
