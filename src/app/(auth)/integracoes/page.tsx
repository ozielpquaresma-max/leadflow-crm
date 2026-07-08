"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type WebhookLog = {
  id: string;
  empresa_id: string | null;
  plataforma_id: string | null;
  evento: string | null;
  processado: boolean | null;
  payload: unknown;
  created_at: string | null;
};

type Integracao = {
  id: string;
  empresa_id: string;
  plataforma: string;
  nome: string;
  token_plataforma: string | null;
  tipo_token: string | null;
  status: string | null;
  ultimo_evento_em: string | null;
  ultimo_evento_status: string | null;
  updated_at: string | null;
};

type IntegrationMetrics = {
  totalWebhooks: number;
  processados: number;
  comErro: number;
};

type IntegrationStatus = {
  empresaId: string | null;
  integracao: Integracao | null;
  logs: WebhookLog[];
  metrics: IntegrationMetrics;
};

function normalizeDateValue(value: string | null) {
  if (!value) return null;

  const hasTimezone =
    value.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(value);

  return hasTimezone ? value : `${value}Z`;
}

function formatDate(value: string | null) {
  if (!value) return "Não informado";

  const normalizedValue = normalizeDateValue(value);

  if (!normalizedValue) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Belem",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(normalizedValue));
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
    kiwify_event: "Evento recebido",
    pix_pendente: "PIX pendente",
    checkout_abandonado: "Checkout abandonado",
    cartao_recusado: "Cartão recusado",
    pago: "Compra aprovada",
  };

  return labels[evento] || evento;
}

function getPayloadText(payload: unknown) {
  if (!payload) return "Payload não disponível";

  try {
    if (typeof payload === "string") {
      return payload;
    }

    return JSON.stringify(payload, null, 2);
  } catch {
    return "Payload não disponível";
  }
}

function maskToken(token: string | null) {
  if (!token) return "Token não cadastrado";

  if (token.length <= 4) {
    return "••••";
  }

  return `${token.slice(0, 2)}${"•".repeat(8)}${token.slice(-2)}`;
}

function getStatusLabel(status: string | null, hasToken: boolean) {
  if (!hasToken) return "Pendente";

  const labels: Record<string, string> = {
    ativo: "Ativa",
    pendente: "Pendente",
    erro: "Com erro",
    inativo: "Inativa",
  };

  return labels[status || ""] || "Ativa";
}

