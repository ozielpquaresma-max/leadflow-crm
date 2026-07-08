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

export function Topbar({
  userName = "Usuário",
  userEmail = "",
  userAvatar,
}: TopbarProps) {
  const router = useRouter();

  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);

  const [searchFocus, setSearchFocus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [oportunidades, setOportunidades] = useState<
    OportunidadeNotificacao[]
  >([]);
  const [webhooks, setWebhooks] = useState<WebhookNotificacao[]>([]);
  const [totalOportunidades, setTotalOportunidades] = useState(0);

  const webhooksComErro = webhooks.filter(
    (webhook) => webhook.processado === false
  ).length;

  const notificationCount = totalOportunidades + webhooksComErro;
  const notificationBadge = notificationCount > 99 ? "99+" : notificationCount;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target)
      ) {
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

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoadingNotifications(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;

      if (!userId) {
        setOportunidades([]);
        setWebhooks([]);
        setTotalOportunidades(0);
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
        return;
      }

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

      const { data: webhooksData } = await supabase
        .from("webhooks")
        .select("id, evento, processado, created_at")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false })
        .limit(5);

      setOportunidades((oportunidadesData || []) as OportunidadeNotificacao[]);
      setTotalOportunidades(oportunidadesCount || 0);
      setWebhooks((webhooksData || []) as WebhookNotificacao[]);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setLoadingNotifications(false);
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
    setNotificationsOpen((current) => !current);
    setProfileMenuOpen(false);
    loadNotifications();
  }

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await supabase.auth.signOut();

      setProfileMenuOpen(false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Erro ao sair da conta:", error);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <form onSubmit={handleSearch} className="max-w-sm flex-1">
        <Input
          type="search"
          value={searchTerm}
          placeholder="Buscar oportunidades..."
          leftIcon={Icons.search(18)}
          onChange={(event) => setSearchTerm(event.target.value)}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          className={cn(searchFocus ? "border-blue-500" : "")}
        />
      </form>

      <div className="ml-6 flex items-center gap-4">
        <div ref={notificationMenuRef} className="relative">
          <button
            type="button"
            onClick={openNotifications}
            className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            title="Notificações"
          >
            {Icons.bell(20)}

            {notificationCount > 0 ? (
              <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                {notificationBadge}
              </span>
            ) : null}
          </button>

          {notificationsOpen ? (
            <div className="absolute right-0 top-full mt-3 w-[360px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-gray-950">
                    Notificações
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Oportunidades e eventos recentes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadNotifications}
                  disabled={loadingNotifications}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingNotifications ? "Atualizando..." : "Atualizar"}
                </button>
              </div>

              <div className="max-h-[480px] overflow-y-auto p-3">
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
            onClick={() => {
              setProfileMenuOpen((current) => !current);
              setNotificationsOpen(false);
            }}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100"
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
            <div className="absolute right-0 top-full mt-3 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
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
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
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
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
                >
                  <span className="text-gray-500">{Icons.settings(16)}</span>

                  <span>Configurações</span>
                </button>

                <button
                  type="button"
                  onClick={goToHelp}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
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