"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Empresa = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  cnpj_cpf: string | null;
  documento?: string | null;
  status: string | null;
  webhook_secret: string | null;
  webhook_secret_updated_at: string | null;
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
  if (!evento) return "Evento recebido";

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

function maskSecret(secret: string | null) {
  if (!secret) return "Chave não encontrada";

  if (secret.length <= 12) {
    return "••••••••";
  }

  return `${secret.slice(0, 6)}${"•".repeat(18)}${secret.slice(-6)}`;
}

function ConfigCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
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

export default function ConfiguracoesPage() {
  const [data, setData] = useState<ConfiguracoesData>({
    empresa: null,
    webhooks: [],
    modelos: [],
  });

  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const appUrl = useMemo(() => {
    return (
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://leadflow-crm-dusky-ten.vercel.app"
    ).replace(/\/$/, "");
  }, []);

  const webhookUrl = `${appUrl}/api/webhooks/kiwify`;
  const webhookSecret = data.empresa?.webhook_secret || "";

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

      const { data: empresa, error: empresaError } = await supabase
        .from("empresas")
        .select(
          "id, nome, email, telefone, cnpj_cpf, documento, status, webhook_secret, webhook_secret_updated_at"
        )
        .eq("id", empresaId)
        .maybeSingle();

      if (empresaError) {
        throw new Error(empresaError.message);
      }

      const { data: webhooks, error: webhooksError } = await supabase
        .from("webhooks")
        .select("id, evento, processado, created_at")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (webhooksError) {
        throw new Error(webhooksError.message);
      }

      const { data: modelos, error: modelosError } = await supabase
        .from("modelos_mensagens")
        .select("id, tipo, ativo, updated_at")
        .eq("empresa_id", empresaId)
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

  async function copyWebhookSecret() {
    if (!webhookSecret) return;

    await navigator.clipboard.writeText(webhookSecret);

    setCopiedSecret(true);

    setTimeout(() => {
      setCopiedSecret(false);
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
            Gerencie os principais ajustes da sua conta, integração de vendas e
            mensagens de recuperação.
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

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          Carregando configurações...
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <ConfigCard
            title="Conta"
            description="Informações principais da empresa conectada ao ReyCart."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <InfoBox
                label="Empresa"
                value={data.empresa?.nome || "Minha empresa"}
              />

              <InfoBox
                label="Status da conta"
                value={data.empresa?.status || "Ativa"}
              />

              <InfoBox
                label="Documento"
                value={
                  data.empresa?.cnpj_cpf ||
                  data.empresa?.documento ||
                  "Não informado"
                }
              />

              <InfoBox
                label="WhatsApp"
                value={data.empresa?.telefone || "Não informado"}
              />
            </div>

            <div className="mt-5">
              <Link
                href="/perfil"
                className="inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                Editar dados da conta
              </Link>
            </div>
          </ConfigCard>

          <ConfigCard
            title="Integração da plataforma"
            description="Use a URL do webhook e a chave secreta para conectar sua plataforma de venda ao ReyCart."
          >
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  URL do webhook
                </p>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="break-all font-mono text-sm text-slate-700">
                    {webhookUrl}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Chave secreta de integração
                </p>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="break-all font-mono text-sm text-slate-700">
                    {showSecret ? webhookSecret : maskSecret(webhookSecret)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyWebhookUrl}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                {copiedWebhook ? "URL copiada" : "Copiar URL"}
              </button>

              <button
                type="button"
                onClick={copyWebhookSecret}
                disabled={!webhookSecret}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {copiedSecret ? "Chave copiada" : "Copiar chave"}
              </button>

              <button
                type="button"
                onClick={() => setShowSecret((current) => !current)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                {showSecret ? "Ocultar chave" : "Mostrar chave"}
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-700">
              Use essa chave somente dentro da sua plataforma de venda. Não
              compartilhe publicamente. Ela identifica os eventos enviados para
              a sua conta ReyCart.
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <InfoBox label="Método" value="POST" />

              <InfoBox label="Status" value="Ativo" />

              <InfoBox
                label="Chave atualizada"
                value={formatDate(
                  data.empresa?.webhook_secret_updated_at || null
                )}
              />
            </div>
          </ConfigCard>

          <ConfigCard
            title="Status da integração"
            description="Resumo dos últimos eventos recebidos pela sua conta."
          >
            <div className="grid gap-3 md:grid-cols-3">
              <InfoBox label="Últimos eventos" value={totalWebhooks} />
              <InfoBox label="Processados" value={webhooksProcessados} />
              <InfoBox label="Com erro" value={webhooksComErro} />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Último evento recebido
              </p>

              <p className="mt-2 text-sm font-bold text-slate-950">
                {ultimoWebhook
                  ? getEventLabel(ultimoWebhook.evento)
                  : "Nenhum evento recebido"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {ultimoWebhook
                  ? formatDate(ultimoWebhook.created_at)
                  : "Sem data disponível"}
              </p>
            </div>

            <div className="mt-5">
              <Link
                href="/integracoes"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Abrir detalhes da integração
              </Link>
            </div>
          </ConfigCard>

          <ConfigCard
            title="Mensagens de recuperação"
            description="Modelos usados para chamar clientes pelo WhatsApp."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <InfoBox label="Modelos cadastrados" value={data.modelos.length} />
              <InfoBox label="Modelos ativos" value={modelosAtivos} />
            </div>

            <div className="mt-4 space-y-3">
              {data.modelos.slice(0, 4).map((modelo) => (
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
            title="Atalhos"
            description="Acesse rapidamente as principais áreas do ReyCart."
          >
            <div className="grid gap-3 md:grid-cols-3">
              <Link
                href="/recuperacao"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <p className="text-sm font-bold text-slate-950">Recuperação</p>
                <p className="mt-1 text-xs text-slate-500">
                  Ver vendas pendentes.
                </p>
              </Link>

              <Link
                href="/automacoes"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <p className="text-sm font-bold text-slate-950">Automações</p>
                <p className="mt-1 text-xs text-slate-500">
                  Editar mensagens.
                </p>
              </Link>

              <Link
                href="/integracoes"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <p className="text-sm font-bold text-slate-950">Integrações</p>
                <p className="mt-1 text-xs text-slate-500">
                  Ver eventos recebidos.
                </p>
              </Link>
            </div>
          </ConfigCard>

          <ConfigCard
            title="Ajuda"
            description="Use o diagnóstico guiado para resolver dúvidas ou enviar um resumo ao suporte."
          >
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-950">
                Precisa de suporte?
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-700">
                A central de ajuda gera um diagnóstico com base no problema e
                cria um resumo pronto para envio.
              </p>

              <Link
                href="/ajuda"
                className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                Abrir ajuda inteligente
              </Link>
            </div>
          </ConfigCard>
        </div>
      )}
    </main>
  );
}