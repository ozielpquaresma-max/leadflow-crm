/**
 * @file Authenticated Layout
 * Layout wrapper com Sidebar e Topbar para área protegida
 */

'use client'

import React, { useState } from 'react'
import { Sidebar, Topbar } from '@/components/layout'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onToggle={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar
          userName="João Silva"
          userEmail="joao@leadflow.com"
        />

        {/* Page Content */}
        {children}
      </div>
    </div>
  )
}
