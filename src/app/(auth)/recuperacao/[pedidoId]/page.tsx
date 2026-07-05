import Link from "next/link";
import { notFound } from "next/navigation";
import { RecoveryActions } from "@/features/recoveries/components/RecoveryActions";
import { supabase } from "@/lib/supabase";

type RecuperacaoVenda = {
  pedido_id: string;
  empresa_id: string | null;
  cliente_id: string | null;
  cliente_nome: string | null;
  cliente_email: string | null;
  cliente_telefone: string | null;
  cliente_cidade: string | null;
  cliente_estado: string | null;
  produto_nome: string | null;
  produto_valor: number | null;
  plataforma_nome: string | null;
  plataforma_slug: string | null;
  pedido_externo_id: string | null;
  status: string | null;
  status_label: string | null;
  metodo_pagamento: string | null;
  valor: number | null;
  checkout_url: string | null;
  pix_copia_cola: string | null;
  pix_qrcode_url: string | null;
  criado_na_plataforma: string | null;
  pago_em: string | null;
  minutos_desde_criacao: number | null;
  prioridade_recuperacao: number | null;
  ultima_interacao_em: string | null;
  ultima_interacao_canal: string | null;
  ultima_interacao_resultado: string | null;
  total_interacoes: number | null;
  status_recuperacao: string | null;
  recuperacao_atualizada_em: string | null;
};

type Interacao = {
  id: string;
  tipo: string | null;
  canal: string | null;
  mensagem: string | null;
  resultado: string | null;
  created_at: string | null;
};

type PageProps = {
  params: Promise<{
    pedidoId: string;
  }>;
};

function formatCurrency(value: number | null) {
  if (!value) return "R$ 0,00";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatData(data: string | null) {
  if (!data) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data));
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

function formatResultado(resultado: string | null) {
  if (!resultado) return "Sem resultado";

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

function formatCanal(canal: string | null) {
  if (!canal) return "Sistema";

  const labels: Record<string, string> = {
    whatsapp: "WhatsApp",
    checkout: "Checkout",
    pix: "PIX",
    sistema: "Sistema",
  };

  return labels[canal] || canal;
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

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800">
        {value || "Não informado"}
      </p>
    </div>
  );
}

export default async function DetalheRecuperacaoPage({ params }: PageProps) {
  const { pedidoId } = await params;

  const { data, error } = await supabase
    .from("vw_recuperacao_vendas")
    .select("*")
    .eq("pedido_id", pedidoId)
    .maybeSingle();

  if (!data && !error) {
    notFound();
  }

  const venda = data as RecuperacaoVenda | null;

  const { data: historico, error: historicoError } = await supabase
    .from("interacoes")
    .select("*")
    .eq("pedido_id", pedidoId)
    .order("created_at", { ascending: false });

  const interacoes = (historico || []) as Interacao[];

  if (!venda) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Não foi possível carregar esta oportunidade.
      </div>
    );
  }

  const whatsappMessage = getWhatsAppMessage(venda);

  return (
    <div className="h-[calc(100vh-73px)] space-y-6 overflow-y-auto px-0 pb-10 pr-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/recuperacao"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Voltar para recuperação
          </Link>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
            Detalhes da oportunidade
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
            Veja os dados do cliente, pedido, histórico de contatos e ações de
            recuperação.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Pedido externo:{" "}
          <span className="font-semibold text-slate-950">
            {venda.pedido_externo_id || "Não informado"}
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Erro ao carregar dados do Supabase: {error.message}
        </div>
      ) : null}

      {historicoError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
          A oportunidade foi carregada, mas houve erro ao buscar o histórico:
          {historicoError.message}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">Cliente</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  {venda.cliente_nome || "Cliente sem nome"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {venda.cliente_email || "E-mail não informado"}
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusRecuperacaoClass(
                  venda.status_recuperacao
                )}`}
              >
                {formatStatusRecuperacao(venda.status_recuperacao)}
              </span>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem label="Telefone" value={venda.cliente_telefone} />
              <InfoItem
                label="Cidade/Estado"
                value={
                  venda.cliente_cidade || venda.cliente_estado
                    ? `${venda.cliente_cidade || ""}${
                        venda.cliente_cidade && venda.cliente_estado
                          ? "/"
                          : ""
                      }${venda.cliente_estado || ""}`
                    : null
                }
              />
              <InfoItem
                label="Última atualização"
                value={formatData(venda.recuperacao_atualizada_em)}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">Pedido</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  {venda.produto_nome || "Produto não informado"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {venda.plataforma_nome || "Plataforma não informada"}
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusClass(
                  venda.status
                )}`}
              >
                {venda.status_label || "Pendente"}
              </span>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem label="Valor do pedido" value={formatCurrency(venda.valor)} />
              <InfoItem
                label="Forma de pagamento"
                value={formatPagamento(venda.metodo_pagamento)}
              />
              <InfoItem
                label="Tempo desde criação"
                value={formatTempo(venda.minutos_desde_criacao)}
              />
              <InfoItem
                label="Criado na plataforma"
                value={formatData(venda.criado_na_plataforma)}
              />
              <InfoItem label="Pedido externo" value={venda.pedido_externo_id} />
              <InfoItem
                label="Checkout"
                value={venda.checkout_url ? "Disponível" : "Não informado"}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-600">Ações rápidas</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">
            Recuperar venda
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Use as ações abaixo para falar com o cliente, abrir checkout, copiar
            PIX ou registrar o resultado.
          </p>

          <div className="mt-5">
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
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-semibold text-slate-950">
            Histórico de contatos
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Registro das ações realizadas nesta oportunidade.
          </p>
        </div>

        <div className="p-5">
          {interacoes.length > 0 ? (
            <div className="space-y-4">
              {interacoes.map((interacao) => (
                <div
                  key={interacao.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-950">
                        {formatResultado(interacao.resultado)}
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Canal: {formatCanal(interacao.canal)} • Tipo:{" "}
                        {interacao.tipo || "Não informado"}
                      </p>
                    </div>

                    <p className="text-xs font-medium text-slate-400">
                      {formatData(interacao.created_at)}
                    </p>
                  </div>

                  {interacao.mensagem ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {interacao.mensagem}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
              Nenhum contato registrado para esta oportunidade.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}