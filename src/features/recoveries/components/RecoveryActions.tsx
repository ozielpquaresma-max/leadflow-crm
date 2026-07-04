"use client";

import { useState } from "react";

type RecoveryActionsProps = {
  whatsappUrl: string;
  checkoutUrl: string | null;
  pixCode: string | null;
};

export function RecoveryActions({
  whatsappUrl,
  checkoutUrl,
  pixCode,
}: RecoveryActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopyPix() {
    if (!pixCode) return;

    await navigator.clipboard.writeText(pixCode);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
      >
        WhatsApp
      </a>

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