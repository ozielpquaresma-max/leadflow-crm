"use client";

import React, { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { Input, Avatar } from "@/components/ui";
import { supabase } from "@/lib/supabase";

interface TopbarProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  onOpenSidebar?: () => void;
}

type OportunidadeNotificacao = {
  pedido_id: string;
  cliente_nome: string | null;
  status: string | null;
  status_label: string | null;
  criado_na_plataforma: string | null;
};

type WebhookNotificacao = {
  id: string;
  evento: string | null;
  processado: boolean | null;
  created_at: string | null;
};

const SOUND_STORAGE_KEY = "reycart:cartSoundEnabled";

function getSeenStorageKey(empresaId: string) {
  return `reycart:notificationsSeenAt:${empresaId}`;
}

function getStoredSeenAt(empresaId: string) {
  if (typeof window === "undefined") return null;

  return window.localStorage.getItem(getSeenStorageKey(empresaId));
}

function setStoredSeenAt(empresaId: string, value: string) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(getSeenStorageKey(empresaId), value);
}

function getStoredSoundEnabled() {
  if (typeof window === "undefined") return false;

  return window.localStorage.getItem(SOUND_STORAGE_KEY) === "true";
}

function setStoredSoundEnabled(value: boolean) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(SOUND_STORAGE_KEY, String(value));
}

function normalizeDateValue(value: string | null) {
  if (!value) return null;

  const hasTimezone =
    value.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(value);

  return hasTimezone ? value : `${value}Z`;
}

function formatDate(value: string | null) {
  if (!value) return "Agora";

  const normalizedValue = normalizeDateValue(value);

  if (!normalizedValue) return "Agora";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Belem",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(normalizedValue));
}

function getEventLabel(evento: string | null) {
  if (!evento) return "Evento recebido";

  const labels: Record<string, string> = {
    pix_created: "PIX gerado",
    boleto_created: "Boleto gerado",
    cart_abandoned: "Carrinho abandonado",
    checkout_abandoned: "Checkout abandonado",
    order_rejected: "Compra recusada",
    order_approved: "Compra aprovada",
    kiwify_event: "Evento recebido",
    pix_pendente: "PIX pendente",
    checkout_abandonado: "Checkout abandonado",
    cartao_recusado: "Cartão recusado",
    pago: "Compra aprovada",
  };

  return labels[evento] || evento;
}

function getStatusLabel(status: string | null, statusLabel: string | null) {
  if (statusLabel) return statusLabel;

  const labels: Record<string, string> = {
    pix_pendente: "PIX pendente",
    checkout_abandonado: "Checkout abandonado",
    cartao_recusado: "Cartão recusado",
  };

  return status ? labels[status] || status : "Oportunidade";
}

function isAbandonedCartOpportunity(oportunidade: OportunidadeNotificacao) {
  const statusText = `${oportunidade.status || ""} ${
    oportunidade.status_label || ""
  }`.toLowerCase();

  return (
    statusText.includes("abandon") ||
    statusText.includes("carrinho") ||
    statusText.includes("checkout")
  );
}

async function playCartNotificationSound() {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const now = audioContext.currentTime;
    const masterGain = audioContext.createGain();

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.85, now + 0.03);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
    masterGain.connect(audioContext.destination);

    function tone(
      frequency: number,
      start: number,
      duration: number,
      type: OscillatorType = "triangle"
    ) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now + start);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(80, frequency * 0.82),
        now + start + duration
      );

      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.9, now + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      oscillator.connect(gain);
      gain.connect(masterGain);

      oscillator.start(now + start);
      oscillator.stop(now + start + duration + 0.03);
    }

    tone(980, 0, 0.18, "triangle");
    tone(1320, 0.16, 0.16, "sine");
    tone(720, 0.34, 0.22, "triangle"); tone(1180, 0.62, 0.22, "sine"); if ("vibrate" in navigator) navigator.vibrate([160, 80, 160]);

    window.setTimeout(() => {
      void audioContext.close().catch(() => null);
    }, 900);
  } catch {
    // Alguns navegadores bloqueiam som até o usuário clicar em "Ativar som".
  }
}

function clearSupabaseBrowserStorage() {
  if (typeof window === "undefined") return;

  const storageKeys = [
    ...Object.keys(window.localStorage),
    ...Object.keys(window.sessionStorage),
  ];

  storageKeys.forEach((key) => {
    const isSupabaseAuthKey =
      key.startsWith("sb-") ||
      key.toLowerCase().includes("supabase") ||
      key.toLowerCase().includes("auth-token");

    if (!isSupabaseAuthKey) return;

    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });
}

