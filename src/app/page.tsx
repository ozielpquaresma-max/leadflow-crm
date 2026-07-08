"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "cadastro";

type ProvisioningInput = {
  nome?: string;
  empresa?: string;
  telefone?: string;
  documento?: string;
  email?: string;
};

type DefaultTemplate = {
  id: string;
  title: string;
  description: string;
  message: string;
};

const defaultTemplates: DefaultTemplate[] = [
  {
    id: "pix_pendente",
    title: "PIX pendente",
    description: "Mensagem para clientes que geraram PIX e ainda não pagaram.",
    message:
      "Olá, {{nome}}. Tudo bem?\n\nVi que seu pedido do {{produto}} ficou com o PIX pendente.\nO valor é {{valor}}.\n\nSe quiser finalizar agora, o link está aqui:\n{{checkout_url}}\n\nQualquer dúvida, me chama que eu te ajudo.",
  },
  {
    id: "checkout_abandonado",
    title: "Checkout abandonado",
    description: "Mensagem para quem iniciou o pedido, mas não finalizou.",
    message:
      "Olá, {{nome}}. Tudo bem?\n\nVi que você iniciou o pedido do {{produto}}, mas não chegou a finalizar.\n\nAconteceu algum problema no checkout?\nVocê pode continuar por aqui:\n{{checkout_url}}\n\nSe precisar, eu te ajudo agora.",
  },
  {
    id: "cartao_recusado",
    title: "Cartão recusado",
    description: "Mensagem para falha no pagamento com cartão.",
    message:
      "Olá, {{nome}}. Tudo bem?\n\nSeu pedido do {{produto}} não foi concluído porque o pagamento no cartão não foi aprovado.\n\nVocê pode tentar novamente ou finalizar por outro método de pagamento.\nLink para tentar novamente:\n{{checkout_url}}\n\nSe quiser, te ajudo a concluir agora.",
  },
  {
    id: "aguardando_resposta",
    title: "Aguardando resposta",
    description: "Follow-up leve para cliente já contatado.",
    message:
      "Olá, {{nome}}. Tudo bem?\n\nPassando só para acompanhar seu pedido do {{produto}}.\n\nFicou alguma dúvida ou posso te ajudar a finalizar?\nLink para continuar:\n{{checkout_url}}",
  },
  {
    id: "sem_resposta",
    title: "Sem resposta",
    description: "Mensagem para segunda tentativa de contato.",
    message:
      "Olá, {{nome}}. Tudo bem?\n\nTentei falar com você sobre o pedido do {{produto}}.\n\nAinda posso te ajudar a finalizar ou prefere que eu encerre por aqui?\nLink do pedido:\n{{checkout_url}}",
  },
  {
    id: "ultima_tentativa",
    title: "Última tentativa",
    description: "Mensagem final antes de encerrar a tentativa de recuperação.",
    message:
      "Olá, {{nome}}. Tudo bem?\n\nEstou passando para fazer uma última tentativa sobre o pedido do {{produto}}.\n\nSe ainda tiver interesse, você pode finalizar por aqui:\n{{checkout_url}}\n\nSe não for o momento, sem problema. Posso encerrar esse atendimento por enquanto.",
  },
];

function createSlug(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  const base = normalized || "empresa";

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

function createWebhookSecret() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);

  const secret = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return `rc_${secret}`;
}

function getUserMetadata(user: User) {
  return user.user_metadata as Record<string, string | undefined>;
}

