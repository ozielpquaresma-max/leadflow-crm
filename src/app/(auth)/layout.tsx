"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, Topbar } from "@/components/layout";
import { supabase } from "@/lib/supabase";

type UsuarioPerfil = {
  nome: string | null;
  email: string | null;
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);
  const [userName, setUserName] = useState("Usuário");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadUserSession() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (sessionError || !session?.user) {
        router.replace("/");
        return;
      }

      const authUser = session.user;

      const fallbackName =
        String(authUser.user_metadata?.full_name || "").trim() ||
        authUser.email?.split("@")[0] ||
        "Usuário";

      const fallbackEmail = authUser.email || "";

      setUserName(fallbackName);
      setUserEmail(fallbackEmail);

      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .select("nome, email")
        .eq("auth_user_id", authUser.id)
        .maybeSingle();

      if (!mounted) return;

      if (!usuarioError && usuario) {
        const perfil = usuario as UsuarioPerfil;

        setUserName(perfil.nome || fallbackName);
        setUserEmail(perfil.email || fallbackEmail);
      }

      setCheckingSession(false);
    }

    loadUserSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace("/");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (checkingSession) {
    return (
      <main className="flex h-screen items-center justify-center bg-slate-950 px-6">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-black text-blue-600">
            RC
          </div>

          <p className="mt-4 text-sm font-semibold text-white">
            Carregando painel ReyCart...
          </p>

          <p className="mt-1 text-xs text-slate-300">
            Verificando sua sessão.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onToggle={setSidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar userName={userName} userEmail={userEmail} />

        {children}
      </div>
    </div>
  );
}