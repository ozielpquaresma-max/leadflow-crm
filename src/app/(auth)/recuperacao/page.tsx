import { supabase } from "@/lib/supabase";

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
  checkout_url: string | null;
  pix_copia_cola: string | null;
  pix_qrcode_url: string | null;
  minutos_desde_criacao: number | null;
  prioridade_recuperacao: number | null;
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

function getWhatsAppLink(venda: RecuperacaoVenda) {
  const telefone = venda.cliente_telefone?.replace(/\D/g, "");

  if (!telefone) return "#";

  const mensagem = `Olá, ${venda.cliente_nome || "tudo bem"}! Vi que você iniciou a compra do produto ${venda.produto_nome || ""}, mas o pagamento ainda não foi concluído. Posso te ajudar a finalizar agora?`;

  return `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
}

export default async function RecuperacaoPage() {
  const { data, error } = await supabase
    .from("vw_recuperacao_vendas")
    .select("*")
    .order("prioridade_recuperacao", { ascending: true })
    .order("criado_na_plataforma", { ascending: true });

  const vendas = (data || []) as RecuperacaoVenda[];

  const totalPendente = vendas.reduce((total, venda) => {
    return total + Number(venda.valor || 0);
  }, 0);

  const pixPendentes = vendas.filter((venda) => venda.status === "pix_pendente").length;
  const checkoutAbandonado = vendas.filter((venda) => venda.status === "checkout_abandonado").length;
  const cartaoRecusado = vendas.filter((venda) => venda.status === "cartao_recusado").length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-blue-600">Recuperação de Vendas</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Vendas pendentes
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Acompanhe PIX pendentes, checkouts abandonados e pagamentos recusados para recuperar vendas em tempo real.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          Erro ao carregar dados do Supabase: {error.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Valor em aberto</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {formatCurrency(totalPendente)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">PIX pendente</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{pixPendentes}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Checkout abandonado</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{checkoutAbandonado}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Cartão recusado</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{cartaoRecusado}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-semibold text-slate-950">
            Lista de oportunidades de recuperação
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Priorize contatos recentes e pedidos com maior chance de conversão.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Cliente</th>
                <th className="px-5 py-4 font-medium">Produto</th>
                <th className="px-5 py-4 font-medium">Plataforma</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Pagamento</th>
                <th className="px-5 py-4 font-medium">Valor</th>
                <th className="px-5 py-4 font-medium">Tempo</th>
                <th className="px-5 py-4 font-medium">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {vendas.map((venda) => (
                <tr key={venda.pedido_id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-slate-950">{venda.cliente_nome}</p>
                      <p className="text-xs text-slate-500">{venda.cliente_email}</p>
                      <p className="text-xs text-slate-500">{venda.cliente_telefone}</p>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-700">{venda.produto_nome}</td>

                  <td className="px-5 py-4 text-slate-700">{venda.plataforma_nome}</td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                      {venda.status_label}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-700">{venda.metodo_pagamento}</td>

                  <td className="px-5 py-4 font-semibold text-slate-950">
                    {formatCurrency(venda.valor)}
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {formatTempo(venda.minutos_desde_criacao)}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={getWhatsAppLink(venda)}
                        target="_blank"
                        className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        WhatsApp
                      </a>

                      {venda.checkout_url ? (
                        <a
                          href={venda.checkout_url}
                          target="_blank"
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Checkout
                        </a>
                      ) : null}

                      {venda.pix_copia_cola ? (
                        <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          PIX disponível
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}

              {vendas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                    Nenhuma venda pendente encontrada.
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