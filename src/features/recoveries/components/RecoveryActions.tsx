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

  async function registerInteraction({
    canal,
    mensagem,
    resultado,
  }: {
    canal: string;
    mensagem: string;
    resultado: string;
  }) {
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
    if (!whatsappUrl || whatsappUrl === "#") return;

    setRegisteringWhatsapp(true);

    await registerInteraction({
      canal: "whatsapp",
      mensagem: whatsappMessage,
      resultado: "whatsapp_aberto",
    });

    setRegisteringWhatsapp(false);
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  async function handleOpenCheckout() {
    if (!checkoutUrl) return;

    setRegisteringCheckout(true);

    await registerInteraction({
      canal: "checkout",
      mensagem: "Checkout aberto pelo atendente durante a recuperação.",
      resultado: "checkout_aberto",
    });

    setRegisteringCheckout(false);
    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
  }

  async function handleCopyPix() {
    if (!pixCode) return;

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
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleOpenWhatsApp}
        disabled={registeringWhatsapp || whatsappUrl === "#"}
        className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {registeringWhatsapp ? "Registrando..." : "WhatsApp"}
      </button>

      {checkoutUrl ? (
        <button
          type="button"
          onClick={handleOpenCheckout}
          disabled={registeringCheckout}
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {registeringCheckout ? "Abrindo..." : "Checkout"}
        </button>
      ) : null}

      {pixCode ? (
        <button
          type="button"
          onClick={handleCopyPix}
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {copied ? "PIX copiado" : "Copiar PIX"}
        </button>
      ) : null}
    </div>
  );
}