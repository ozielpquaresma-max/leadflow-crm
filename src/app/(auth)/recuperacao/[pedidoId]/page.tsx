"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

function normalizeDateValue(value: string | null) {
  if (!value) return null;

  const hasTimezone =
    value.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(value);

  return hasTimezone ? value : `${value}Z`;
}

function formatData(value: string | null) {
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

function formatCurrency(value: number | null) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
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

  if (status === "pago") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
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

  const telefoneComPais = telefone.startsWith("55") ? telefone : `55${telefone}`;

  return `https://wa.me/${telefoneComPais}?text=${encodeURIComponent(
    getWhatsAppMessage(venda)
  )}`;
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-slate-950">
        {value || "Não informado"}
      </p>
    </div>
  );
}

export default function DetalheRecuperacaoPage() {
  const params = useParams();

  const pedidoId = useMemo(() => {
    const value = params?.pedidoId;

    if (Array.isArray(value)) {
      return value[0] || "";
    }

    return value || "";
  }, [params]);

  const [venda, setVenda] = useState<RecuperacaoVenda | null>(null);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadDetalhes() {
    setLoading(true);
    setErrorMessage(null);

    try {
      if (!pedidoId) {
        throw new Error("Pedido não informado.");
      }

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

      const { data: vendaData, error: vendaError } = await supabase
        .from("vw_recuperacao_vendas")
        .select("*")
        .eq("pedido_id", pedidoId)
        .eq("empresa_id", empresaId)
        .maybeSingle();

      if (vendaError) {
        throw new Error(vendaError.message);
      }

      if (!vendaData) {
        setVenda(null);
        setInteracoes([]);
        setErrorMessage(
          "Oportunidade não encontrada ou não pertence à sua empresa."
        );
        return;
      }

      const { data: historico, error: historicoError } = await supabase
        .from("interacoes")
        .select("*")
        .eq("pedido_id", pedidoId)
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });

      if (historicoError) {
        throw new Error(historicoError.message);
      }

      setVenda(vendaData as RecuperacaoVenda);
      setInteracoes((historico || []) as Interacao[]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar oportunidade.";

      setVenda(null);
      setInteracoes([]);
      setErrorMessage(message);
      console.error("Erro ao carregar detalhes da oportunidade:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetalhes();
  }, [pedidoId]);

  if (loading) {
    return (
      <main className="h-[calc(100vh-73px)] overflow-y-auto bg-slate-50 p-6 pb-10 lg:p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          Carregando detalhes da oportunidade...
        </div>
      </main>
    );
  }

  if (!venda) {
    return (
      <main className="h-[calc(100vh-73px)] overflow-y-auto bg-slate-50 p-6 pb-10 lg:p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {errorMessage || "Não foi possível carregar esta oportunidade."}
        </div>

        <Link
          href="/recuperacao"
          className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          Voltar para recuperação
        </Link>
      </main>
    );
  }

  const whatsappMessage = getWhatsAppMessage(venda);

  return (
    <main className="h-[calc(100vh-73px)] overflow-y-auto bg-slate-50 p-6 pb-10 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/recuperacao"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Voltar para recuperação
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Detalhes da oportunidade
          </h1>

          <p className="mt-2 max-w-4xl text-slate-600">
            Acompanhe os dados do pedido, cliente, pagamento e histórico de
            interações desta oportunidade.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${getStatusClass(
              venda.status
            )}`}
          >
            {venda.status_label || venda.status || "Pendente"}
          </span>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${getStatusRecuperacaoClass(
              venda.status_recuperacao
            )}`}
          >
            {formatStatusRecuperacao(venda.status_recuperacao)}
          </span>
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoItem label="Cliente" value={venda.cliente_nome} />
        <InfoItem label="Produto" value={venda.produto_nome} />
        <InfoItem label="Valor" value={formatCurrency(venda.valor)} />
        <InfoItem
          label="Pagamento"
          value={formatPagamento(venda.metodo_pagamento)}
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Dados do pedido
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Informações recebidas pela integração da plataforma.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoItem label="ID do pedido interno" value={venda.pedido_id} />

            <InfoItem
              label="ID externo"
              value={venda.pedido_externo_id || "Não informado"}
            />

            <InfoItem
              label="Plataforma"
              value={venda.plataforma_nome || "Kiwify"}
            />

            <InfoItem
              label="Status do pedido"
              value={venda.status_label || venda.status || "Não informado"}
            />

            <InfoItem
              label="Criado na plataforma"
              value={formatData(venda.criado_na_plataforma)}
            />

            <InfoItem
              label="Tempo desde criação"
              value={formatTempo(venda.minutos_desde_criacao)}
            />

            <InfoItem
              label="Pago em"
              value={venda.pago_em ? formatData(venda.pago_em) : "Não pago"}
            />

            <InfoItem
              label="Atualização da recuperação"
              value={formatData(venda.recuperacao_atualizada_em)}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Ações rápidas</h2>

          <p className="mt-1 text-sm text-slate-500">
            Use os atalhos abaixo para recuperar a venda.
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
              clienteNome={venda.cliente_nome}
              clienteTelefone={venda.cliente_telefone}
              produtoNome={venda.produto_nome}
              status={venda.status}
              valor={venda.valor}
              statusRecuperacao={venda.status_recuperacao}
            />
          </div>

          {venda.pix_copia_cola ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                PIX copia e cola
              </p>

              <p className="mt-2 max-h-28 overflow-auto break-all font-mono text-xs text-amber-900">
                {venda.pix_copia_cola}
              </p>
            </div>
          ) : null}
        </section>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Dados do cliente
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoItem label="Nome" value={venda.cliente_nome} />
            <InfoItem label="E-mail" value={venda.cliente_email} />
            <InfoItem label="Telefone" value={venda.cliente_telefone} />
            <InfoItem
              label="Cidade/Estado"
              value={
                venda.cliente_cidade || venda.cliente_estado
                  ? `${venda.cliente_cidade || "Cidade não informada"} / ${
                      venda.cliente_estado || "UF não informada"
                    }`
                  : "Não informado"
              }
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Recuperação</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoItem
              label="Status da recuperação"
              value={formatStatusRecuperacao(venda.status_recuperacao)}
            />

            <InfoItem
              label="Total de interações"
              value={venda.total_interacoes || 0}
            />

            <InfoItem
              label="Última interação"
              value={formatData(venda.ultima_interacao_em)}
            />

            <InfoItem
              label="Resultado da última interação"
              value={formatResultado(venda.ultima_interacao_resultado)}
            />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-950">
            Histórico de interações
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Registros de ações realizadas nessa oportunidade.
          </p>
        </div>

        {interacoes.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Nenhuma interação registrada ainda.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {interacoes.map((interacao) => (
              <div key={interacao.id} className="p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-bold text-slate-950">
                      {formatResultado(interacao.resultado)}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Canal: {formatCanal(interacao.canal)} • Tipo:{" "}
                      {interacao.tipo || "Não informado"}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-slate-500">
                    {formatData(interacao.created_at)}
                  </p>
                </div>

                {interacao.mensagem ? (
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    {interacao.mensagem}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}