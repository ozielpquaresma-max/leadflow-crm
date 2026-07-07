"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type DashboardAutoRefreshProps = {
  intervalMs?: number;
};

function formatTime(date: Date | null) {
  if (!date) return "Ainda não atualizado";

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function DashboardAutoRefresh({
  intervalMs = 15000,
}: DashboardAutoRefreshProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date());

  function refreshNow() {
    startTransition(() => {
      router.refresh();
      setLastUpdate(new Date());
    });
  }

  useEffect(() => {
    if (!enabled) return;

    const interval = window.setInterval(() => {
      refreshNow();
    }, intervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [enabled, intervalMs]);

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-bold text-blue-950">
            Dashboard em atualização automática {enabled ? "ativa" : "pausada"}
          </p>

          <p className="mt-1 text-xs text-blue-700">
            Os indicadores são atualizados a cada {Math.floor(intervalMs / 1000)}{" "}
            segundos. Última atualização: {formatTime(lastUpdate)}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refreshNow}
            disabled={isPending}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isPending ? "Atualizando..." : "Atualizar agora"}
          </button>

          <button
            type="button"
            onClick={() => setEnabled((current) => !current)}
            className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
          >
            {enabled ? "Pausar" : "Retomar"}
          </button>
        </div>
      </div>
    </div>
  );
}