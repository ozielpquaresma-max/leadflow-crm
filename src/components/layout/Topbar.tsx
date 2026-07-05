/**
 * @file Topbar Component
 * Barra superior com busca, notificações e perfil
 */

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { Input, Avatar, DropdownMenu } from "@/components/ui";

interface TopbarProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export function Topbar({
  userName = "João Silva",
  userEmail = "joao@leadflow.com",
  userAvatar,
}: TopbarProps) {
  const [searchFocus, setSearchFocus] = useState(false);
  const notifications = 3;

  const userMenuItems = [
    {
      label: "Meu Perfil",
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
      onClick: () => console.log("Profile"),
    },
    {
      label: "Configurações",
      icon: Icons.settings(16),
      onClick: () => console.log("Settings"),
    },
    {
      label: "Ajuda",
      icon: Icons.helpCircle(16),
      onClick: () => console.log("Help"),
    },
    {
      divider: true,
      label: "Sair",
      icon: Icons.logOut(16),
      danger: true,
      onClick: () => console.log("Logout"),
    },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="max-w-sm flex-1">
        <Input
          type="text"
          placeholder="Buscar leads, clientes, negócios..."
          leftIcon={Icons.search(18)}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          className={cn(searchFocus ? "border-blue-500" : "")}
        />
      </div>

      <div className="ml-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => console.log("New Lead")}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-gray-900 transition hover:bg-gray-100"
        >
          {Icons.plus(18)}
          <span>Novo Lead</span>
        </button>

        <button
          type="button"
          className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          {Icons.bell(20)}

          {notifications > 0 ? (
            <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {notifications}
            </span>
          ) : null}
        </button>

        <DropdownMenu
          trigger={
            <div className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100">
              <Avatar name={userName} src={userAvatar} size="md" status="online" />

              <div className="hidden flex-col items-start sm:flex">
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
  );
}