async function ensureDefaultIntegration(empresaId: string) {
  const { data: integracaoExistente, error: integracaoError } = await supabase
    .from("integracoes")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("plataforma", "kiwify")
    .maybeSingle();

  if (integracaoError) {
    throw new Error(integracaoError.message);
  }

  if (integracaoExistente?.id) {
    return;
  }

  const { error: insertError } = await supabase.from("integracoes").insert({
    empresa_id: empresaId,
    plataforma: "kiwify",
    nome: "Kiwify",
    tipo_token: "query_token",
    status: "pendente",
    updated_at: new Date().toISOString(),
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function ensureDefaultMessageTemplates(empresaId: string) {
  const { data: modelosExistentes, error: modelosError } = await supabase
    .from("modelos_mensagens")
    .select("tipo")
    .eq("empresa_id", empresaId);

  if (modelosError) {
    throw new Error(modelosError.message);
  }

  const existingTypes = new Set(
    (modelosExistentes || []).map((modelo) => modelo.tipo)
  );

  const modelosFaltantes = defaultTemplates
    .filter((template) => !existingTypes.has(template.id))
    .map((template) => ({
      empresa_id: empresaId,
      tipo: template.id,
      titulo: template.title,
      descricao: template.description,
      mensagem: template.message,
      ativo: true,
      updated_at: new Date().toISOString(),
    }));

  if (modelosFaltantes.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from("modelos_mensagens")
    .insert(modelosFaltantes);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function ensureAccountProvisioned(user: User, input?: ProvisioningInput) {
  const metadata = getUserMetadata(user);

  const userEmail = (input?.email || user.email || "").trim().toLowerCase();

  if (!userEmail) {
    throw new Error("E-mail do usuário não encontrado.");
  }

  const resolvedNome =
    input?.nome?.trim() ||
    metadata.full_name?.trim() ||
    userEmail.split("@")[0] ||
    "Usuário";

  const resolvedEmpresa =
    input?.empresa?.trim() ||
    metadata.company_name?.trim() ||
    `Empresa de ${resolvedNome}`;

  const resolvedTelefone =
    input?.telefone?.trim() || metadata.phone?.trim() || null;

  const { data: usuarioExistente, error: usuarioError } = await supabase
    .from("usuarios")
    .select("empresa_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (usuarioError) {
    throw new Error(usuarioError.message);
  }

  let empresaId = usuarioExistente?.empresa_id as string | undefined;

  if (!empresaId) {
    const { data: empresaExistente, error: empresaExistenteError } =
      await supabase
        .from("empresas")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();

    if (empresaExistenteError) {
      throw new Error(empresaExistenteError.message);
    }

    empresaId = empresaExistente?.id as string | undefined;
  }

  if (!empresaId) {
    const { data: novaEmpresa, error: novaEmpresaError } = await supabase
      .from("empresas")
      .insert({
        nome: resolvedEmpresa,
        slug: createSlug(resolvedEmpresa),
        email: userEmail,
        telefone: resolvedTelefone,
        owner_user_id: user.id,
        status: "ativa",
        webhook_secret: createWebhookSecret(),
        webhook_secret_updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (novaEmpresaError) {
      throw new Error(novaEmpresaError.message);
    }

    empresaId = novaEmpresa.id as string;
  } else {
    const { error: updateEmpresaError } = await supabase
      .from("empresas")
      .update({
        nome: resolvedEmpresa,
        email: userEmail,
        telefone: resolvedTelefone,
        status: "ativa",
      })
      .eq("id", empresaId);

    if (updateEmpresaError) {
      throw new Error(updateEmpresaError.message);
    }
  }

  const { error: usuarioUpsertError } = await supabase.from("usuarios").upsert(
    {
      empresa_id: empresaId,
      auth_user_id: user.id,
      nome: resolvedNome,
      email: userEmail,
      perfil: "admin",
      papel: "admin",
      ativo: true,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "auth_user_id",
    }
  );

  if (usuarioUpsertError) {
    throw new Error(usuarioUpsertError.message);
  }

  await ensureDefaultIntegration(empresaId);
  await ensureDefaultMessageTemplates(empresaId);

  return empresaId;
}

export default function HomePage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("cadastro");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        router.replace("/dashboard");
        return;
      }

      setCheckingSession(false);
    }

    checkSession();
  }, [router]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error("Usuário não encontrado após o login.");
      }

      await ensureAccountProvisioned(data.user, {
        email,
      });

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível entrar na conta.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCadastro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!nome.trim()) {
      setErrorMessage("Informe seu nome.");
      setLoading(false);
      return;
    }

    if (!empresa.trim()) {
      setErrorMessage("Informe o nome da empresa.");
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Informe seu e-mail.");
      setLoading(false);
      return;
    }

    if (senha.length < 6) {
      setErrorMessage("A senha precisa ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            full_name: nome,
            company_name: empresa,
            phone: telefone,
            document: documento,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.session?.user) {
        await ensureAccountProvisioned(data.session.user, {
          nome,
          empresa,
          telefone,
          documento,
          email,
        });

        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setSuccessMessage(
        "Cadastro criado. Agora confirme seu e-mail, se a confirmação estiver ativa, e depois faça login. Ao fazer login, o ReyCart criará automaticamente sua empresa, integração inicial e modelos de mensagens."
      );

      setMode("login");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível criar sua conta.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur">
          <Image
            src="/brand/reycart-logo.png"
            alt="Logo ReyCart"
            width={72}
            height={72}
            className="mx-auto h-16 w-16 object-contain"
            priority
          />

          <p className="mt-4 text-sm font-semibold text-white">
            Carregando ReyCart...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.22),_transparent_35%)]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl gap-10 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xl">
                <Image
                  src="/brand/reycart-logo.png"
                  alt="Logo ReyCart"
                  width={56}
                  height={56}
                  className="h-12 w-12 object-contain"
                  priority
                />
              </div>

              <div>
                <p className="text-2xl font-extrabold tracking-tight">
                  ReyCart
                </p>

                <p className="text-sm font-medium text-blue-100">
                  Recuperação inteligente de vendas
                </p>
              </div>
            </div>

            <div className="mt-20 max-w-2xl">
              <span className="rounded-full border border-blue-300/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-100">
                SaaS para recuperar vendas não finalizadas
              </span>

              <h1 className="mt-8 text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Recupere vendas que ficaram paradas no checkout.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                O ReyCart recebe eventos das suas plataformas de venda, organiza
                oportunidades de recuperação e ajuda sua equipe a chamar o
                cliente no WhatsApp com mensagens inteligentes.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-3xl font-black text-white">PIX</p>
                  <p className="mt-2 text-sm text-slate-300">
                    Identifique pagamentos pendentes.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-3xl font-black text-white">Cart</p>
                  <p className="mt-2 text-sm text-slate-300">
                    Recupere carrinhos abandonados.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-3xl font-black text-white">Whats</p>
                  <p className="mt-2 text-sm text-slate-300">
                    Chame o cliente com mensagem pronta.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-4 text-sm text-slate-300 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Integração por webhook com plataformas de venda
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Dashboard de oportunidades em tempo real
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Modelos de mensagens personalizáveis
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl md:p-8">
            <div className="mb-6 flex rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("cadastro");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  mode === "cadastro"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                Criar conta
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  mode === "login"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                Entrar
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                {mode === "cadastro"
                  ? "Comece sua conta no ReyCart"
                  : "Acesse sua conta"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {mode === "cadastro"
                  ? "Cadastre sua empresa para começar a receber eventos da sua plataforma de venda e recuperar pedidos não finalizados."
                  : "Entre com seu e-mail e senha para continuar gerenciando suas recuperações."}
              </p>
            </div>

            {errorMessage ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            {mode === "cadastro" ? (
              <form onSubmit={handleCadastro} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Seu nome
                  </label>

                  <input
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    placeholder="Ex: João Silva"
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Nome da empresa
                  </label>

                  <input
                    value={empresa}
                    onChange={(event) => setEmpresa(event.target.value)}
                    placeholder="Ex: Minha Loja Digital"
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      CNPJ ou CPF
                    </label>

                    <input
                      value={documento}
                      onChange={(event) => setDocumento(event.target.value)}
                      placeholder="Opcional"
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      WhatsApp
                    </label>

                    <input
                      value={telefone}
                      onChange={(event) => setTelefone(event.target.value)}
                      placeholder="Opcional"
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">
                    E-mail
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@empresa.com"
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Senha
                  </label>

                  <input
                    type="password"
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading ? "Criando conta..." : "Criar minha conta"}
                </button>

                <p className="text-center text-xs leading-5 text-slate-500">
                  Ao criar sua conta, o ReyCart prepara automaticamente sua
                  empresa, integração inicial e modelos de mensagens.
                </p>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700">
                    E-mail
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@empresa.com"
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Senha
                  </label>

                  <input
                    type="password"
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    placeholder="Sua senha"
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading ? "Entrando..." : "Entrar no ReyCart"}
                </button>

                <button
                  type="button"
                  onClick={() => setMode("cadastro")}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Ainda não tenho conta
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}