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
  const [registering, setRegistering] = useState(false);

  async function handleCopyPix() {
    if (!pixCode) return;

    await navigator.clipboard.writeText(pixCode);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  async function handleOpenWhatsApp() {
    if (!whatsappUrl || whatsappUrl === "#") return;

    setRegistering(true);

    const { error } = await supabase.from("interacoes").insert({
      empresa_id: empresaId,
      cliente_id: clienteId,
      pedido_id: pedidoId,
      tipo: "recuperacao_manual",
      canal: "whatsapp",
      mensagem: whatsappMessage,
      resultado: "whatsapp_aberto",
    });

    if (error) {
      console.error("Erro ao registrar interação:", error.message);
    }

    setRegistering(false);
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleOpenWhatsApp}
        disabled={registering || whatsappUrl === "#"}
        className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {registering ? "Registrando..." : "WhatsApp"}
      </button>

      {checkoutUrl ? (
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Checkout
        </a>
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