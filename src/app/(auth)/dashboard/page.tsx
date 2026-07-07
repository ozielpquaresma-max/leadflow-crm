import Link from "next/link";
import { DashboardAutoRefresh } from "@/features/dashboard/components/DashboardAutoRefresh";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DashboardVenda = {
  pedido_id: string;
  pedido_externo_id: string | null;
  empresa_id: string | null;
  cliente_id: string | null;
  cliente_nome: string | null;
  cliente_email: string | null;
  cliente_telefone: string | null;
  produto_nome: string | null;
  plataforma_nome: string | null;
  status: string | null;
  status_label: string | null;
  metodo_pagamento: string | null;
  valor: number | null;
  checkout_url: string | null;
  pix_copia_cola: string | null;
  criado_na_plataforma: string | null;
  minutos_desde_criacao: number | null;
  ultima_interacao_em: string | null;
  ultima_interacao_resultado: string | null;
  total_interacoes: number | null;
  status_recuperacao: string | null;
  recuperacao_atualizada_em: string | null;
};

type WebhookLog = {
  id: string;
  evento: string | null;
  processado: boolean | null;
  created_at: string | null;
};

function formatCurrency(value: number | null | undefined) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTempo(minutos: number | null) {
  if (!minutos) return "Agora";

  if (minutos < 60) {
    return `${Math.floor(minutos)} min`;
  }

  const horas = Math.floor(minutos / 60);

  if (horas < 24) {
    return `${horas} h`;
  }

  const dias = Math.floor(horas / 24);

  return `${dias} dia${dias > 1 ? "s" : ""}`;
}

