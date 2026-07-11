"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

type NavIcon =
  | "dashboard"
  | "recovery"
  | "automation"
  | "integration"
  | "settings";

interface NavItem {
  label: string;
  icon: NavIcon;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", href: ROUTES.DASHBOARD },
  { label: "Recuperação", icon: "recovery", href: "/recuperacao" },
  { label: "Automações", icon: "automation", href: "/automacoes" },
  { label: "Integrações", icon: "integration", href: "/integracoes" },
  { label: "Configurações", icon: "settings", href: "/configuracoes" },
];

interface SidebarProps {
  open?: boolean;
  onToggle?: (open: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {direction === "left" ? (
        <path
          d="m14.5 6-6 6 6 6"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="m9.5 6 6 6-6 6"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="m6 6 12 12"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon({ name }: { name: NavIcon }) {
  if (name === "dashboard") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4.5 13.2c0-4.4 3.1-8 7.5-8s7.5 3.6 7.5 8"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M7.5 14.5h9"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M12 14.5 15.8 9"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M6.5 18.5h11"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "recovery") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6.5 8.2h8.1c2 0 3.6 1.6 3.6 3.6s-1.6 3.6-3.6 3.6H8.2"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m8.8 4.9-3.4 3.3 3.4 3.3"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 10.1v5.8"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M14.3 11.2c-.4-.7-1.1-1.1-2.1-1.1-1.1 0-1.9.5-1.9 1.4 0 2.2 4.2.9 4.2 3.1 0 .9-.8 1.4-2.2 1.4-1.1 0-1.9-.4-2.4-1.2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "automation") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12.6 3.8 6.9 12h4.4l-1 8.2 6-9h-4.2l.5-7.4Z"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18.8 5.7h1.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M19.7 4.8v1.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M4.2 17.6H6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M5.1 16.7v1.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "integration") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M8.2 8.3h-1a3.7 3.7 0 0 0 0 7.4h1"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M15.8 8.3h1a3.7 3.7 0 0 1 0 7.4h-1"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M9.6 12h4.8"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M5 5.1 3.9 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M19 18.9 20.1 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M19 5.1 20.1 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M5 18.9 3.9 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5.5 7.5h13"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M5.5 16.5h13"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M9.2 7.5a1.8 1.8 0 1 0-3.6 0 1.8 1.8 0 0 0 3.6 0Z"
        fill="currentColor"
      />
      <path
        d="M18.4 16.5a1.8 1.8 0 1 0-3.6 0 1.8 1.8 0 0 0 3.6 0Z"
        fill="currentColor"
      />
    </svg>
  );
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
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={mobile ? onMobileClose : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200",
                active
                  ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-950"
              )}
              title={!expanded ? item.label : undefined}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition",
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-50 text-gray-500 group-hover:bg-white group-hover:text-blue-700"
                )}
              >
                <MenuIcon name={item.icon} />
              </span>

              {expanded ? (
                <span className="truncate text-sm font-bold">{item.label}</span>
              ) : null}
            </Link>
          );
        })}
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
              <ChevronIcon direction="right" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              title="Fechar menu"
            >
              <ChevronIcon direction="left" />
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
              <CloseIcon />
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
