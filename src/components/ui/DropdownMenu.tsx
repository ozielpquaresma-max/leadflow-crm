/**
 * @file Dropdown Menu Component
 * Componente para menus dropdown
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: Array<{
    label: string
    icon?: React.ReactNode
    onClick: () => void
    divider?: boolean
    danger?: boolean
  }>
  align?: 'left' | 'right'
  className?: string
}

export function DropdownMenu({
  trigger,
  items,
  align = 'right',
  className,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleItemClick = (onClick: () => void) => {
    onClick()
    setIsOpen(false)
  }

  return (
    <div className={cn('relative inline-block', className)} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center"
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg min-w-max py-1 z-50',
            {
              'left-0': align === 'left',
              'right-0': align === 'right',
            },
          )}
        >
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {item.divider && (
                <div key={`divider-${index}`} className="border-t border-gray-200 my-1" />
              )}
              <button
                onClick={() => handleItemClick(item.onClick)}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors',
                  {
                    'text-gray-700 hover:bg-gray-100': !item.danger,
                    'text-red-600 hover:bg-red-50': item.danger,
                  },
                )}
              >
                {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
