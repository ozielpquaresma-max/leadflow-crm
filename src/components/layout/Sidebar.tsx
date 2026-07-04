/**
 * @file Sidebar Component
 * Sidebar de navegação principal com logo e menu
 */

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Icons } from '@/lib/icons'
import { ROUTES } from '@/constants'

interface NavItem {
  label: string
  icon: string
  href: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'layoutDashboard', href: ROUTES.DASHBOARD },
  { label: 'Leads', icon: 'zap', href: ROUTES.LEADS },
  { label: 'Pipeline', icon: 'trendingUp', href: ROUTES.PIPELINE },
  { label: 'Agenda', icon: 'calendar', href: ROUTES.CALENDAR },
  { label: 'Clientes', icon: 'users', href: ROUTES.CONTACTS },
  { label: 'Propostas', icon: 'fileText', href: ROUTES.PROPOSALS },
  { label: "Recuperação", icon: "dollarSign", href: "/recuperacao" },
  { label: 'Financeiro', icon: 'dollarSign', href: ROUTES.INVOICES },
  { label: 'Configurações', icon: 'settings', href: ROUTES.SETTINGS },
]

interface SidebarProps {
  open?: boolean
  onToggle?: (open: boolean) => void
}

export function Sidebar({ open = true, onToggle }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(open)
  const pathname = usePathname()

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    onToggle?.(newState)
  }

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <div
      className={cn(
        'h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
        isOpen ? 'w-64' : 'w-20',
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'px-6 py-6 border-b border-gray-200 flex items-center justify-between',
          isOpen ? 'h-20' : 'h-20 justify-center',
        )}
      >
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
              L
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">LeadFlow</span>
              <span className="text-xs text-gray-500">CRM</span>
            </div>
          </div>
        )}
        <button
          onClick={handleToggle}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          {isOpen ? Icons.chevronLeft(20) : Icons.chevronRight(20)}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
              isActive(item.href)
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100',
            )}
            title={!isOpen ? item.label : undefined}
          >
            <span className="flex-shrink-0">
              {Icons[item.icon as keyof typeof Icons](20)}
            </span>
            {isOpen && (
              <span className="text-sm font-medium truncate">
                {item.label}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-200">
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200"
          title={!isOpen ? 'Suporte' : undefined}
        >
          <span className="flex-shrink-0">
            {Icons.helpCircle(20)}
          </span>
          {isOpen && <span className="text-sm font-medium">Suporte</span>}
        </button>
      </div>
    </div>
  )
}
