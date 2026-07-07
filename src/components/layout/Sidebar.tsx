"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { ROUTES } from "@/constants";

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: "layoutDashboard", href: ROUTES.DASHBOARD },
  { label: "Leads", icon: "zap", href: ROUTES.LEADS },
  { label: "Pipeline", icon: "trendingUp", href: ROUTES.PIPELINE },
  { label: "Agenda", icon: "calendar", href: ROUTES.CALENDAR },
  { label: "Clientes", icon: "users", href: ROUTES.CONTACTS },
  { label: "Propostas", icon: "fileText", href: ROUTES.PROPOSALS },
  { label: "Recuperação", icon: "dollarSign", href: "/recuperacao" },
  { label: "Automações", icon: "zap", href: "/automacoes" },
  { label: "Integrações", icon: "settings", href: "/integracoes" },
  { label: "Financeiro", icon: "dollarSign", href: ROUTES.INVOICES },
  { label: "Configurações", icon: "settings", href: "/configuracoes" },
];

interface SidebarProps {
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

export function Sidebar({ open = true, onToggle }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(open);
  const pathname = usePathname();

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div
        className={cn(
          "flex h-20 items-center border-b border-gray-200 px-5 py-4",
          isOpen ? "justify-between" : "justify-center"
        )}
      >
        {isOpen ? (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
              <Image
                src="/brand/reycart-logo.png"
                alt="Logo ReyCart"
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
                priority
              />
            </div>

            <div className="flex min-w-0 flex-col">
              <span className="truncate text-base font-extrabold leading-tight text-gray-950">
                ReyCart
              </span>

              <span className="truncate text-xs font-medium text-gray-500">
                Recuperação de vendas
              </span>
            </div>
          </div>
        ) : null}

        {!isOpen ? (
          <button
            type="button"
            onClick={handleToggle}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            title="Abrir menu"
          >
            {Icons.chevronRight(20)}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleToggle}
            className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            title="Fechar menu"
          >
            {Icons.chevronLeft(20)}
          </button>
        )}
      </div>

      {!isOpen ? (
        <div className="flex justify-center border-b border-gray-100 py-4">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white">
            <Image
              src="/brand/reycart-logo.png"
              alt="Logo ReyCart"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              priority
            />
          </div>
        </div>
      ) : null}

      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200",
              isActive(item.href)
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            )}
            title={!isOpen ? item.label : undefined}
          >
            <span className="flex-shrink-0">
              {Icons[item.icon as keyof typeof Icons](20)}
            </span>

            {isOpen ? (
              <span className="truncate text-sm font-medium">{item.label}</span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-200 px-3 py-4">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition-all duration-200 hover:bg-gray-100"
          title={!isOpen ? "Suporte" : undefined}
        >
          <span className="flex-shrink-0">{Icons.helpCircle(20)}</span>

          {isOpen ? <span className="text-sm font-medium">Suporte</span> : null}
        </button>
      </div>
    </div>
  );
}