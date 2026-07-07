"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  gerarMensagemRecuperacao,
  montarLinkWhatsappComMensagem,
} from "@/features/recoveries/utils/recoveryMessages";

type RecoveryActionsProps = {
  empresaId: string | null;
  clienteId: string | null;
  pedidoId: string;

  whatsappUrl: string;
  whatsappMessage: string;

  checkoutUrl: string | null;
  pixCode: string | null;

  clienteNome?: string | null;
  clienteTelefone?: string | null;
  produtoNome?: string | null;
  status?: string | null;
  valor?: number | null;
  statusRecuperacao?: string | null;
};

type InteractionData = {
  canal: string;
  mensagem: string;
  resultado: string;
};

type ModeloMensagem = {
  mensagem: string;
};

function extrairTelefoneDoWhatsappUrl(url: string) {
  if (!url || url === "#") return null;

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("wa.me")) {
      const telefone = parsedUrl.pathname.replace(/\D/g, "");
      return telefone || null;
    }

    const phoneParam = parsedUrl.searchParams.get("phone");

    if (phoneParam) {
      return phoneParam.replace(/\D/g, "");
    }

    return null;
  } catch {
    return null;
  }
}

function montarWhatsappFinal({
  whatsappUrl,
  clienteTelefone,
  mensagem,
}: {
  whatsappUrl: string;
  clienteTelefone?: string | null;
  mensagem: string;
}) {
  const telefone = clienteTelefone || extrairTelefoneDoWhatsappUrl(whatsappUrl);

  const linkComMensagem = montarLinkWhatsappComMensagem({
    telefone,
    mensagem,
  });

  if (linkComMensagem) {
    return linkComMensagem;
  }

  if (!whatsappUrl || whatsappUrl === "#") {
    return null;
  }

  try {
    const parsedUrl = new URL(whatsappUrl);
    parsedUrl.searchParams.set("text", mensagem);
    return parsedUrl.toString();
  } catch {
    return whatsappUrl;
  }
}

function getPrimeiroNome(nome?: string | null) {
  if (!nome) return "tudo bem";

  const primeiroNome = nome.trim().split(" ")[0];

  return primeiroNome || "tudo bem";
}

