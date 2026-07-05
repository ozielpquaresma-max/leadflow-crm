import Link from "next/link";
import { RecoveryActions } from "@/features/recoveries/components/RecoveryActions";
import { supabase } from "@/lib/supabase";

type RecuperacaoVenda = {
  pedido_id: string;
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
  pix_qrcode_url: string | null;
  minutos_desde_criacao: number | null;
  prioridade_recuperacao: number | null;
  ultima_interacao_em: string | null;
  ultima_interacao_canal: string | null;
  ultima_interacao_resultado: string | null;
  total_interacoes: number | null;
  status_recuperacao: string | null;
  recuperacao_atualizada_em: string | null;
};

type FiltroRecuperacao =
  | "todos"
  | "pix_pendente"
  | "checkout_abandonado"
  | "cartao_recusado"
  | "pendente"
  | "convertido"
  | "aguardando_resposta"
  | "sem_resposta"
  | "perdido";

type PageProps = {
  searchParams?: Promise<{
    filtro?: string;
  }>;
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

function formatDataContato(data: string | null) {
  if (!data) return "Sem contato";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data));
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

function formatPagamento(pagamento: string | null) {
  if (!pagamento) return "Não informado";

  const labels: Record<string, string> = {
    pix: "PIX",
    boleto: "Boleto",
    cartao: "Cartão",
    credit_card: "Cartão",
    creditcard: "Cartão",
  };

  return labels[pagamento] || pagamento;
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

function formatDataStatusRecuperacao(data: string | null) {
  if (!data) return "Ainda não atualizado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data));
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

function getWhatsAppMessage(venda: RecuperacaoVenda) {
  return `Olá, ${
    venda.cliente_nome || "tudo bem"
  }! Vi que você iniciou a compra do produto ${
    venda.produto_nome || ""
  }, mas o pagamento ainda não foi concluído. Posso te ajudar a finalizar agora?`;
}

function getWhatsAppLink(venda: RecuperacaoVenda) {
  const telefone = venda.cliente_telefone?.replace(/\D/g, "");

  if (!telefone) return "#";

  const mensagem = getWhatsAppMessage(venda);

  return `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
}

function getTentativas(total: number | null) {
  const quantidade = total || 0;
  return `${quantidade} tentativa${quantidade === 1 ? "" : "s"}`;
}

function getStatusRecuperacaoNormalizado(venda: RecuperacaoVenda) {
  return venda.status_recuperacao || "pendente";
}

function filtrarVendas(vendas: RecuperacaoVenda[], filtro: FiltroRecuperacao) {
  if (filtro === "todos") return vendas;

  if (
    filtro === "pix_pendente" ||
    filtro === "checkout_abandonado" ||
    filtro === "cartao_recusado"
  ) {
    return vendas.filter((venda) => venda.status === filtro);
  }

  return vendas.filter(
    (venda) => getStatusRecuperacaoNormalizado(venda) === filtro
  );
}

function getQuantidadeFiltro(
  vendas: RecuperacaoVenda[],
  filtro: FiltroRecuperacao
) {
  return filtrarVendas(vendas, filtro).length;
}

function isFiltroValido(filtro: string): filtro is FiltroRecuperacao {
  return [
    "todos",
    "pix_pendente",
    "checkout_abandonado",
    "cartao_recusado",
    "pendente",
    "convertido",
    "aguardando_resposta",
    "sem_resposta",
    "perdido",
  ].includes(filtro);
}

export default async function RecuperacaoPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const filtroRecebido = resolvedSearchParams?.filtro || "todos";
  const filtroAtivo: FiltroRecuperacao = isFiltroValido(filtroRecebido)
    ? filtroRecebido
    : "todos";

  const { data, error } = await supabase
    .from("vw_recuperacao_vendas")
    .select("*")
    .order("prioridade_recuperacao", { ascending: true })
    .order("criado_na_plataforma", { ascending: true });

  const vendas = (data || []) as RecuperacaoVenda[];
  const vendasFiltradas = filtrarVendas(vendas, filtroAtivo);

  const totalPendente = vendas.reduce((total, venda) => {
    return total + Number(venda.valor || 0);
  }, 0);

  const pixPendentes = vendas.filter(
    (venda) => venda.status === "pix_pendente"
  ).length;

  const checkoutAbandonado = vendas.filter(
    (venda) => venda.status === "checkout_abandonado"
  ).length;

  const cartaoRecusado = vendas.filter(
    (venda) => venda.status === "cartao_recusado"
  ).length;

  const convertidos = vendas.filter(
    (venda) => venda.status_recuperacao === "convertido"
  ).length;

  const cards = [
    {
      label: "Valor em aberto",
      value: formatCurrency(totalPendente),
      helper: "Total disponível para recuperação",
    },
    {
      label: "PIX pendente",
      value: pixPendentes,
      helper: "Pedidos aguardando pagamento",
    },
    {
      label: "Checkout abandonado",
      value: checkoutAbandonado,
      helper: "Clientes que não concluíram",
    },
    {
      label: "Cartão recusado",
      value: cartaoRecusado,
      helper: "Falhas no pagamento",
    },
  ];

  const filtros: {
    label: string;
    value: FiltroRecuperacao;
  }[] = [
    { label: "Todos", value: "todos" },
    { label: "PIX", value: "pix_pendente" },
    { label: "Checkout", value: "checkout_abandonado" },
    { label: "Cartão", value: "cartao_recusado" },
    { label: "Pendentes", value: "pendente" },
    { label: "Convertidos", value: "convertido" },
    { label: "Aguardando", value: "aguardando_resposta" },
    { label: "Sem resposta", value: "sem_resposta" },
    { label: "Perdidos", value: "perdido" },
  ];

  return (
    <div className="h-[calc(100vh-73px)] space-y-6 overflow-y-auto px-0 pb-10 pr-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Recuperação de Vendas
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
            Vendas pendentes
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
            Acompanhe PIX pendentes, checkouts abandonados e pagamentos
            recusados para recuperar vendas em tempo real.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <span className="font-semibold text-slate-950">{vendas.length}</span>{" "}
          oportunidade{vendas.length === 1 ? "" : "s"} em aberto
          {convertidos > 0 ? (
            <span className="ml-2 text-emerald-600">
              • {convertidos} convertido{convertidos === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Erro ao carregar dados do Supabase: {error.message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{card.label}</p>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {card.value}
            </p>

            <p className="mt-1 text-xs text-slate-500">{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-slate-950">
            Filtrar oportunidades
          </h2>
          <p className="text-xs text-slate-500">
            Separe rapidamente por tipo de pedido ou resultado da recuperação.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {filtros.map((filtro) => {
            const active = filtroAtivo === filtro.value;
            const quantidade = getQuantidadeFiltro(vendas, filtro.value);

            return (
              <Link
                key={filtro.value}
                href={
                  filtro.value === "todos"
                    ? "/recuperacao"
                    : `/recuperacao?filtro=${filtro.value}`
                }
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                {filtro.label}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {quantidade}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Oportunidades de recuperação
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Mostrando{" "}
              <span className="font-semibold text-slate-700">
                {vendasFiltradas.length}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-slate-700">
                {vendas.length}
              </span>{" "}
              oportunidade{vendas.length === 1 ? "" : "s"}.
            </p>
          </div>

          <p className="text-xs font-medium text-slate-400">
            Role para o lado caso a tabela não caiba na tela.
          </p>
        </div>

        <div className="block space-y-4 p-4 lg:hidden">
          {vendasFiltradas.map((venda) => {
            const whatsappMessage = getWhatsAppMessage(venda);

            return (
              <div
                key={venda.pedido_id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {venda.cliente_nome || "Cliente sem nome"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {venda.cliente_email || "E-mail não informado"}
                    </p>

                    <p className="text-xs text-slate-500">
                      {venda.cliente_telefone || "Telefone não informado"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusClass(
                      venda.status
                    )}`}
                  >
                    {venda.status_label || "Pendente"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Produto
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {venda.produto_nome || "Produto não informado"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Plataforma
                    </p>
                    <p className="mt-1 text-slate-700">
                      {venda.plataforma_nome || "Não informado"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Pagamento
                    </p>
                    <p className="mt-1 text-slate-700">
                      {formatPagamento(venda.metodo_pagamento)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">Tempo</p>
                    <p className="mt-1 text-slate-700">
                      {formatTempo(venda.minutos_desde_criacao)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">Valor</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {formatCurrency(venda.valor)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Recuperação
                    </p>

                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusRecuperacaoClass(
                        venda.status_recuperacao
                      )}`}
                    >
                      {formatStatusRecuperacao(venda.status_recuperacao)}
                    </span>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDataStatusRecuperacao(
                        venda.recuperacao_atualizada_em
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Último contato
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatResultado(venda.ultima_interacao_resultado)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDataContato(venda.ultima_interacao_em)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {getTentativas(venda.total_interacoes)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <RecoveryActions
                    empresaId={venda.empresa_id}
                    clienteId={venda.cliente_id}
                    pedidoId={venda.pedido_id}
                    whatsappUrl={getWhatsAppLink(venda)}
                    whatsappMessage={whatsappMessage}
                    checkoutUrl={venda.checkout_url}
                    pixCode={venda.pix_copia_cola}
                  />
                </div>
              </div>
            );
          })}

          {vendasFiltradas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
              Nenhuma venda encontrada para este filtro.
            </div>
          ) : null}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
              <tr>
                <th className="w-[240px] px-5 py-4 font-medium">Cliente</th>
                <th className="w-[230px] px-5 py-4 font-medium">Produto</th>
                <th className="px-5 py-4 font-medium">Pedido</th>
                <th className="px-5 py-4 font-medium">Recuperação</th>
                <th className="px-5 py-4 font-medium">Valor</th>
                <th className="px-5 py-4 font-medium">Contato</th>
                <th className="px-5 py-4 font-medium">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {vendasFiltradas.map((venda) => {
                const whatsappMessage = getWhatsAppMessage(venda);

                return (
                  <tr key={venda.pedido_id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 align-top">
                      <div className="max-w-[220px]">
                        <p className="truncate font-semibold text-slate-950">
                          {venda.cliente_nome || "Cliente sem nome"}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {venda.cliente_email || "E-mail não informado"}
                        </p>

                        <p className="text-xs text-slate-500">
                          {venda.cliente_telefone || "Telefone não informado"}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <div className="max-w-[220px]">
                        <p className="font-medium text-slate-800">
                          {venda.produto_nome || "Produto não informado"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {venda.plataforma_nome || "Plataforma não informada"}
                        </p>
                      </div>
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
                        {formatPagamento(venda.metodo_pagamento)}
                      </p>

                      <p className="text-xs text-slate-500">
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

                      <p className="mt-2 text-xs text-slate-500">
                        {formatDataStatusRecuperacao(
                          venda.recuperacao_atualizada_em
                        )}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-top font-semibold text-slate-950">
                      {formatCurrency(venda.valor)}
                    </td>

                    <td className="px-5 py-4 align-top">
                      <div className="min-w-[150px]">
                        <p className="font-medium text-slate-950">
                          {formatResultado(venda.ultima_interacao_resultado)}
                        </p>

                        <p className="text-xs text-slate-500">
                          {formatDataContato(venda.ultima_interacao_em)}
                        </p>

                        <p className="text-xs text-slate-500">
                          {getTentativas(venda.total_interacoes)}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <div className="min-w-[240px]">
                        <RecoveryActions
                          empresaId={venda.empresa_id}
                          clienteId={venda.cliente_id}
                          pedidoId={venda.pedido_id}
                          whatsappUrl={getWhatsAppLink(venda)}
                          whatsappMessage={whatsappMessage}
                          checkoutUrl={venda.checkout_url}
                          pixCode={venda.pix_copia_cola}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {vendasFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Nenhuma venda encontrada para este filtro.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}