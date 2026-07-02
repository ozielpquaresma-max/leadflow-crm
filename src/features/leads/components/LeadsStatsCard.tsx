/**
 * @file Leads Stats Card Component
 * Card mostrando estatísticas de leads
 */

import React from 'react'
import { Card, CardBody } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Icons } from '@/lib/icons'

interface LeadsStatsCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'purple' | 'orange'
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function LeadsStatsCard({
  title,
  value,
  icon,
  color = 'blue',
  trend,
}: LeadsStatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <Card>
      <CardBody className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
              {trend && (
                <span
                  className={cn(
                    'text-xs font-semibold',
                    trend.isPositive
                      ? 'text-green-600'
                      : 'text-red-600',
                  )}
                >
                  {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                </span>
              )}
            </div>
          </div>
          <div className={cn(
            'p-3 rounded-lg',
            colorClasses[color],
          )}>
            {icon}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
