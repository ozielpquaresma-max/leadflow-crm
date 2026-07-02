/**
 * @file Pipeline Column Component
 * Coluna do pipeline com negócios
 */

'use client'

import React from 'react'
import { Badge, Avatar } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Deal {
  id: string
  title: string
  value: number
  contact: string
  contact_avatar?: string
  status?: 'at_risk' | 'on_track'
}

interface PipelineColumnProps {
  title: string
  count: number
  deals: Deal[]
  color?: 'blue' | 'green' | 'yellow' | 'purple'
}

export function PipelineColumn({
  title,
  count,
  deals,
  color = 'blue',
}: PipelineColumnProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  }

  return (
    <div className="flex-1 min-w-[300px]">
      <div className={cn(
        'rounded-lg border-2 p-4',
        colorClasses[color],
      )}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">{title}</h3>
          <span className="text-xs font-bold px-2 py-1 bg-current bg-opacity-10 rounded-full">
            {count}
          </span>
        </div>

        <div className="space-y-3">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-medium text-gray-900 flex-1">
                  {deal.title}
                </h4>
                {deal.status && (
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      deal.status === 'at_risk'
                        ? 'bg-red-500'
                        : 'bg-green-500',
                    )}
                  />
                )}
              </div>

              <p className="text-xs text-gray-500 mb-3">
                R$ {deal.value.toLocaleString('pt-BR')}
              </p>

              <div className="flex items-center gap-2">
                <Avatar
                  name={deal.contact}
                  src={deal.contact_avatar}
                  size="sm"
                />
                <span className="text-xs text-gray-600">
                  {deal.contact}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
