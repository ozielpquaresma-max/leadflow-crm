/**
 * @file Agenda Component
 * Agenda do dia com compromissos
 */

'use client'

import React from 'react'
import { Card, CardHeader, CardBody, Badge } from '@/components/ui'
import { Icons } from '@/lib/icons'

interface AgendaItem {
  id: string
  title: string
  time: string
  type: 'meeting' | 'call' | 'task'
  participant?: string
  location?: string
}

interface AgendaProps {
  items?: AgendaItem[]
}

export function Agenda({ items }: AgendaProps) {
  const defaultItems: AgendaItem[] = [
    {
      id: '1',
      title: 'Reunião com TechCorp',
      time: '10:00',
      type: 'meeting',
      participant: 'Marina Santos',
      location: 'Sala 1',
    },
    {
      id: '2',
      title: 'Ligação para Innovate',
      time: '14:00',
      type: 'call',
      participant: 'Carlos Oliveira',
    },
    {
      id: '3',
      title: 'Follow-up StartupXYZ',
      time: '16:30',
      type: 'task',
      participant: 'Ana Silva',
    },
  ]

  const displayItems = items || defaultItems

  const typeIcon = {
    meeting: Icons.calendar(16),
    call: Icons.clock(16),
    task: Icons.mapPin(16),
  }

  const typeLabel = {
    meeting: 'Reunião',
    call: 'Ligação',
    task: 'Tarefa',
  }

  const typeVariant = {
    meeting: 'primary',
    call: 'info',
    task: 'warning',
  } as const

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-bold text-gray-900">Agenda do Dia</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-4 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="mt-1">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600">
                  {typeIcon[item.type]}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {item.title}
                  </h4>
                  <Badge variant={typeVariant[item.type]} size="sm">
                    {typeLabel[item.type]}
                  </Badge>
                </div>

                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <span className="flex-shrink-0">{Icons.clock(12)}</span>
                  {item.time}
                </p>

                {item.participant && (
                  <p className="text-xs text-gray-600">
                    {item.participant}
                  </p>
                )}

                {item.location && (
                  <p className="text-xs text-gray-600">
                    📍 {item.location}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

