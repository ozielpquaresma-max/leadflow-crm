"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, Topbar } from "@/components/layout";
import { supabase } from "@/lib/supabase";

type UsuarioPerfil = {
  nome: string | null;
  email: string | null;
  empresa_id: string | null;
};

type EmpresaPerfil = {
  status: string | null;
};

async function provisionAccount(accessToken: string, email: string) {
  const response = await fetch("/api/auth/provision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      email,
    }),
  });

  const result = (await response.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
  } | null;

  if (!response.ok || !result?.ok) {
    throw new Error(
      result?.error || "Não foi possível preparar sua conta ReyCart."
    );
  }
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);
  const [userName, setUserName] = useState("Usuário");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadUserSession() {
      setCheckingSession(true);

      try {
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

        let { data: usuario, error: usuarioError } = await supabase
          .from("usuarios")
          .select("nome, email, empresa_id")
          .eq("auth_user_id", authUser.id)
          .maybeSingle();

        if (!mounted) return;

        if (usuarioError) {
          throw new Error(usuarioError.message);
        }

        if (!usuario?.empresa_id) {
          if (!session.access_token) {
            throw new Error("Sessão sem token de acesso.");
          }

          await provisionAccount(session.access_token, fallbackEmail);

          const usuarioProvisionado = await supabase
            .from("usuarios")
            .select("nome, email, empresa_id")
            .eq("auth_user_id", authUser.id)
            .maybeSingle();

          if (usuarioProvisionado.error) {
            throw new Error(usuarioProvisionado.error.message);
          }

          usuario = usuarioProvisionado.data;
        }

        if (!usuario?.empresa_id) {
          throw new Error("Usuário interno não encontrado no ReyCart.");
        }

        const perfil = usuario as UsuarioPerfil;

        setUserName(perfil.nome || fallbackName);
        setUserEmail(perfil.email || fallbackEmail);

        const { data: empresa, error: empresaError } = await supabase
          .from("empresas")
          .select("status")
          .eq("id", perfil.empresa_id)
          .maybeSingle();

        if (empresaError) {
          throw new Error(empresaError.message);
        }

        const empresaStatus =
          ((empresa as EmpresaPerfil | null)?.status || "trial").toLowerCase();

        const isAssinaturaPage = pathname === "/assinatura";
        const contaAtiva = empresaStatus === "ativo";

        if (!contaAtiva && !isAssinaturaPage) {
          router.replace("/assinatura");
          return;
        }

        if (!mounted) return;

        setCheckingSession(false);
      } catch (error) {
        console.error("Erro ao carregar sessão autenticada:", error);

        if (!mounted) return;

        await supabase.auth.signOut();
        router.replace("/");
      }
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
  }, [pathname, router]);

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
            Verificando sua sessão e assinatura.
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