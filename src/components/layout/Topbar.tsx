"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { Input, Avatar } from "@/components/ui";
import { supabase } from "@/lib/supabase";

interface TopbarProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export function Topbar({
  userName = "Usuário",
  userEmail = "",
  userAvatar,
}: TopbarProps) {
  const router = useRouter();

  const menuRef = useRef<HTMLDivElement | null>(null);

  const [searchFocus, setSearchFocus] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const notifications = 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;

      if (!menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function goToProfile() {
    setProfileMenuOpen(false);
    router.push("/configuracoes");
  }

  function goToSettings() {
    setProfileMenuOpen(false);
    router.push("/configuracoes");
  }

  function goToHelp() {
    setProfileMenuOpen(false);
    router.push("/configuracoes");
  }

  function goToNewLead() {
    router.push("/leads");
  }

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await supabase.auth.signOut();

      setProfileMenuOpen(false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Erro ao sair da conta:", error);
    } finally {
      setSigningOut(false);
    }
  }

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
          onClick={goToNewLead}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-gray-900 transition hover:bg-gray-100"
        >
          {Icons.plus(18)}
          <span>Novo Lead</span>
        </button>

        <button
          type="button"
          className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          title="Notificações"
        >
          {Icons.bell(20)}

          {notifications > 0 ? (
            <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {notifications}
            </span>
          ) : null}
        </button>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileMenuOpen((current) => !current)}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100"
          >
            <Avatar name={userName} src={userAvatar} size="md" status="online" />

            <div className="hidden flex-col items-start sm:flex">
              <span className="max-w-[220px] truncate text-sm font-medium text-gray-900">
                {userName}
              </span>

              {userEmail ? (
                <span className="max-w-[220px] truncate text-xs text-gray-500">
                  {userEmail}
                </span>
              ) : null}
            </div>
          </button>

          {profileMenuOpen ? (
            <div className="absolute right-0 top-full mt-3 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-sm font-bold text-gray-950">
                  {userName}
                </p>

                {userEmail ? (
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {userEmail}
                  </p>
                ) : null}
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={goToProfile}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
                >
                  <span className="text-gray-500">
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </span>

                  <span>Meu Perfil</span>
                </button>

                <button
                  type="button"
                  onClick={goToSettings}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
                >
                  <span className="text-gray-500">{Icons.settings(16)}</span>

                  <span>Configurações</span>
                </button>

                <button
                  type="button"
                  onClick={goToHelp}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
                >
                  <span className="text-gray-500">{Icons.helpCircle(16)}</span>

                  <span>Ajuda</span>
                </button>
              </div>

              <div className="border-t border-gray-100 p-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>{Icons.logOut(16)}</span>

                  <span>{signingOut ? "Saindo..." : "Sair"}</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}