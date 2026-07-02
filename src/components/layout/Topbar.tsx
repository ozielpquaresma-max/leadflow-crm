/**
 * @file Topbar Component
 * Barra superior com busca, notificações e perfil
 */

'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Icons } from '@/lib/icons'
import { Input, Button, Avatar, DropdownMenu } from '@/components/ui'
import { ROUTES } from '@/constants'

interface TopbarProps {
  userName?: string
  userEmail?: string
  userAvatar?: string
}

export function Topbar({
  userName = 'João Silva',
  userEmail = 'joao@leadflow.com',
  userAvatar,
}: TopbarProps) {
  const [searchFocus, setSearchFocus] = useState(false)
  const [notifications, setNotifications] = useState(3)

  const userMenuItems = [
    {
      label: 'Meu Perfil',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>,
      onClick: () => console.log('Profile'),
    },
    {
      label: 'Configurações',
      icon: Icons.settings(16),
      onClick: () => console.log('Settings'),
    },
    {
      label: 'Ajuda',
      icon: Icons.helpCircle(16),
      onClick: () => console.log('Help'),
    },
    {
      divider: true,
      label: 'Sair',
      icon: Icons.logOut(16),
      danger: true,
      onClick: () => console.log('Logout'),
    },
  ]

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Search Bar */}
      <div className="flex-1 max-w-sm">
        <Input
          type="text"
          placeholder="Buscar leads, clientes, negócios..."
          leftIcon={Icons.search(18)}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          className={cn(
            searchFocus ? 'border-blue-500' : '',
          )}
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 ml-6">
        {/* New Lead Button */}
        <Button
          variant="primary"
          size="md"
          leftIcon={Icons.plus(18)}
          onClick={() => console.log('New Lead')}
        >
          Novo Lead
        </Button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          {Icons.bell(20)}
          {notifications > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>

        {/* User Menu */}
        <DropdownMenu
          trigger={
            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
              <Avatar
                name={userName}
                src={userAvatar}
                size="md"
                status="online"
              />
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium text-gray-900">
                  {userName}
                </span>
                <span className="text-xs text-gray-500">{userEmail}</span>
              </div>
            </div>
          }
          items={userMenuItems}
          align="right"
        />
      </div>
    </header>
  )
}