function formatStatusRecuperacao(status: string | null) {
  if (!status || status === "pendente") return "Pendente";

  const labels: Record<string, string> = {
    convertido: "Convertido",
    aguardando_resposta: "Aguardando",
    sem_resposta: "Sem resposta",
    perdido: "Perdido",
  };

  return labels[status] || status;
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

function getStatusClass(status: string | null) {
  if (status === "pix_pendente") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  if (status === "checkout_abandonado") {
    return "bg-blue-50 text-blue-700 ring-blue-100";
  }

  if (status === "cartao_recusado") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-slate-50 text-slate-700 ring-slate-100";
}

function getRecuperacaoClass(status: string | null) {
  if (status === "convertido") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (status === "aguardando_resposta") {
    return "bg-blue-50 text-blue-700 ring-blue-100";
  }

  if (status === "sem_resposta") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  if (status === "perdido") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-slate-50 text-slate-600 ring-slate-100";
}

function getPercent(value: number, total: number) {
  if (!total) return 0;

  return Math.min(100, Math.round((value / total) * 100));
}

function getRecoveryStatus(venda: DashboardVenda) {
  return venda.status_recuperacao || "pendente";
}

function MetricCard({
  title,
  value,
  helper,
  accent,
}: {
  title: string;
  value: string | number;
  helper: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>

        {accent ? (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
            {accent}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  barClassName,
}: {
  label: string;
  value: number;
  total: number;
  barClassName: string;
}) {
  const percent = getPercent(value, total);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-sm font-bold text-slate-950">{value}</p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barClassName}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function ResultadoCard({
  title,
  value,
  helper,
  className,
}: {
  title: string;
  value: number;
  helper: string;
  className: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${className}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs opacity-80">{helper}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const { data: vendasData, error: vendasError } = await supabase
    .from("vw_recuperacao_vendas")
    .select("*")
    .order("criado_na_plataforma", { ascending: false });

  const { data: webhooksData } = await supabase
    .from("webhooks")
    .select("id, evento, processado, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const { count: totalWebhooksCount } = await supabase
    .from("webhooks")
    .select("*", { count: "exact", head: true });

  const vendas = (vendasData || []) as DashboardVenda[];
  const webhooks = (webhooksData || []) as WebhookLog[];

  const totalOportunidades = vendas.length;

  const valorEmAberto = vendas.reduce((total, venda) => {
    return total + Number(venda.valor || 0);
  }, 0);

  const pixPendentes = vendas.filter(
    (venda) => venda.status === "pix_pendente"
  ).length;

  const checkoutAbandonados = vendas.filter(
    (venda) => venda.status === "checkout_abandonado"
  ).length;

  const cartoesRecusados = vendas.filter(
    (venda) => venda.status === "cartao_recusado"
  ).length;

  const pendentes = vendas.filter(
    (venda) => getRecoveryStatus(venda) === "pendente"
  ).length;

  const convertidos = vendas.filter(
    (venda) => getRecoveryStatus(venda) === "convertido"
  ).length;

  const aguardandoResposta = vendas.filter(
    (venda) => getRecoveryStatus(venda) === "aguardando_resposta"
  ).length;

  const semResposta = vendas.filter(
    (venda) => getRecoveryStatus(venda) === "sem_resposta"
  ).length;

  const perdidos = vendas.filter(
    (venda) => getRecoveryStatus(venda) === "perdido"
  ).length;

  const valorConvertido = vendas
    .filter((venda) => getRecoveryStatus(venda) === "convertido")
    .reduce((total, venda) => total + Number(venda.valor || 0), 0);

  const taxaRecuperacao = getPercent(convertidos, totalOportunidades);
  const clientesParaAcompanhar = aguardandoResposta + semResposta;
  const ultimasOportunidades = vendas.slice(0, 6);
  const totalWebhooks = totalWebhooksCount || webhooks.length;
  const ultimoWebhook = webhooks[0] || null;

  return (
    <main className="h-[calc(100vh-73px)] overflow-y-auto bg-slate-50 p-6 pb-10 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">ReyCart</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Dashboard
          </h1>

          <p className="mt-2 max-w-4xl text-slate-600">
            Visão geral das oportunidades de recuperação, valores em aberto,
            resultados dos contatos e últimos eventos recebidos da Kiwify.
          </p>
        </div>

        <Link
          href="/recuperacao"
          className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          Abrir recuperação
        </Link>
      </div>

      {vendasError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Erro ao carregar dados do Supabase: {vendasError.message}
        </div>
      ) : null}

      <div className="mb-6">
        <DashboardAutoRefresh intervalMs={15000} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Valor recuperável"
          value={formatCurrency(valorEmAberto)}
          helper="Total em pedidos pendentes"
          accent="Ao vivo"
        />

        <MetricCard
          title="Oportunidades"
          value={totalOportunidades}
          helper="Vendas em recuperação"
        />

        <MetricCard
          title="Taxa de recuperação"
          value={`${taxaRecuperacao}%`}
          helper={`${convertidos} convertido${convertidos === 1 ? "" : "s"} de ${totalOportunidades}`}
        />

        <MetricCard
          title="Aguardando retorno"
          value={clientesParaAcompanhar}
          helper="Clientes para acompanhar"
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Pedidos por tipo de pendência
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Distribuição dos pedidos que ainda podem ser recuperados.
              </p>
            </div>

            <Link
              href="/recuperacao"
              className="text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              Ver todos
            </Link>
          </div>

          <div className="space-y-6">
            <ProgressRow
              label="PIX pendente"
              value={pixPendentes}
              total={totalOportunidades}
              barClassName="bg-amber-500"
            />

            <ProgressRow
              label="Checkout abandonado"
              value={checkoutAbandonados}
              total={totalOportunidades}
              barClassName="bg-blue-500"
            />

            <ProgressRow
              label="Cartão recusado"
              value={cartoesRecusados}
              total={totalOportunidades}
              barClassName="bg-red-500"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-950">
              Resultado da recuperação
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Situação atual das tentativas comerciais.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ResultadoCard
              title="Pendentes"
              value={pendentes}
              helper="Ainda sem tratativa"
              className="border-slate-200 bg-slate-50 text-slate-700"
            />

            <ResultadoCard
              title="Convertidos"
              value={convertidos}
              helper={formatCurrency(valorConvertido)}
              className="border-emerald-200 bg-emerald-50 text-emerald-700"
            />

            <ResultadoCard
              title="Aguardando"
              value={aguardandoResposta}
              helper="Follow-up em aberto"
              className="border-blue-200 bg-blue-50 text-blue-700"
            />

            <ResultadoCard
              title="Sem resposta"
              value={semResposta}
              helper="Necessita nova tentativa"
              className="border-amber-200 bg-amber-50 text-amber-700"
            />

            <ResultadoCard
              title="Perdidos"
              value={perdidos}
              helper="Atendimentos encerrados"
              className="border-red-200 bg-red-50 text-red-700 sm:col-span-2"
            />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Últimas oportunidades
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Pedidos mais recentes enviados pela Kiwify para recuperação.
              </p>
            </div>

            <Link
              href="/recuperacao"
              className="text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              Abrir lista completa
            </Link>
          </div>

          {ultimasOportunidades.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Nenhuma oportunidade em aberto até o momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ultimasOportunidades.map((venda) => (
                <div
                  key={venda.pedido_id}
                  className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-bold text-slate-950">
                        {venda.cliente_nome || "Cliente sem nome"}
                      </p>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${getStatusClass(
                          venda.status
                        )}`}
                      >
                        {venda.status_label || "Pendente"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${getRecuperacaoClass(
                          venda.status_recuperacao
                        )}`}
                      >
                        {formatStatusRecuperacao(venda.status_recuperacao)}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-sm text-slate-600">
                      {venda.produto_nome || "Produto não informado"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {venda.cliente_email || "E-mail não informado"} •{" "}
                      {venda.cliente_telefone || "Telefone não informado"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="sm:text-right">
                      <p className="font-bold text-slate-950">
                        {formatCurrency(venda.valor)}
                      </p>

                      <p className="text-xs text-slate-500">
                        {formatTempo(venda.minutos_desde_criacao)} •{" "}
                        {formatDate(venda.criado_na_plataforma)}
                      </p>
                    </div>

                    <Link
                      href={`/recuperacao/${venda.pedido_id}`}
                      className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-950">
              Últimos webhooks
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Eventos mais recentes recebidos pelo ReyCart.
            </p>
          </div>

          <div className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total registrado
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {totalWebhooks}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Último evento
              </p>
              <p className="mt-2 text-sm font-bold text-slate-950">
                {ultimoWebhook
                  ? getEventLabel(ultimoWebhook.evento)
                  : "Nenhum evento"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {ultimoWebhook ? formatDate(ultimoWebhook.created_at) : "Sem dados"}
              </p>
            </div>
          </div>

          {webhooks.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Nenhum webhook recebido ainda.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-start justify-between gap-3 p-5"
                >
                  <div>
                    <p className="font-semibold text-slate-950">
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
            </div>
          )}

          <div className="border-t border-slate-100 p-5">
            <Link
              href="/integracoes"
              className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              Ver integração Kiwify
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}