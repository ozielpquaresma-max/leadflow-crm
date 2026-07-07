"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Usuario = {
  id: string;
  empresa_id: string | null;
  auth_user_id: string | null;
  nome: string | null;
  email: string | null;
  papel: string | null;
  perfil?: string | null;
};

type Empresa = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  cnpj_cpf: string | null;
  documento?: string | null;
  status: string | null;
};

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  const [nome, setNome] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [telefoneEmpresa, setTelefoneEmpresa] = useState("");
  const [documentoEmpresa, setDocumentoEmpresa] = useState("");

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadPerfil() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      if (!session?.user) {
        throw new Error("Sessão não encontrada.");
      }

      const authUser = session.user;

      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_user_id", authUser.id)
        .maybeSingle();

      if (usuarioError) {
        throw new Error(usuarioError.message);
      }

      if (!usuarioData) {
        const fallbackName =
          String(authUser.user_metadata?.full_name || "").trim() ||
          authUser.email?.split("@")[0] ||
          "Usuário";

        setUsuario({
          id: authUser.id,
          empresa_id: null,
          auth_user_id: authUser.id,
          nome: fallbackName,
          email: authUser.email || "",
          papel: "admin",
        });

        setNome(fallbackName);
        return;
      }

      const usuarioEncontrado = usuarioData as Usuario;

      setUsuario(usuarioEncontrado);
      setNome(usuarioEncontrado.nome || "");

      if (usuarioEncontrado.empresa_id) {
        const { data: empresaData, error: empresaError } = await supabase
          .from("empresas")
          .select("*")
          .eq("id", usuarioEncontrado.empresa_id)
          .maybeSingle();

        if (empresaError) {
          throw new Error(empresaError.message);
        }

        if (empresaData) {
          const empresaEncontrada = empresaData as Empresa;

          setEmpresa(empresaEncontrada);
          setNomeEmpresa(empresaEncontrada.nome || "");
          setTelefoneEmpresa(empresaEncontrada.telefone || "");
          setDocumentoEmpresa(
            empresaEncontrada.cnpj_cpf || empresaEncontrada.documento || ""
          );
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao carregar perfil.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!usuario) return;

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("Sessão não encontrada.");
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: nome,
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      const { error: usuarioError } = await supabase
        .from("usuarios")
        .update({
          nome,
          updated_at: new Date().toISOString(),
        })
        .eq("auth_user_id", session.user.id);

      if (usuarioError) {
        throw new Error(usuarioError.message);
      }

      if (empresa?.id) {
        const { error: empresaError } = await supabase
          .from("empresas")
          .update({
            nome: nomeEmpresa,
            telefone: telefoneEmpresa,
            cnpj_cpf: documentoEmpresa,
          })
          .eq("id", empresa.id);

        if (empresaError) {
          throw new Error(empresaError.message);
        }
      }

      setSuccessMessage("Perfil atualizado com sucesso.");
      await loadPerfil();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao salvar perfil.";

      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadPerfil();
  }, []);

  return (
    <main className="h-[calc(100vh-73px)] overflow-y-auto bg-slate-50 p-6 pb-10 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">ReyCart</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Meu Perfil
          </h1>

          <p className="mt-2 max-w-4xl text-slate-600">
            Gerencie seus dados de acesso e as informações básicas da empresa
            vinculada à sua conta.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPerfil}
          disabled={loading}
          className="w-fit rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {errorMessage ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          Carregando perfil...
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">
              Dados do usuário
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Essas informações identificam você dentro do ReyCart.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">
                  Nome
                </label>

                <input
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">
                  E-mail
                </label>

                <input
                  value={usuario?.email || ""}
                  disabled
                  className="mt-2 h-12 w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Alteração de e-mail será liberada em uma próxima etapa.
                </p>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">
                  Perfil
                </label>

                <input
                  value={usuario?.papel || usuario?.perfil || "admin"}
                  disabled
                  className="mt-2 h-12 w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">
              Dados da empresa
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Essas informações serão usadas na conta da empresa no ReyCart.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">
                  Nome da empresa
                </label>

                <input
                  value={nomeEmpresa}
                  onChange={(event) => setNomeEmpresa(event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">
                  CNPJ ou CPF
                </label>

                <input
                  value={documentoEmpresa}
                  onChange={(event) => setDocumentoEmpresa(event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">
                  WhatsApp da empresa
                </label>

                <input
                  value={telefoneEmpresa}
                  onChange={(event) => setTelefoneEmpresa(event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm xl:col-span-2">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-blue-950">
                  Salvar alterações
                </h2>

                <p className="mt-1 text-sm text-blue-700">
                  Após salvar, atualize a página para refletir o novo nome no
                  topo do painel.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {saving ? "Salvando..." : "Salvar perfil"}
              </button>
            </div>
          </section>
        </form>
      )}
    </main>
  );
}
