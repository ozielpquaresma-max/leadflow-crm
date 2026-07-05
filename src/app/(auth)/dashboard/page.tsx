import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RecuperacaoVenda = {
  pedido_id: string;
  cliente_nome: string | null;
  cliente_email: string | null;
  cliente_telefone: string | null;
  produto_nome: string | null;
  plataforma_nome: string | null;
  status: string | null;
  status_label: string | null;
  metodo_pagamento: string | null;
  valor: number | null;
  minutos_desde_criacao: number | null;
  prioridade_recuperacao: number | null;
  ultima_interacao_em: string | null;
  ultima_interacao_resultado: string | null;
  total_interacoes: number | null;
  status_recuperacao: string | null;
  recuperacao_atualizada_em: string | null;
  criado_na_plataforma: string | null;
};

function formatCurrency(value: number | null) {
  if (!value) return "R$ 0,00";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
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

function formatResultado(resultado: string | null) {
  if (!resultado) return "Nenhum contato";

  const labels: Record<string, string> = {
    whatsapp_aberto: "WhatsApp aberto",
    checkout_aberto: "Checkout aberto",
    pix_copiado: "PIX copiado",
    mensagem_enviada: "Mensagem enviada",
    aguardando_resposta: "Aguardando resposta",
    convertido: "Convertido",
    sem_resposta: "Sem resposta",
    perdido: "Perdido",
  };

  return labels[resultado] || resultado;
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

function getStatusRecuperacaoClass(status: string | null) {
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

function getPercentual(parte: number, total: number) {
  if (!total) return 0;
  return Math.round((parte / total) * 100);
}

function MetricCard({
  title,
  value,
  helper,
  href,
}: {
  title: string;
  value: string | number;
  helper: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-100 hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>

      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export default async function DashboardPage() {
  const { data, error } = await supabase
    .from("vw_recuperacao_vendas")
    .select("*")
    .order("criado_na_plataforma", { ascending: false });

  const vendas = (data || []) as RecuperacaoVenda[];

  const totalEmAberto = vendas.reduce((total, venda) => {
    return total + Number(venda.valor || 0);
  }, 0);

  const totalOportunidades = vendas.length;

  const pixPendentes = vendas.filter(
    (venda) => venda.status === "pix_pendente"
  ).length;

  const checkoutAbandonado = vendas.filter(
    (venda) => venda.status === "checkout_abandonado"
  ).length;

  const cartaoRecusado = vendas.filter(
    (venda) => venda.status === "cartao_recusado"
  ).length;

  const pendentes = vendas.filter(
    (venda) =>
      !venda.status_recuperacao || venda.status_recuperacao === "pendente"
  ).length;

  const convertidos = vendas.filter(
    (venda) => venda.status_recuperacao === "convertido"
  ).length;

  const aguardando = vendas.filter(
    (venda) => venda.status_recuperacao === "aguardando_resposta"
  ).length;

  const semResposta = vendas.filter(
    (venda) => venda.status_recuperacao === "sem_resposta"
  ).length;

  const perdidos = vendas.filter(
    (venda) => venda.status_recuperacao === "perdido"
  ).length;

  const taxaConversao = getPercentual(convertidos, totalOportunidades);

  const ultimasOportunidades = vendas.slice(0, 6);

  return (
    <main className="h-[calc(100vh-73px)] overflow-y-auto bg-slate-50 p-6 pb-10 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">LeadFlow CRM</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Dashboard
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            Visão geral das oportunidades em recuperação, valores em aberto e
            andamento dos contatos comerciais.
          </p>
        </div>

        <Link
          href="/recuperacao"
          className="flex w-fit items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          Abrir recuperação
        </Link>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Erro ao carregar dados do Supabase: {error.message}
        </div>
      ) : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Valor em aberto"
          value={formatCurrency(totalEmAberto)}
          helper="Total de pedidos pendentes"
          href="/recuperacao"
        />

        <MetricCard
          title="Oportunidades"
          value={totalOportunidades}
          helper="Vendas em recuperação"
          href="/recuperacao"
        />

        <MetricCard
          title="Convertidos"
          value={convertidos}
          helper={`Taxa atual: ${taxaConversao}%`}
          href="/recuperacao?filtro=convertido"
        />

        <MetricCard
          title="Aguardando retorno"
          value={aguardando}
          helper="Clientes para acompanhar"
          href="/recuperacao?filtro=aguardando_resposta"
        />
      </div>

      <div className="mb-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
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
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Ver todos
            </Link>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">PIX pendente</span>
                <span className="font-semibold text-slate-950">
                  {pixPendentes}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{
                    width: `${getPercentual(
                      pixPendentes,
                      totalOportunidades
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">
                  Checkout abandonado
                </span>
                <span className="font-semibold text-slate-950">
                  {checkoutAbandonado}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${getPercentual(
                      checkoutAbandonado,
                      totalOportunidades
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">
                  Cartão recusado
                </span>
                <span className="font-semibold text-slate-950">
                  {cartaoRecusado}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{
                    width: `${getPercentual(
                      cartaoRecusado,
                      totalOportunidades
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Resultado da recuperação
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Situação atual das tentativas comerciais.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/recuperacao?filtro=pendente"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300"
            >
              <p className="text-xs font-medium text-slate-500">Pendentes</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">
                {pendentes}
              </p>
            </Link>

            <Link
              href="/recuperacao?filtro=convertido"
              className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 transition hover:border-emerald-200"
            >
              <p className="text-xs font-medium text-emerald-700">
                Convertidos
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {convertidos}
              </p>
            </Link>

            <Link
              href="/recuperacao?filtro=aguardando_resposta"
              className="rounded-2xl border border-blue-100 bg-blue-50 p-4 transition hover:border-blue-200"
            >
              <p className="text-xs font-medium text-blue-700">Aguardando</p>
              <p className="mt-1 text-2xl font-bold text-blue-700">
                {aguardando}
              </p>
            </Link>

            <Link
              href="/recuperacao?filtro=sem_resposta"
              className="rounded-2xl border border-amber-100 bg-amber-50 p-4 transition hover:border-amber-200"
            >
              <p className="text-xs font-medium text-amber-700">
                Sem resposta
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-700">
                {semResposta}
              </p>
            </Link>

            <Link
              href="/recuperacao?filtro=perdido"
              className="col-span-2 rounded-2xl border border-red-100 bg-red-50 p-4 transition hover:border-red-200"
            >
              <p className="text-xs font-medium text-red-700">Perdidos</p>
              <p className="mt-1 text-2xl font-bold text-red-700">
                {perdidos}
              </p>
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Últimas oportunidades
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Espelho da página de recuperação, com os pedidos mais recentes no
              topo.
            </p>
          </div>

          <Link
            href="/recuperacao"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Abrir lista completa
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Cliente</th>
                <th className="px-5 py-4 font-medium">Produto</th>
                <th className="px-5 py-4 font-medium">Pedido</th>
                <th className="px-5 py-4 font-medium">Recuperação</th>
                <th className="px-5 py-4 font-medium">Valor</th>
                <th className="px-5 py-4 font-medium">Último contato</th>
                <th className="px-5 py-4 font-medium">Detalhes</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {ultimasOportunidades.map((venda) => (
                <tr key={venda.pedido_id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 align-top">
                    <p className="font-semibold text-slate-950">
                      {venda.cliente_nome || "Cliente sem nome"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {venda.cliente_email || "E-mail não informado"}
                    </p>
                  </td>

                  <td className="px-5 py-4 align-top">
                    <p className="font-medium text-slate-800">
                      {venda.produto_nome || "Produto não informado"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {venda.plataforma_nome || "Plataforma não informada"}
                    </p>
                  </td>

                  <td className="px-5 py-4 align-top">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusClass(
                        venda.status
                      )}`}
                    >
                      {venda.status_label || "Pendente"}
                    </span>

                    <p className="mt-2 text-xs text-slate-500">
                      {formatTempo(venda.minutos_desde_criacao)}
                    </p>
                  </td>

                  <td className="px-5 py-4 align-top">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusRecuperacaoClass(
                        venda.status_recuperacao
                      )}`}
                    >
                      {formatStatusRecuperacao(venda.status_recuperacao)}
                    </span>
                  </td>

                  <td className="px-5 py-4 align-top font-semibold text-slate-950">
                    {formatCurrency(venda.valor)}
                  </td>

                  <td className="px-5 py-4 align-top">
                    <p className="font-medium text-slate-800">
                      {formatResultado(venda.ultima_interacao_resultado)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {venda.total_interacoes || 0} tentativa
                      {(venda.total_interacoes || 0) === 1 ? "" : "s"}
                    </p>
                  </td>

                  <td className="px-5 py-4 align-top">
                    <Link
                      href={`/recuperacao/${venda.pedido_id}`}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}

              {ultimasOportunidades.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Nenhuma oportunidade de recuperação encontrada.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}