"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Empresa = {
  id: string;
  nome: string | null;
  slug: string | null;
};

type WebhookLog = {
  id: string;
  evento: string | null;
  processado: boolean | null;
  created_at: string | null;
};

type ModeloMensagem = {
  id: string;
  tipo: string | null;
  ativo: boolean | null;
  updated_at: string | null;
};

type ConfiguracoesData = {
  empresa: Empresa | null;
  webhooks: WebhookLog[];
  modelos: ModeloMensagem[];
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
    pix_pendente: "PIX pendente",
    checkout_abandonado: "Checkout abandonado",
    cartao_recusado: "Cartão recusado",
    pago: "Compra aprovada",
  };

  return labels[evento] || evento;
}

function getModeloLabel(tipo: string | null) {
  if (!tipo) return "Modelo sem tipo";

  const labels: Record<string, string> = {
    pix_pendente: "PIX pendente",
    checkout_abandonado: "Checkout abandonado",
    cartao_recusado: "Cartão recusado",
    aguardando_resposta: "Aguardando resposta",
    sem_resposta: "Sem resposta",
    ultima_tentativa: "Última tentativa",
  };

  return labels[tipo] || tipo;
}

function ConfigCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      {children}
    </section>
  );
}

function InfoRow({
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

export default function ConfiguracoesPage() {
  const [data, setData] = useState<ConfiguracoesData>({
    empresa: null,
    webhooks: [],
    modelos: [],
  });

  const [loading, setLoading] = useState(true);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const appUrl = useMemo(() => {
    return (
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://leadflow-crm-dusky-ten.vercel.app"
    ).replace(/\/$/, "");
  }, []);

  const webhookUrl = `${appUrl}/api/webhooks/kiwify`;

  const totalWebhooks = data.webhooks.length;
  const webhooksProcessados = data.webhooks.filter(
    (webhook) => webhook.processado === true
  ).length;
  const webhooksComErro = data.webhooks.filter(
    (webhook) => webhook.processado === false
  ).length;
  const ultimoWebhook = data.webhooks[0] || null;

  const modelosAtivos = data.modelos.filter(
    (modelo) => modelo.ativo === true
  ).length;

  async function loadConfiguracoes() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data: empresa, error: empresaError } = await supabase
        .from("empresas")
        .select("id, nome, slug")
        .eq("slug", "leadflow-crm")
        .single();

      if (empresaError) {
        throw new Error(empresaError.message);
      }

      if (!empresa?.id) {
        throw new Error("Empresa leadflow-crm não encontrada.");
      }

      const { data: webhooks, error: webhooksError } = await supabase
        .from("webhooks")
        .select("id, evento, processado, created_at")
        .eq("empresa_id", empresa.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (webhooksError) {
        throw new Error(webhooksError.message);
      }

      const { data: modelos, error: modelosError } = await supabase
        .from("modelos_mensagens")
        .select("id, tipo, ativo, updated_at")
        .eq("empresa_id", empresa.id)
        .order("updated_at", { ascending: false });

      if (modelosError) {
        throw new Error(modelosError.message);
      }

      setData({
        empresa: empresa as Empresa,
        webhooks: (webhooks || []) as WebhookLog[],
        modelos: (modelos || []) as ModeloMensagem[],
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao carregar configurações.";

      setErrorMessage(message);
      console.error("Erro ao carregar configurações:", error);
    } finally {
      setLoading(false);
    }
  }

  async function copyWebhookUrl() {
    await navigator.clipboard.writeText(webhookUrl);

    setCopiedWebhook(true);

    setTimeout(() => {
      setCopiedWebhook(false);
    }, 2000);
  }

  useEffect(() => {
    loadConfiguracoes();
  }, []);

  return (
    <main className="h-[calc(100vh-73px)] overflow-y-auto bg-slate-50 p-6 pb-10 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">ReyCart</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Configurações
          </h1>

          <p className="mt-2 max-w-4xl text-slate-600">
            Central de controle do ReyCart para empresa, integração Kiwify,
            webhooks, modelos de mensagens e ajustes operacionais.
          </p>
        </div>

        <button
          type="button"
          onClick={loadConfiguracoes}
          disabled={loading}
          className="w-fit rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {errorMessage ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Erro ao carregar configurações: {errorMessage}
        </div>
      ) : null}

      <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-blue-950">
              Ambiente ReyCart ativo
            </h2>

            <p className="mt-1 text-sm text-blue-700">
              Esta página centraliza os principais dados técnicos e operacionais
              do sistema.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/recuperacao"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              Recuperação
            </Link>

            <Link
              href="/automacoes"
              className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              Automações
            </Link>

            <Link
              href="/integracoes"
              className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              Integrações
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          Carregando configurações do ReyCart...
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <ConfigCard
            title="Empresa"
            description="Dados internos usados para vincular pedidos, webhooks e automações."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <InfoRow
                label="Nome da empresa"
                value={data.empresa?.nome || "LeadFlow CRM"}
              />

              <InfoRow
                label="Slug interno"
                value={data.empresa?.slug || "leadflow-crm"}
              />

              <div className="md:col-span-2">
                <InfoRow
                  label="ID da empresa"
                  value={data.empresa?.id || "Não encontrado"}
                />
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
              O slug interno ainda pode continuar como{" "}
              <span className="font-bold">leadflow-crm</span>. Isso não aparece
              para o cliente final e não precisa ser trocado agora.
            </div>
          </ConfigCard>

          <ConfigCard
            title="Webhook Kiwify"
            description="URL usada pela Kiwify para enviar vendas, PIX pendentes e carrinhos abandonados."
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="break-all font-mono text-sm text-slate-700">
                {webhookUrl}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyWebhookUrl}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                {copiedWebhook ? "URL copiada" : "Copiar URL"}
              </button>

              <Link
                href="/integracoes"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Ver integração
              </Link>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <InfoRow label="Método" value="POST" />
              <InfoRow label="Status" value="Ativo" />
              <InfoRow label="Origem" value="Kiwify" />
            </div>
          </ConfigCard>

          <ConfigCard
            title="Status dos webhooks"
            description="Resumo dos eventos mais recentes recebidos pelo ReyCart."
          >
            <div className="grid gap-3 md:grid-cols-3">
              <InfoRow label="Últimos eventos" value={totalWebhooks} />
              <InfoRow label="Processados" value={webhooksProcessados} />
              <InfoRow label="Com erro" value={webhooksComErro} />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Último webhook
              </p>

              <p className="mt-2 text-sm font-bold text-slate-950">
                {ultimoWebhook
                  ? getEventLabel(ultimoWebhook.evento)
                  : "Nenhum webhook recebido"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {ultimoWebhook
                  ? formatDate(ultimoWebhook.created_at)
                  : "Sem data disponível"}
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {data.webhooks.slice(0, 5).map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      {getEventLabel(webhook.evento)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(webhook.created_at)}
                    </p>
                  </div>

                  <span
                    className={
                      webhook.processado
                        ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100"
                        : "rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-100"
                    }
                  >
                    {webhook.processado ? "Processado" : "Erro"}
                  </span>
                </div>
              ))}

              {data.webhooks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  Nenhum webhook recebido ainda.
                </div>
              ) : null}
            </div>
          </ConfigCard>

          <ConfigCard
            title="Modelos de mensagens"
            description="Mensagens salvas no Supabase e usadas no botão de WhatsApp."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <InfoRow label="Modelos cadastrados" value={data.modelos.length} />
              <InfoRow label="Modelos ativos" value={modelosAtivos} />
            </div>

            <div className="mt-4 space-y-3">
              {data.modelos.map((modelo) => (
                <div
                  key={modelo.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      {getModeloLabel(modelo.tipo)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Atualizado em {formatDate(modelo.updated_at)}
                    </p>
                  </div>

                  <span
                    className={
                      modelo.ativo
                        ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100"
                        : "rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-100"
                    }
                  >
                    {modelo.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              ))}

              {data.modelos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  Nenhum modelo de mensagem encontrado.
                </div>
              ) : null}
            </div>

            <div className="mt-5">
              <Link
                href="/automacoes"
                className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                Editar mensagens
              </Link>
            </div>
          </ConfigCard>

          <ConfigCard
            title="Ambiente do aplicativo"
            description="Informações públicas do ambiente usado no deploy."
          >
            <div className="grid gap-3">
              <InfoRow label="Aplicativo" value="ReyCart" />
              <InfoRow label="URL pública" value={appUrl} />
              <InfoRow label="Banco de dados" value="Supabase" />
              <InfoRow label="Deploy" value="Vercel" />
            </div>
          </ConfigCard>

          <ConfigCard
            title="Próximas configurações"
            description="Itens que vamos liberar nas próximas etapas do SaaS."
          >
            <div className="space-y-3">
              {[
                "Editar nome público da empresa",
                "Configurar assinatura e plano do cliente",
                "Gerenciar usuários da conta",
                "Configurar múltiplas plataformas",
                "Definir tempo automático de follow-up",
                "Ativar notificações internas",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <p className="text-sm font-semibold text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </ConfigCard>
        </div>
      )}
    </main>
  );
}