export function Topbar({
  userName = "Usuário",
  userEmail = "",
  userAvatar,
  onOpenSidebar,
}: TopbarProps) {
  const router = useRouter();

  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const knownOpportunityIdsRef = useRef<Set<string>>(new Set());
  const firstNotificationsLoadRef = useRef(true);
  const soundEnabledRef = useRef(false);
  const empresaIdRef = useRef<string | null>(null);
  const seenAtRef = useRef<string | null>(null);
  const signingOutRef = useRef(false);

  const [searchFocus, setSearchFocus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const [oportunidades, setOportunidades] = useState<
    OportunidadeNotificacao[]
  >([]);
  const [webhooks, setWebhooks] = useState<WebhookNotificacao[]>([]);
  const [totalOportunidades, setTotalOportunidades] = useState(0);
  const [newNotificationCount, setNewNotificationCount] = useState(0);

  const webhooksComErro = webhooks.filter(
    (webhook) => webhook.processado === false
  ).length;

  const notificationCount = newNotificationCount;
  const notificationBadge = notificationCount > 99 ? "99+" : notificationCount;

  useEffect(() => {
    signingOutRef.current = signingOut;
  }, [signingOut]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    const savedSoundEnabled = getStoredSoundEnabled();

    setSoundEnabled(savedSoundEnabled);
    soundEnabledRef.current = savedSoundEnabled;

    loadNotifications();

    const interval = window.setInterval(() => {
      loadNotifications({ silent: true });
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }

      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(target)
      ) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function markNotificationsAsSeen() {
    const empresaId = empresaIdRef.current;

    if (!empresaId) {
      setNewNotificationCount(0);
      return;
    }

    const now = new Date().toISOString();

    seenAtRef.current = now;
    setStoredSeenAt(empresaId, now);
    setNewNotificationCount(0);
  }

  async function enableCartSound() {
    setSoundEnabled(true);
    soundEnabledRef.current = true;
    setStoredSoundEnabled(true);

    await playCartNotificationSound();
  }

  function disableCartSound() {
    setSoundEnabled(false);
    soundEnabledRef.current = false;
    setStoredSoundEnabled(false);
  }

  async function loadNotifications(options?: { silent?: boolean }) {
    if (signingOutRef.current) return;

    if (!options?.silent) {
      setLoadingNotifications(true);
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;

      if (!userId) {
        setOportunidades([]);
        setWebhooks([]);
        setTotalOportunidades(0);
        setNewNotificationCount(0);
        return;
      }

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("auth_user_id", userId)
        .maybeSingle();

      const empresaId = usuario?.empresa_id as string | undefined;

      if (!empresaId) {
        setOportunidades([]);
        setWebhooks([]);
        setTotalOportunidades(0);
        setNewNotificationCount(0);
        return;
      }

      empresaIdRef.current = empresaId;

      const storedSeenAt = getStoredSeenAt(empresaId);
      seenAtRef.current = storedSeenAt;

      const { data: oportunidadesData } = await supabase
        .from("vw_recuperacao_vendas")
        .select(
          "pedido_id, cliente_nome, status, status_label, criado_na_plataforma"
        )
        .eq("empresa_id", empresaId)
        .order("criado_na_plataforma", { ascending: false })
        .limit(5);

      const { count: oportunidadesCount } = await supabase
        .from("vw_recuperacao_vendas")
        .select("pedido_id", { count: "exact", head: true })
        .eq("empresa_id", empresaId);

      let novasOportunidadesQuery = supabase
        .from("vw_recuperacao_vendas")
        .select("pedido_id", { count: "exact", head: true })
        .eq("empresa_id", empresaId);

      if (storedSeenAt) {
        novasOportunidadesQuery = novasOportunidadesQuery.gt(
          "criado_na_plataforma",
          storedSeenAt
        );
      }

      const { count: novasOportunidadesCount } =
        await novasOportunidadesQuery;

      const { data: webhooksData } = await supabase
        .from("webhooks")
        .select("id, evento, processado, created_at")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false })
        .limit(5);

      let novosWebhooksErroQuery = supabase
        .from("webhooks")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .eq("processado", false);

      if (storedSeenAt) {
        novosWebhooksErroQuery = novosWebhooksErroQuery.gt(
          "created_at",
          storedSeenAt
        );
      }

      const { count: novosWebhooksErroCount } =
        await novosWebhooksErroQuery;

      const oportunidadesAtuais = (oportunidadesData ||
        []) as OportunidadeNotificacao[];

      if (firstNotificationsLoadRef.current) {
        oportunidadesAtuais.forEach((oportunidade) => {
          knownOpportunityIdsRef.current.add(oportunidade.pedido_id);
        });

        firstNotificationsLoadRef.current = false;
      } else {
        const novasOportunidades = oportunidadesAtuais.filter(
          (oportunidade) =>
            !knownOpportunityIdsRef.current.has(oportunidade.pedido_id)
        );

        const novaOportunidadeAbandonada = novasOportunidades.some(
          isAbandonedCartOpportunity
        );

        novasOportunidades.forEach((oportunidade) => {
          knownOpportunityIdsRef.current.add(oportunidade.pedido_id);
        });

        if (novaOportunidadeAbandonada && soundEnabledRef.current) {
          void playCartNotificationSound();
        }
      }

      setOportunidades(oportunidadesAtuais);
      setTotalOportunidades(oportunidadesCount || 0);
      setWebhooks((webhooksData || []) as WebhookNotificacao[]);
      setNewNotificationCount(
        (novasOportunidadesCount || 0) + (novosWebhooksErroCount || 0)
      );
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      if (!options?.silent) {
        setLoadingNotifications(false);
      }
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchTerm.trim();

    if (!query) {
      router.push("/recuperacao");
      return;
    }

    router.push(`/recuperacao?q=${encodeURIComponent(query)}`);
  }

  function goToProfile() {
    setProfileMenuOpen(false);
    router.push("/perfil");
  }

  function goToSettings() {
    setProfileMenuOpen(false);
    router.push("/configuracoes");
  }

  function goToHelp() {
    setProfileMenuOpen(false);
    router.push("/ajuda");
  }

  function openNotifications() {
    if (signingOutRef.current) return;

    const willOpen = !notificationsOpen;

    setNotificationsOpen(willOpen);
    setProfileMenuOpen(false);

    if (willOpen) {
      markNotificationsAsSeen();
      loadNotifications();
    }
  }

  async function handleSignOut() {
    if (signingOutRef.current) return;

    setSigningOut(true);
    signingOutRef.current = true;
    setProfileMenuOpen(false);
    setNotificationsOpen(false);
    setOportunidades([]);
    setWebhooks([]);
    setTotalOportunidades(0);
    setNewNotificationCount(0);

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao sair da conta:", error);
    } finally {
      clearSupabaseBrowserStorage();

      router.replace("/");
      router.refresh();

      window.setTimeout(() => {
        window.location.replace("/");
      }, 50);
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 sm:px-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 lg:hidden"
          aria-label="Abrir menu"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </svg>
        </button>

        <form onSubmit={handleSearch} className="hidden max-w-sm flex-1 sm:block">
          <Input
            type="search"
            value={searchTerm}
            placeholder="Buscar oportunidades..."
            leftIcon={Icons.search(18)}
            onChange={(event) => setSearchTerm(event.target.value)}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            className={cn(searchFocus ? "border-blue-500" : "")}
            disabled={signingOut}
          />
        </form>
      </div>

      <div className="ml-2 flex items-center gap-2 sm:ml-6 sm:gap-4">
        <button
          type="button"
          onClick={() => router.push("/recuperacao")}
          disabled={signingOut}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 sm:hidden"
          title="Buscar oportunidades"
        >
          {Icons.search(20)}
        </button>

        <div ref={notificationMenuRef} className="relative">
          <button
            type="button"
            onClick={openNotifications}
            disabled={signingOut}
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            title="Notificações"
          >
            {Icons.bell(20)}

            {notificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                {notificationBadge}
              </span>
            ) : null}
          </button>

          {notificationsOpen ? (
            <div className="fixed left-3 right-3 top-16 z-50 mt-2 max-h-[calc(100dvh-5rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[380px]">
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-gray-950">
                    Notificações
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Oportunidades e eventos recentes.
                  </p>

                  <p className="mt-2 text-[11px] font-medium text-gray-400">
                    O sino zera quando você abre esta área.
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => loadNotifications()}
                    disabled={loadingNotifications}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingNotifications ? "Atualizando..." : "Atualizar"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      soundEnabled ? disableCartSound : enableCartSound
                    }
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs font-bold transition",
                      soundEnabled
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    )}
                  >
                    {soundEnabled ? "Som ativo" : "Ativar som"}
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto p-3 sm:max-h-[480px]">
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      router.push("/recuperacao");
                    }}
                    className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-left transition hover:bg-blue-100"
                  >
                    <p className="text-xl font-black text-blue-700">
                      {totalOportunidades}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-blue-700">
                      Em recuperação
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      router.push("/integracoes");
                    }}
                    className="rounded-2xl border border-red-100 bg-red-50 p-3 text-left transition hover:bg-red-100"
                  >
                    <p className="text-xl font-black text-red-700">
                      {webhooksComErro}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-red-700">
                      Eventos com erro
                    </p>
                  </button>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-gray-400">
                    Últimas oportunidades
                  </p>

                  {oportunidades.length === 0 ? (
                    <p className="rounded-xl bg-white p-3 text-xs text-gray-500">
                      Nenhuma oportunidade nova no momento.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {oportunidades.map((oportunidade) => (
                        <button
                          key={oportunidade.pedido_id}
                          type="button"
                          onClick={() => {
                            setNotificationsOpen(false);
                            router.push(
                              `/recuperacao/${oportunidade.pedido_id}`
                            );
                          }}
                          className="w-full rounded-xl bg-white p-3 text-left transition hover:bg-blue-50"
                        >
                          <p className="truncate text-sm font-bold text-gray-950">
                            {oportunidade.cliente_nome || "Cliente sem nome"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {getStatusLabel(
                              oportunidade.status,
                              oportunidade.status_label
                            )}{" "}
                            • {formatDate(oportunidade.criado_na_plataforma)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-gray-400">
                    Últimos eventos
                  </p>

                  {webhooks.length === 0 ? (
                    <p className="rounded-xl bg-white p-3 text-xs text-gray-500">
                      Nenhum evento recebido no momento.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {webhooks.map((webhook) => (
                        <button
                          key={webhook.id}
                          type="button"
                          onClick={() => {
                            setNotificationsOpen(false);
                            router.push("/integracoes");
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-xl bg-white p-3 text-left transition hover:bg-blue-50"
                        >
                          <div>
                            <p className="text-sm font-bold text-gray-950">
                              {getEventLabel(webhook.evento)}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {formatDate(webhook.created_at)}
                            </p>
                          </div>

                          <span
                            className={
                              webhook.processado
                                ? "rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700"
                                : "rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700"
                            }
                          >
                            {webhook.processado ? "OK" : "Erro"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-gray-100 p-3">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    router.push("/recuperacao");
                  }}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
                >
                  Ver recuperação
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    router.push("/integracoes");
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
                >
                  Ver integrações
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div ref={profileMenuRef} className="relative">
          <button
            type="button"
            disabled={signingOut}
            onClick={() => {
              setProfileMenuOpen((current) => !current);
              setNotificationsOpen(false);
            }}
            className="flex cursor-pointer items-center gap-3 rounded-2xl px-1.5 py-1.5 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 sm:py-2"
          >
            <Avatar name={userName} src={userAvatar} size="md" status="online" />

            <div className="hidden flex-col items-start sm:flex">
              <span className="max-w-[220px] truncate text-sm font-medium text-gray-900">
                {userName}
              </span>

              {userEmail ? (
                <span className="max-w-[220px] truncate text-xs text-gray-500">
                  {userEmail}
                </span>
              ) : null}
            </div>
          </button>

          {profileMenuOpen ? (
            <div className="fixed left-3 right-3 top-16 z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-64">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-sm font-bold text-gray-950">
                  {userName}
                </p>

                {userEmail ? (
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {userEmail}
                  </p>
                ) : null}
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={goToProfile}
                  disabled={signingOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="text-gray-500">
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </span>

                  <span>Meu Perfil</span>
                </button>

                <button
                  type="button"
                  onClick={goToSettings}
                  disabled={signingOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="text-gray-500">{Icons.settings(16)}</span>

                  <span>Configurações</span>
                </button>

                <button
                  type="button"
                  onClick={goToHelp}
                  disabled={signingOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="text-gray-500">{Icons.helpCircle(16)}</span>

                  <span>Ajuda</span>
                </button>
              </div>

              <div className="border-t border-gray-100 p-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>{Icons.logOut(16)}</span>

                  <span>{signingOut ? "Saindo..." : "Sair"}</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}


