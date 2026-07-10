"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AssinaturaStatus = {
  empresaNome: string;
  empresaStatus: string;
  assinaturaStatus: string | null;
};

type CheckoutResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
};

export default function AssinaturaPage() {
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [status, setStatus] = useState<AssinaturaStatus | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [documento, setDocumento] = useState("");
  const [billingType, setBillingType] = useState<"UNDEFINED" | "PIX" | "BOLETO">(
    "UNDEFINED"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoadingStatus(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;

      if (!userId) {
        setErrorMessage("Sessão não encontrada. Faça login novamente.");
        return;
      }

      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .select("empresa_id, nome, email")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (usuarioError) {
        throw new Error(usuarioError.message);
      }

      if (!usuario?.empresa_id) {
        throw new Error("Usuário interno não encontrado.");
      }

      const { data: empresa, error: empresaError } = await supabase
        .from("empresas")
        .select("id, nome, email, telefone, status")
        .eq("id", usuario.empresa_id)
        .maybeSingle();

      if (empresaError) {
        throw new Error(empresaError.message);
      }

      if (!empresa) {
        throw new Error("Empresa não encontrada.");
      }

      const { data: assinatura } = await supabase
        .from("assinaturas")
        .select("status")
        .eq("empresa_id", usuario.empresa_id)
        .eq("atual", true)
        .maybeSingle();

      const empresaNome = empresa.nome || "Sua empresa";
      const empresaEmail = empresa.email || usuario.email || "";

      setStatus({
        empresaNome,
        empresaStatus: empresa.status || "trial",
        assinaturaStatus: assinatura?.status || null,
      });

      setNome((current) => current || empresaNome);
      setEmail((current) => current || empresaEmail);
      setTelefone((current) => current || empresa.telefone || "");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os dados da assinatura.";

      setErrorMessage(message);
    } finally {
      setLoadingStatus(false);
    }
  }

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setPaymentLink(null);

    if (!nome.trim()) {
      setErrorMessage("Informe o nome do assinante ou da empresa.");
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Informe o e-mail de cobrança.");
      setLoading(false);
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Sessão não encontrada. Faça login novamente.");
      }

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          nome,
          email,
          telefone,
          documento,
          billingType,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | CheckoutResponse
        | null;

      if (!response.ok || !result?.ok) {
        throw new Error(
          result?.error || "Não foi possível iniciar sua assinatura."
        );
      }

      const link = result.invoiceUrl || result.bankSlipUrl || null;

      setPaymentLink(link);

      setSuccessMessage(
        "Assinatura criada com sucesso. Após a confirmação do pagamento, seu acesso será liberado automaticamente."
      );

      await loadStatus();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao iniciar assinatura.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-5 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950">
              <Image
                src="/brand/reycart-logo.png"
                alt="Logo ReyCart"
                width={48}
                height={48}
                className="h-10 w-10 object-contain"
                priority
              />
            </div>

            <div>
              <p className="text-xl font-black text-slate-950">ReyCart</p>
              <p className="text-sm font-medium text-slate-500">
                Assinatura mensal
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-blue-50 px-5 py-3 text-blue-700">
            <p className="text-xs font-black uppercase tracking-wide">
              Plano profissional
            </p>
            <p className="text-2xl font-black">R$ 49,00/mês</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              Ative seu acesso
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Libere o uso completo do ReyCart para recuperar vendas pendentes,
              organizar oportunidades e acompanhar seus atendimentos em um único
              painel.
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">
                O plano inclui:
              </p>

              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>✓ Painel de recuperação de vendas</p>
                <p>✓ Gestão de oportunidades por cliente</p>
                <p>✓ Mensagens prontas para atendimento</p>
                <p>✓ Integração automática por eventos</p>
                <p>✓ Atualizações incluídas no plano</p>
              </div>
            </div>

            {status ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <p>
                  <span className="font-bold text-slate-900">Empresa:</span>{" "}
                  {status.empresaNome}
                </p>

                <p className="mt-1">
                  <span className="font-bold text-slate-900">
                    Status da conta:
                  </span>{" "}
                  {status.empresaStatus}
                </p>

                <p className="mt-1">
                  <span className="font-bold text-slate-900">
                    Status da assinatura:
                  </span>{" "}
                  {status.assinaturaStatus || "sem assinatura ativa"}
                </p>
              </div>
            ) : null}

            {loadingStatus ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                Carregando assinatura...
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-950">
                Dados para ativação
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Preencha os dados abaixo para gerar sua assinatura mensal.
              </p>
            </div>

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

            {paymentLink ? (
              <a
                href={paymentLink}
                target="_blank"
                rel="noreferrer"
                className="mb-4 block rounded-2xl bg-blue-600 px-5 py-4 text-center text-sm font-black text-white transition hover:bg-blue-700"
              >
                Abrir pagamento
              </a>
            ) : null}

            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">
                  Nome do assinante ou empresa
                </label>

                <input
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  placeholder="Ex: Minha Loja Digital"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">
                  E-mail de cobrança
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  placeholder="voce@empresa.com"
                  disabled={loading}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-700">
                    WhatsApp
                  </label>

                  <input
                    value={telefone}
                    onChange={(event) => setTelefone(event.target.value)}
                    className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    placeholder="Opcional"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">
                    CPF ou CNPJ
                  </label>

                  <input
                    value={documento}
                    onChange={(event) => setDocumento(event.target.value)}
                    className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    placeholder="Recomendado"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">
                  Forma de pagamento
                </label>

                <select
                  value={billingType}
                  onChange={(event) =>
                    setBillingType(
                      event.target.value as "UNDEFINED" | "PIX" | "BOLETO"
                    )
                  }
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  disabled={loading}
                >
                  <option value="UNDEFINED">Escolher na próxima etapa</option>
                  <option value="PIX">Pix</option>
                  <option value="BOLETO">Boleto</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? "Gerando assinatura..." : "Assinar por R$ 49,00/mês"}
              </button>

              <p className="text-center text-xs leading-5 text-slate-500">
                O acesso será liberado automaticamente após a confirmação do
                pagamento.
              </p>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}