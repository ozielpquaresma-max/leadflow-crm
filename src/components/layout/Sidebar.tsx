"use client";

import React, { useEffect, useState } from "react";
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
  { label: "Recuperação", icon: "dollarSign", href: "/recuperacao" },
  { label: "Automações", icon: "zap", href: "/automacoes" },
  { label: "Integrações", icon: "settings", href: "/integracoes" },
  { label: "Configurações", icon: "settings", href: "/configuracoes" },
];

interface SidebarProps {
  open?: boolean;
  onToggle?: (open: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  open = true,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(open);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  function NavigationLinks({
    expanded,
    mobile,
  }: {
    expanded: boolean;
    mobile?: boolean;
  }) {
    return (
      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={mobile ? onMobileClose : undefined}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200",
              isActive(item.href)
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            )}
            title={!expanded ? item.label : undefined}
          >
            <span className="flex-shrink-0">
              {Icons[item.icon as keyof typeof Icons](21)}
            </span>

            {expanded ? (
              <span className="truncate text-sm font-bold">{item.label}</span>
            ) : null}
          </Link>
        ))}
      </nav>
    );
  }

  function Brand({ compact = false }: { compact?: boolean }) {
    return (
      <div
        className={cn(
          "flex min-w-0 items-center",
          compact ? "justify-center" : "gap-3"
        )}
      >
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

        {!compact ? (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-base font-extrabold leading-tight text-gray-950">
              ReyCart
            </span>

            <span className="truncate text-xs font-medium text-gray-500">
              Recuperação de vendas
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <aside
        className={cn(
          "hidden h-[100dvh] shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 lg:flex",
          isOpen ? "w-64" : "w-20"
        )}
      >
        <div
          className={cn(
            "flex h-20 items-center border-b border-gray-200 px-5 py-4",
            isOpen ? "justify-between" : "justify-center"
          )}
        >
          {isOpen ? <Brand /> : null}

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
            <Brand compact />
          </div>
        ) : null}

        <NavigationLinks expanded={isOpen} />

        <div className="border-t border-gray-200 px-3 py-4">
          <div
            className={cn(
              "rounded-2xl bg-blue-50 px-4 py-3",
              isOpen ? "block" : "flex justify-center px-2"
            )}
          >
            {isOpen ? (
              <>
                <p className="text-xs font-bold text-blue-700">ReyCart</p>

                <p className="mt-1 text-xs leading-5 text-blue-600">
                  Sistema ativo para recuperação de vendas.
                </p>
              </>
            ) : (
              <span className="text-xs font-black text-blue-700">RC</span>
            )}
          </div>
        </div>
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={onMobileClose}
          className={cn(
            "absolute inset-0 bg-slate-950/40 transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
        />

        <aside
          className={cn(
            "relative flex h-[100dvh] w-[86vw] max-w-[320px] flex-col border-r border-gray-200 bg-white shadow-2xl transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-20 items-center justify-between border-b border-gray-200 px-5 py-4">
            <Brand />

            <button
              type="button"
              onClick={onMobileClose}
              className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Fechar menu"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <NavigationLinks expanded mobile />

          <div className="border-t border-gray-200 px-4 py-4">
            <div className="rounded-2xl bg-blue-50 px-4 py-3">
              <p className="text-xs font-bold text-blue-700">ReyCart</p>

              <p className="mt-1 text-xs leading-5 text-blue-600">
                Sistema ativo para recuperação de vendas.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