function getStatusClass(status: string | null, hasToken: boolean) {
  if (!hasToken || status === "pendente") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  if (status === "erro") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-emerald-50 text-emerald-700 ring-emerald-100";
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

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-all text-sm font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

export default function IntegracoesPage() {
  const [data, setData] = useState<IntegrationStatus>({
    empresaId: null,
    integracao: null,
    logs: [],
    metrics: {
      totalWebhooks: 0,
      processados: 0,
      comErro: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [copiedFinalUrl, setCopiedFinalUrl] = useState(false);
  const [copiedBaseUrl, setCopiedBaseUrl] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const webhookBaseUrl = useMemo(() => {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://leadflow-crm-dusky-ten.vercel.app";

    return `${appUrl.replace(/\/$/, "")}/api/webhooks/kiwify`;
  }, []);

  const tokenSalvo = data.integracao?.token_plataforma || "";
  const webhookFinalUrl = tokenSalvo
    ? `${webhookBaseUrl}?token=${encodeURIComponent(tokenSalvo)}`
    : "";

  const hasToken = Boolean(tokenSalvo);
  const totalWebhooks = data.metrics.totalWebhooks;
  const processados = data.metrics.processados;
  const comErro = data.metrics.comErro;
  const ultimoWebhook = data.logs[0] || null;

  const statusLabel = getStatusLabel(data.integracao?.status || null, hasToken);
  const statusClass = getStatusClass(data.integracao?.status || null, hasToken);

  async function loadIntegrationStatus() {
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

      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (usuarioError) {
        throw new Error(usuarioError.message);
      }

      const empresaId = usuario?.empresa_id as string | undefined;

      if (!empresaId) {
        throw new Error("Empresa vinculada à conta não encontrada.");
      }

      const { data: integracaoExistente, error: integracaoError } =
        await supabase
          .from("integracoes")
          .select(
            "id, empresa_id, plataforma, nome, token_plataforma, tipo_token, status, ultimo_evento_em, ultimo_evento_status, updated_at"
          )
          .eq("empresa_id", empresaId)
          .eq("plataforma", "kiwify")
          .maybeSingle();

      if (integracaoError) {
        throw new Error(integracaoError.message);
      }

      let integracao = integracaoExistente as Integracao | null;

      if (!integracao) {
        const { data: novaIntegracao, error: novaIntegracaoError } =
          await supabase
            .from("integracoes")
            .insert({
              empresa_id: empresaId,
              plataforma: "kiwify",
              nome: "Kiwify",
              tipo_token: "query_token",
              status: "pendente",
            })
            .select(
              "id, empresa_id, plataforma, nome, token_plataforma, tipo_token, status, ultimo_evento_em, ultimo_evento_status, updated_at"
            )
            .single();

        if (novaIntegracaoError) {
          throw new Error(novaIntegracaoError.message);
        }

        integracao = novaIntegracao as Integracao;
      }

      const [
        totalWebhooksResult,
        processadosResult,
        comErroResult,
        logsResult,
      ] = await Promise.all([
        supabase
          .from("webhooks")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", empresaId),

        supabase
          .from("webhooks")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", empresaId)
          .eq("processado", true),

        supabase
          .from("webhooks")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", empresaId)
          .eq("processado", false),

        supabase
          .from("webhooks")
          .select(
            "id, empresa_id, plataforma_id, evento, processado, payload, created_at"
          )
          .eq("empresa_id", empresaId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (totalWebhooksResult.error) {
        throw new Error(totalWebhooksResult.error.message);
      }

      if (processadosResult.error) {
        throw new Error(processadosResult.error.message);
      }

      if (comErroResult.error) {
        throw new Error(comErroResult.error.message);
      }

      if (logsResult.error) {
        throw new Error(logsResult.error.message);
      }

      setData({
        empresaId,
        integracao,
        logs: (logsResult.data || []) as WebhookLog[],
        metrics: {
          totalWebhooks: totalWebhooksResult.count || 0,
          processados: processadosResult.count || 0,
          comErro: comErroResult.count || 0,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido.";

      setErrorMessage(message);
      console.error("Erro ao carregar integração:", error);
    } finally {
      setLoading(false);
    }
  }

  async function copyFinalWebhookUrl() {
    if (!webhookFinalUrl) return;

    await navigator.clipboard.writeText(webhookFinalUrl);

    setCopiedFinalUrl(true);

    setTimeout(() => {
      setCopiedFinalUrl(false);
    }, 2000);
  }

  async function copyBaseWebhookUrl() {
    await navigator.clipboard.writeText(webhookBaseUrl);

    setCopiedBaseUrl(true);

    setTimeout(() => {
      setCopiedBaseUrl(false);
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
            Conecte uma plataforma disponível ao ReyCart e acompanhe os eventos
            recebidos pela sua empresa.
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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-950">
                Integração disponível: Kiwify
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusClass}`}
              >
                {statusLabel}
              </span>
            </div>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              No momento, o ReyCart possui conexão disponível com a Kiwify. Para
              ativar, salve o token da Kiwify em Configurações e depois copie a
              URL final gerada automaticamente.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/configuracoes"
              className="w-fit rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              Configurar token
            </Link>

            <button
              type="button"
              onClick={copyFinalWebhookUrl}
              disabled={!webhookFinalUrl}
              className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {copiedFinalUrl ? "URL final copiada" : "Copiar URL final"}
            </button>
          </div>
        </div>

        {!hasToken ? (
          <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-700">
            Esta integração ainda está pendente porque nenhum token foi salvo.
            A URL final ficará disponível depois que o token da Kiwify for
            cadastrado em Configurações.
          </div>
        ) : null}

        <div
          className={
            webhookFinalUrl
              ? "mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
              : "mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"
          }
        >
          <p
            className={
              webhookFinalUrl
                ? "break-all font-mono text-sm font-bold text-emerald-800"
                : "break-all text-sm font-medium text-slate-500"
            }
          >
            {webhookFinalUrl ||
              "Salve primeiro o token da Kiwify para gerar a URL final do webhook."}
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <InfoBox label="Método" value="POST" />

          <InfoBox label="Plataforma" value="Kiwify" />

          <InfoBox label="Validação" value="Token na URL" />

          <InfoBox
            label="Token salvo"
            value={hasToken ? maskToken(tokenSalvo) : "Não cadastrado"}
          />
        </div>

        <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-bold text-slate-700">
            Ver URL base técnica
          </summary>

          <div className="mt-3 rounded-xl bg-white p-3">
            <p className="break-all font-mono text-xs text-slate-600">
              {webhookBaseUrl}
            </p>
          </div>

          <button
            type="button"
            onClick={copyBaseWebhookUrl}
            className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            {copiedBaseUrl ? "URL base copiada" : "Copiar URL base"}
          </button>
        </details>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Eventos recebidos"
          value={totalWebhooks}
          helper="Total recebido pela sua empresa"
        />

        <MetricCard
          title="Processados"
          value={processados}
          helper="Eventos processados com sucesso"
        />

        <MetricCard
          title="Com erro"
          value={comErro}
          helper="Eventos que precisam de atenção"
        />

        <MetricCard
          title="Último evento"
          value={ultimoWebhook ? getEventLabel(ultimoWebhook.evento) : "Nenhum"}
          helper={
            ultimoWebhook
              ? formatDate(ultimoWebhook.created_at)
              : "Sem eventos ainda"
          }
        />
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <InfoBox label="Status da integração" value={statusLabel} />

        <InfoBox
          label="Último evento da integração"
          value={formatDate(data.integracao?.ultimo_evento_em || null)}
        />

        <InfoBox
          label="Último status"
          value={data.integracao?.ultimo_evento_status || "Não informado"}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Últimos eventos recebidos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Lista dos 20 eventos mais recentes recebidos para esta empresa.
            </p>
          </div>

          <Link
            href="/configuracoes"
            className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Ajustar token
          </Link>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Carregando eventos da integração...
          </div>
        ) : data.logs.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Nenhum evento recebido ainda. Depois que a integração for ativada e
            testada na Kiwify, os eventos aparecerão aqui.
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