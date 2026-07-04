"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type RecoveryActionsProps = {
  empresaId: string | null;
  clienteId: string | null;
  pedidoId: string;
  whatsappUrl: string;
  whatsappMessage: string;
  checkoutUrl: string | null;
  pixCode: string | null;
};

type InteractionData = {
  canal: string;
  mensagem: string;
  resultado: string;
};

export function RecoveryActions({
  empresaId,
  clienteId,
  pedidoId,
  whatsappUrl,
  whatsappMessage,
  checkoutUrl,
  pixCode,
}: RecoveryActionsProps) {
  const [copied, setCopied] = useState(false);
  const [registeringWhatsapp, setRegisteringWhatsapp] = useState(false);
  const [registeringCheckout, setRegisteringCheckout] = useState(false);
  const [copyingPix, setCopyingPix] = useState(false);

  const hasWhatsapp = Boolean(whatsappUrl && whatsappUrl !== "#");
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
    if (!hasWhatsapp) return;

    setRegisteringWhatsapp(true);

    try {
      await registerInteraction({
        canal: "whatsapp",
        mensagem: whatsappMessage,
        resultado: "whatsapp_aberto",
      });

      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
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
    <div className="w-full max-w-[240px] space-y-2">
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
  );
}