"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RedefinirSenhaPage() {
  const router = useRouter();

  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setErrorMessage(
          "Link inválido ou expirado. Solicite uma nova recuperação de senha."
        );
      }

      setCheckingSession(false);
    }

    checkSession();
  }, []);

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (novaSenha.length < 6) {
      setErrorMessage("A nova senha precisa ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErrorMessage("As senhas informadas não são iguais.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccessMessage(
        "Senha alterada com sucesso. Você já pode entrar com a nova senha."
      );

      await supabase.auth.signOut();

      window.setTimeout(() => {
        router.replace("/");
      }, 1800);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a senha.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.22),_transparent_35%)]" />

      <section className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl md:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 shadow-xl">
            <Image
              src="/brand/reycart-logo.png"
              alt="Logo ReyCart"
              width={64}
              height={64}
              className="h-14 w-14 object-contain"
              priority
            />
          </div>

          <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
            Redefinir senha
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Crie uma nova senha para acessar sua conta ReyCart.
          </p>
        </div>

        {checkingSession ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-500">
            Validando link de recuperação...
          </div>
        ) : (
          <>
            {errorMessage ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">
                  Nova senha
                </label>

                <input
                  type="password"
                  value={novaSenha}
                  onChange={(event) => setNovaSenha(event.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">
                  Confirmar nova senha
                </label>

                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(event) => setConfirmarSenha(event.target.value)}
                  placeholder="Digite novamente"
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !!successMessage}
                className="h-12 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? "Alterando senha..." : "Salvar nova senha"}
              </button>

              <button
                type="button"
                onClick={() => router.replace("/")}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Voltar para o login
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}