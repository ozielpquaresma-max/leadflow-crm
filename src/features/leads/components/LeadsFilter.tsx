/**
 * @file Leads Filter Component
 * Barra de filtros para leads
 */

'use client'

import React from 'react'
import { Input, Button } from '@/components/ui'
import { Icons } from '@/lib/icons'

interface LeadsFilterProps {
  onSearch?: (query: string) => void
  onNewLead?: () => void
  onFilter?: (filters: any) => void
}

export function LeadsFilter({
  onSearch,
  onNewLead,
  onFilter,
}: LeadsFilterProps) {
  const [searchQuery, setSearchQuery] = React.useState('')

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center mb-6">
      {/* Search Input */}
      <div className="flex-1">
        <Input
          type="text"
          placeholder="Buscar por nome, empresa, e-mail..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          leftIcon={Icons.search(18)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="md"
          onClick={() => onFilter?.({})}
        >
          Filtros
        </Button>
        <Button
          variant="primary"
          size="md"
          leftIcon={Icons.plus(18)}
          onClick={onNewLead}
        >
          Novo Lead
        </Button>
      </div>
    </div>
  )
}
