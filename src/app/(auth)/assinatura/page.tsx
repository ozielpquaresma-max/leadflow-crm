"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type BillingResponse = {
  ok?: boolean;
  active?: boolean;
  empresaStatus?: string | null;
  assinaturaStatus?: string | null;
  paymentStatus?: string | null;
  paymentUrl?: string | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  message?: string;
  error?: string;
  asaasStatusCode?: number;
  asaasResponse?: unknown;
};

function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Variáveis públicas do Supabase não configuradas.");
  }

  return createClient(supabaseUrl, supabaseKey);
}

export default function AssinaturaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [startingCheckout, setStartingCheckout] = useState(false);

  const [empresaStatus, setEmpresaStatus] = useState<string | null>(null);
  const [assinaturaStatus, setAssinaturaStatus] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  const [message, setMessage] = useState("Verificando sua assinatura...");
  const [debugError, setDebugError] = useState<string | null>(null);

  const pagamentoSucesso = searchParams.get("pagamento") === "sucesso";

  async function getAccessToken() {
    setDebugError(null);

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      setDebugError(`Erro ao buscar sessão: ${error.message}`);
      setMessage("Erro ao validar sua sessão. Saia e entre novamente.");
      return null;
    }

    if (session?.access_token) {
      return session.access_token;
    }

    const {
      data: { session: refreshedSession },
      error: refreshError,
    } = await supabase.auth.refreshSession();

    if (refreshError) {
      setDebugError(`Erro ao atualizar sessão: ${refreshError.message}`);
      setMessage("Sua sessão expirou. Saia e entre novamente.");
      return null;
    }

    if (refreshedSession?.access_token) {
      return refreshedSession.access_token;
    }

    setDebugError(
      "Sessão não encontrada no navegador. Faça logout e login novamente com e-mail e senha."
    );
    setMessage("Sessão não encontrada. Saia e entre novamente.");
    return null;
  }

  async function syncBilling(options?: { silent?: boolean }) {
    const token = await getAccessToken();

    if (!token) {
      setLoading(false);
      setCheckingPayment(false);
      return null;
    }

    if (!options?.silent) {
      setCheckingPayment(true);
      setMessage("Consultando o pagamento diretamente no Asaas...");
    }

    try {
      const response = await fetch("/api/billing/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const rawText = await response.text();
      let data: BillingResponse = {};

      try {
        data = rawText ? (JSON.parse(rawText) as BillingResponse) : {};
      } catch {
        data = {
          ok: false,
          error: rawText || "Resposta inválida da rota de sincronização.",
        };
      }

      setEmpresaStatus(data.empresaStatus || null);
      setAssinaturaStatus(data.assinaturaStatus || null);
      setPaymentStatus(data.paymentStatus || null);

      if (!response.ok) {
        setDebugError(
          data.error ||
            `Erro HTTP ${response.status} ao consultar /api/billing/sync`
        );
        setMessage("Não foi possível consultar sua assinatura agora.");
        return data;
      }

      if (data.active) {
        setMessage("Pagamento confirmado. Acesso liberado.");
        router.replace("/dashboard");
        return data;
      }

      if (data.paymentStatus === "PENDING") {
        setMessage(
          "A cobrança foi criada, mas o pagamento ainda está pendente no Asaas."
        );
        return data;
      }

      setMessage(
        data.message ||
          data.error ||
          "Ainda não encontramos pagamento confirmado para esta assinatura."
      );

      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";

      setDebugError(`Falha ao chamar /api/billing/sync: ${errorMessage}`);
      setMessage(
        "Não foi possível consultar o pagamento agora. Tente novamente em alguns segundos."
      );
      return null;
    } finally {
      setCheckingPayment(false);
      setLoading(false);
    }
  }

  async function startCheckout() {
    setDebugError(null);
    setPaymentLink(null);

    const token = await getAccessToken();

    if (!token) {
      setStartingCheckout(false);
      setLoading(false);
      return;
    }

    setStartingCheckout(true);
    setMessage("Gerando cobrança segura no Asaas...");

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const rawText = await response.text();
      let data: BillingResponse = {};

      try {
        data = rawText ? (JSON.parse(rawText) as BillingResponse) : {};
      } catch {
        data = {
          ok: false,
          error: rawText || "Resposta inválida da rota de checkout.",
        };
      }

      if (!response.ok || !data.ok) {
        const errorText =
          data.error ||
          data.message ||
          `Erro HTTP ${response.status} ao chamar /api/billing/checkout`;

        setDebugError(errorText);
        setMessage("Não foi possível gerar a cobrança.");
        return;
      }

      const link = data.paymentUrl || data.invoiceUrl || data.bankSlipUrl;

      if (!link) {
        setDebugError(
          "A cobrança foi criada, mas o Asaas não retornou link de pagamento."
        );
        setMessage(
          "Cobrança criada, mas não recebemos o link de pagamento. Verifique seu e-mail."
        );
        return;
      }

      setPaymentLink(link);
      setMessage("Cobrança criada. Abrindo tela de pagamento...");

      window.location.href = link;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";

      setDebugError(`Falha ao chamar /api/billing/checkout: ${errorMessage}`);
      setMessage("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setStartingCheckout(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let attempts = 0;

    async function start() {
      if (pagamentoSucesso) {
        setMessage("Pagamento recebido. Confirmando liberação do acesso...");
        await syncBilling({ silent: true });

        interval = setInterval(async () => {
          attempts += 1;

          if (attempts > 10) {
            if (interval) {
              clearInterval(interval);
            }

            setLoading(false);
            setMessage(
              "Ainda não encontramos pagamento confirmado. Clique em verificar pagamento."
            );
            return;
          }

          const result = await syncBilling({ silent: true });

          if (result?.active && interval) {
            clearInterval(interval);
          }
        }, 3000);

        return;
      }

      await syncBilling({ silent: true });
    }

    start();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagamentoSucesso]);

  const statusLabel =
    empresaStatus === "ativo"
      ? "Ativa"
      : empresaStatus === "trial"
        ? "Aguardando pagamento"
        : empresaStatus === "inativo"
          ? "Inativa"
          : "Não identificada";

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 text-slate-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Assinatura ReyCart
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Ative seu acesso ao painel
              </h1>

              <p className="mt-4 text-base leading-7 text-slate-600">
                O ReyCart libera o acesso somente depois da confirmação real do
                pagamento. Pix gerado, boleto emitido ou cobrança pendente não
                liberam a plataforma.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm">
              <p className="text-slate-500">Status da assinatura</p>
              <p className="mt-1 text-lg font-bold text-blue-800">
                {statusLabel}
              </p>
              {assinaturaStatus && (
                <p className="mt-1 text-xs text-slate-500">
                  Assinatura: {assinaturaStatus}
                </p>
              )}
              {paymentStatus && (
                <p className="mt-1 text-xs text-slate-500">
                  Pagamento: {paymentStatus}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-bold text-slate-950">Plano Mensal</h2>

            <div className="mt-5 flex items-end gap-2">
              <span className="text-5xl font-black tracking-tight text-slate-950">
                R$49
              </span>
              <span className="pb-2 text-slate-500">/mês</span>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-600">
              Inclui painel de recuperação de vendas, leitura de eventos da
              plataforma integrada, organização de pedidos e base de clientes.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">
                Regra de segurança:
              </p>
              <p className="mt-1">
                O acesso só é liberado quando o Asaas retorna pagamento
                confirmado ou recebido.
              </p>
            </div>

            <button
              type="button"
              onClick={startCheckout}
              disabled={startingCheckout || checkingPayment}
              className="mt-6 w-full rounded-2xl bg-blue-700 px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {startingCheckout ? "Gerando cobrança..." : "Assinar agora"}
            </button>

            <button
              type="button"
              onClick={() => syncBilling()}
              disabled={checkingPayment || startingCheckout}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkingPayment
                ? "Verificando pagamento..."
                : "Já paguei, verificar pagamento"}
            </button>

            {paymentLink && (
              <a
                href={paymentLink}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block w-full rounded-2xl bg-emerald-600 px-5 py-4 text-center text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Abrir pagamento do Asaas
              </a>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-slate-950">
              Situação atual
            </h2>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm leading-6 text-slate-700">
                {loading ? "Carregando..." : message}
              </p>
            </div>

            {debugError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">
                  Erro técnico
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-red-800">
                  {debugError}
                </p>
              </div>
            )}

            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <span>Conta</span>
                <strong className="text-slate-950">{statusLabel}</strong>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <span>Cobrança pendente</span>
                <strong className="text-slate-950">
                  {paymentStatus === "PENDING" ? "Sim" : "Não identificada"}
                </strong>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <span>Liberação automática</span>
                <strong className="text-slate-950">
                  {empresaStatus === "ativo" ? "Liberada" : "Aguardando"}
                </strong>
              </div>
            </div>

            <p className="mt-6 text-xs leading-5 text-slate-500">
              Se você acabou de pagar, a confirmação pode levar alguns segundos.
              Use o botão de verificação para consultar o Asaas novamente.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
