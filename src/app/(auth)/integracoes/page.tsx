"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type WebhookLog = {
  id: string;
  empresa_id: string | null;
  plataforma_id: string | null;
  evento: string | null;
  processado: boolean | null;
  payload: Record<string, unknown> | null;
  created_at: string | null;
};

type IntegrationStatus = {
  empresaId: string | null;
  plataformaId: string | null;
  logs: WebhookLog[];
};

function formatDate(value: string | null) {
  if (!value) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getEventLabel(evento: string | null) {
  if (!evento) return "Evento não informado";

  const labels: Record<string, string> = {
    pix_created: "PIX gerado",
    boleto_created: "Boleto gerado",
    cart_abandoned: "Carrinho abandonado",
    checkout_abandoned: "Checkout abandonado",
    order_rejected: "Compra recusada",
    order_approved: "Compra aprovada",
    kiwify_event: "Evento Kiwify",
  };

  return labels[evento] || evento;
}

function getPayloadText(payload: Record<string, unknown> | null) {
  if (!payload) return "Payload não disponível";

  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return "Payload não disponível";
  }
}

function MetricCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

export default function IntegracoesPage() {
  const [data, setData] = useState<IntegrationStatus>({
    empresaId: null,
    plataformaId: null,
    logs: [],
  });

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const webhookUrl = useMemo(() => {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://leadflow-crm-dusky-ten.vercel.app";

    return `${appUrl.replace(/\/$/, "")}/api/webhooks/kiwify`;
  }, []);

  const totalWebhooks = data.logs.length;
  const processados = data.logs.filter((log) => log.processado).length;
  const comErro = data.logs.filter((log) => !log.processado).length;
  const ultimoWebhook = data.logs[0] || null;

  async function loadIntegrationStatus() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data: empresa, error: empresaError } = await supabase
        .from("empresas")
        .select("id")
        .eq("slug", "leadflow-crm")
        .single();

      if (empresaError) {
        throw empresaError;
      }

      const { data: plataforma, error: plataformaError } = await supabase
        .from("plataformas")
        .select("id")
        .eq("slug", "kiwify")
        .single();

      if (plataformaError) {
        throw plataformaError;
      }

      if (!empresa?.id || !plataforma?.id) {
        throw new Error("Empresa ou plataforma Kiwify não encontrada.");
      }

      const { data: logs, error: logsError } = await supabase
        .from("webhooks")
        .select("id, empresa_id, plataforma_id, evento, processado, payload, created_at")
        .eq("empresa_id", empresa.id)
        .eq("plataforma_id", plataforma.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (logsError) {
        throw logsError;
      }

      setData({
        empresaId: empresa.id,
        plataformaId: plataforma.id,
        logs: (logs || []) as WebhookLog[],
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao carregar integração.";

      setErrorMessage(message);
      console.error("Erro ao carregar integração:", error);
    } finally {
      setLoading(false);
    }
  }

  async function copyWebhookUrl() {
    await navigator.clipboard.writeText(webhookUrl);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  useEffect(() => {
    loadIntegrationStatus();
  }, []);

  return (
    <main className="h-[calc(100vh-73px)] overflow-y-auto bg-slate-50 p-6 pb-10 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">ReyCart</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Integrações
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            Acompanhe a conexão com a Kiwify, consulte a URL do webhook e veja
            os últimos eventos recebidos pelo ReyCart.
          </p>
        </div>

        <button
          type="button"
          onClick={loadIntegrationStatus}
          disabled={loading}
          className="w-fit rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Atualizando..." : "Atualizar status"}
        </button>
      </div>

      {errorMessage ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Erro ao carregar integração: {errorMessage}
        </div>
      ) : null}

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-950">
                Webhook Kiwify
              </h2>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                Ativo
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Use esta URL no painel de webhooks da Kiwify.
            </p>
          </div>

          <button
            type="button"
            onClick={copyWebhookUrl}
            className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            {copied ? "URL copiada" : "Copiar URL"}
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="break-all font-mono text-sm text-slate-700">
            {webhookUrl}
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Método
            </p>
            <p className="mt-1 text-sm font-bold text-slate-950">POST</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Evento principal
            </p>
            <p className="mt-1 text-sm font-bold text-slate-950">
              Recuperação de vendas
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Status técnico
            </p>
            <p className="mt-1 text-sm font-bold text-emerald-700">
              Rota publicada
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Webhooks recebidos"
          value={totalWebhooks}
          helper="Últimos 20 eventos carregados"
        />

        <MetricCard
          title="Processados"
          value={processados}
          helper="Eventos salvos e tratados"
        />

        <MetricCard
          title="Com erro"
          value={comErro}
          helper="Eventos recebidos sem processamento concluído"
        />

        <MetricCard
          title="Último evento"
          value={ultimoWebhook ? getEventLabel(ultimoWebhook.evento) : "Nenhum"}
          helper={ultimoWebhook ? formatDate(ultimoWebhook.created_at) : "Sem eventos ainda"}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Últimos webhooks recebidos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Lista dos eventos mais recentes enviados pela Kiwify.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Carregando eventos da integração...
          </div>
        ) : data.logs.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Nenhum webhook recebido ainda.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.logs.map((log) => (
              <details key={log.id} className="group p-5">
                <summary className="flex cursor-pointer list-none flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-950">
                        {getEventLabel(log.evento)}
                      </p>

                      <span
                        className={
                          log.processado
                            ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100"
                            : "rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-100"
                        }
                      >
                        {log.processado ? "Processado" : "Erro"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Recebido em {formatDate(log.created_at)}
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-blue-600">
                    Ver payload
                  </span>
                </summary>

                <pre className="mt-4 max-h-[360px] overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                  {getPayloadText(log.payload)}
                </pre>
              </details>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}