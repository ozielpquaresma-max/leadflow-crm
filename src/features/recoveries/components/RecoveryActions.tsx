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

type RecoveryStatus =
  | "convertido"
  | "aguardando_resposta"
  | "sem_resposta"
  | "perdido";

const recoveryStatusLabels: Record<RecoveryStatus, string> = {
  convertido: "Convertido",
  aguardando_resposta: "Aguardar",
  sem_resposta: "Sem resposta",
  perdido: "Perdido",
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
  const telefone =
    clienteTelefone || extrairTelefoneDoWhatsappUrl(whatsappUrl);

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
  statusRecuperacao,
}: RecoveryActionsProps) {
  const [copied, setCopied] = useState(false);
  const [registeringWhatsapp, setRegisteringWhatsapp] = useState(false);
  const [registeringCheckout, setRegisteringCheckout] = useState(false);
  const [copyingPix, setCopyingPix] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<RecoveryStatus | null>(
    null
  );
  const [selectedStatus, setSelectedStatus] = useState<RecoveryStatus | null>(
    null
  );

  const statusRecuperacaoAtual = selectedStatus || statusRecuperacao;

  const mensagemInteligente = gerarMensagemRecuperacao({
    clienteNome,
    produtoNome,
    status,
    valor,
    checkoutUrl,
    pixCopiaCola: pixCode,
    statusRecuperacao: statusRecuperacaoAtual,
  });

  const mensagemWhatsapp = mensagemInteligente || whatsappMessage;

  const whatsappUrlFinal = montarWhatsappFinal({
    whatsappUrl,
    clienteTelefone,
    mensagem: mensagemWhatsapp,
  });

  const hasWhatsapp = Boolean(whatsappUrlFinal);
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

  async function handleOpenWhatsApp() {
    if (!whatsappUrlFinal) return;

    setRegisteringWhatsapp(true);

    try {
      await registerInteraction({
        canal: "whatsapp",
        mensagem: mensagemWhatsapp,
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

  async function handleUpdateRecoveryStatus(status: RecoveryStatus) {
    setUpdatingStatus(status);

    try {
      const { error } = await supabase
        .from("pedidos")
        .update({
          status_recuperacao: status,
          recuperacao_atualizada_em: new Date().toISOString(),
        })
        .eq("id", pedidoId);

      if (error) {
        console.error("Erro ao atualizar status da recuperação:", error.message);
        return;
      }

      await registerInteraction({
        canal: "sistema",
        mensagem: `Recuperação marcada como: ${recoveryStatusLabels[status]}.`,
        resultado: status,
      });

      setSelectedStatus(status);
    } finally {
      setUpdatingStatus(null);
    }
  }

  function getStatusButtonClass(status: RecoveryStatus) {
    const isSelected = selectedStatus === status;

    if (status === "convertido") {
      return isSelected
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700";
    }

    if (status === "aguardando_resposta") {
      return isSelected
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700";
    }

    if (status === "sem_resposta") {
      return isSelected
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700";
    }

    return isSelected
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700";
  }

  return (
    <div className="w-full max-w-[260px] space-y-3">
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleOpenWhatsApp}
          disabled={registeringWhatsapp || !hasWhatsapp}
          className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {registeringWhatsapp ? "Registrando..." : "Chamar no WhatsApp"}
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
      </div>

      <div className="border-t border-slate-100 pt-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Resultado
        </p>

        <div className="grid grid-cols-2 gap-2">
          {(
            [
              "convertido",
              "aguardando_resposta",
              "sem_resposta",
              "perdido",
            ] as RecoveryStatus[]
          ).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleUpdateRecoveryStatus(status)}
              disabled={updatingStatus !== null}
              className={`flex items-center justify-center rounded-xl border px-3 py-2 text-[11px] font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${getStatusButtonClass(
                status
              )}`}
            >
              {updatingStatus === status
                ? "Salvando..."
                : recoveryStatusLabels[status]}
            </button>
          ))}
        </div>

        {selectedStatus ? (
          <p className="mt-2 text-[11px] font-medium text-slate-500">
            Marcado como{" "}
            <span className="font-semibold text-slate-700">
              {recoveryStatusLabels[selectedStatus]}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}