function formatCurrency(value?: number | null) {
  if (!value) return "";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function aplicarVariaveisMensagem({
  modelo,
  clienteNome,
  produtoNome,
  valor,
  checkoutUrl,
  pixCode,
}: {
  modelo: string;
  clienteNome?: string | null;
  produtoNome?: string | null;
  valor?: number | null;
  checkoutUrl?: string | null;
  pixCode?: string | null;
}) {
  return modelo
    .replaceAll("{{nome}}", getPrimeiroNome(clienteNome))
    .replaceAll("{{produto}}", produtoNome || "seu pedido")
    .replaceAll("{{valor}}", formatCurrency(valor))
    .replaceAll("{{checkout_url}}", checkoutUrl || "")
    .replaceAll("{{pix}}", pixCode || "");
}

function getTipoModeloMensagem(status?: string | null) {
  if (status === "pix_pendente") {
    return "pix_pendente";
  }

  if (status === "checkout_abandonado") {
    return "checkout_abandonado";
  }

  if (status === "cartao_recusado") {
    return "cartao_recusado";
  }

  return "pix_pendente";
}

export function RecoveryActions({
  empresaId,
  clienteId,
  pedidoId,
  whatsappUrl,
  whatsappMessage,
  checkoutUrl,
  pixCode,
  clienteNome,
  clienteTelefone,
  produtoNome,
  status,
  valor,
}: RecoveryActionsProps) {
  const [copied, setCopied] = useState(false);
  const [registeringWhatsapp, setRegisteringWhatsapp] = useState(false);
  const [registeringCheckout, setRegisteringCheckout] = useState(false);
  const [copyingPix, setCopyingPix] = useState(false);

  const mensagemFallback =
    gerarMensagemRecuperacao({
      clienteNome,
      produtoNome,
      status,
      valor,
      checkoutUrl,
      pixCopiaCola: pixCode,
      statusRecuperacao: "pendente",
    }) || whatsappMessage;

  const hasWhatsapp = Boolean(
    clienteTelefone || extrairTelefoneDoWhatsappUrl(whatsappUrl)
  );

  const hasCheckout = Boolean(checkoutUrl);
  const hasPix = Boolean(pixCode);

  async function registerInteraction({
    canal,
    mensagem,
    resultado,
  }: InteractionData) {
    const { error } = await supabase.from("interacoes").insert({
      empresa_id: empresaId,
      cliente_id: clienteId,
      pedido_id: pedidoId,
      tipo: "recuperacao_manual",
      canal,
      mensagem,
      resultado,
    });

    if (error) {
      console.error("Erro ao registrar interação:", error.message);
    }
  }

  async function buscarMensagemDoSupabase() {
    if (!empresaId) {
      return mensagemFallback;
    }

    const tipo = getTipoModeloMensagem(status);

    const { data, error } = await supabase
      .from("modelos_mensagens")
      .select("mensagem")
      .eq("empresa_id", empresaId)
      .eq("tipo", tipo)
      .eq("ativo", true)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar modelo de mensagem:", error.message);
      return mensagemFallback;
    }

    const modelo = data as ModeloMensagem | null;

    if (!modelo?.mensagem) {
      return mensagemFallback;
    }

    return aplicarVariaveisMensagem({
      modelo: modelo.mensagem,
      clienteNome,
      produtoNome,
      valor,
      checkoutUrl,
      pixCode,
    });
  }

  async function handleOpenWhatsApp() {
    if (!hasWhatsapp) return;

    setRegisteringWhatsapp(true);

    try {
      const mensagemFinal = await buscarMensagemDoSupabase();

      const whatsappUrlFinal = montarWhatsappFinal({
        whatsappUrl,
        clienteTelefone,
        mensagem: mensagemFinal,
      });

      if (!whatsappUrlFinal) {
        return;
      }

      await registerInteraction({
        canal: "whatsapp",
        mensagem: mensagemFinal,
        resultado: "whatsapp_aberto",
      });

      window.open(whatsappUrlFinal, "_blank", "noopener,noreferrer");
    } finally {
      setRegisteringWhatsapp(false);
    }
  }

  async function handleOpenCheckout() {
    if (!checkoutUrl) return;

    setRegisteringCheckout(true);

    try {
      await registerInteraction({
        canal: "checkout",
        mensagem: "Checkout aberto pelo atendente durante a recuperação.",
        resultado: "checkout_aberto",
      });

      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    } finally {
      setRegisteringCheckout(false);
    }
  }

  async function handleCopyPix() {
    if (!pixCode) return;

    setCopyingPix(true);

    try {
      await navigator.clipboard.writeText(pixCode);

      await registerInteraction({
        canal: "pix",
        mensagem: "Código PIX copia e cola copiado pelo atendente.",
        resultado: "pix_copiado",
      });

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } finally {
      setCopyingPix(false);
    }
  }

  return (
    <div className="w-full max-w-[260px] space-y-3">
      <button
        type="button"
        onClick={handleOpenWhatsApp}
        disabled={registeringWhatsapp || !hasWhatsapp}
        className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
      >
        {registeringWhatsapp ? "Preparando..." : "Chamar no WhatsApp"}
      </button>

      <div className="grid grid-cols-2 gap-2">
        {hasCheckout ? (
          <button
            type="button"
            onClick={handleOpenCheckout}
            disabled={registeringCheckout}
            className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {registeringCheckout ? "Abrindo..." : "Checkout"}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="flex cursor-not-allowed items-center justify-center rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-300"
          >
            Checkout
          </button>
        )}

        {hasPix ? (
          <button
            type="button"
            onClick={handleCopyPix}
            disabled={copyingPix}
            className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {copyingPix ? "Copiando..." : copied ? "Copiado" : "PIX"}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="flex cursor-not-allowed items-center justify-center rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-300"
          >
            PIX
          </button>
        )}
      </div>

      <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-500">
        O status do pedido é atualizado automaticamente quando a plataforma
        envia um novo evento pelo webhook.
      </p>
    </div>
  );
}