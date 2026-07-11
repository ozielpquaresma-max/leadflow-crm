import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

type ProvisionBody = {
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada.");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const EMPRESA_STATUS_INICIAL = "trial";

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

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization) return null;

  const [type, token] = authorization.split(" ");

  if (type?.toLowerCase() !== "bearer") return null;

  return token || null;
}

function getUserMetadata(user: User) {
  return user.user_metadata as Record<string, string | undefined>;
}

async function getUserFromRequest(request: NextRequest) {
  const token = getBearerToken(request);

  if (!token) {
    throw new Error("Token de sessão não enviado.");
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  return user;
}

async function ensureDefaultIntegration(empresaId: string) {
  const { error } = await supabaseAdmin.from("integracoes").upsert(
    {
      empresa_id: empresaId,
      plataforma: "kiwify",
      nome: "Kiwify",
      tipo_token: "query_token",
      status: "pendente",
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "empresa_id,plataforma",
      ignoreDuplicates: true,
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function ensureDefaultMessageTemplates(empresaId: string) {
  const registrosPadrao = defaultTemplates.map((template) => ({
    empresa_id: empresaId,
    tipo: template.id,
    titulo: template.title,
    descricao: template.description,
    mensagem: template.message,
    ativo: true,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabaseAdmin.from("modelos_mensagens").upsert(
    registrosPadrao,
    {
      onConflict: "empresa_id,tipo",
      ignoreDuplicates: true,
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function ensureAccountProvisioned(user: User, input: ProvisionBody) {
  const metadata = getUserMetadata(user);

  const userEmail = (user.email || input.email || "").trim().toLowerCase();

  if (!userEmail) {
    throw new Error("E-mail do usuário não encontrado.");
  }

  const nomeFromInputOrMetadata =
    input.nome?.trim() || metadata.full_name?.trim();

  const empresaFromInputOrMetadata =
    input.empresa?.trim() || metadata.company_name?.trim();

  const telefoneFromInputOrMetadata =
    input.telefone?.trim() || metadata.phone?.trim();

  const resolvedNome =
    nomeFromInputOrMetadata || userEmail.split("@")[0] || "Usuário";

  const resolvedEmpresa =
    empresaFromInputOrMetadata || `Empresa de ${resolvedNome}`;

  const resolvedTelefone = telefoneFromInputOrMetadata || null;

  const { data: usuarioExistente, error: usuarioError } = await supabaseAdmin
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
      await supabaseAdmin
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
    const { data: novaEmpresa, error: novaEmpresaError } = await supabaseAdmin
      .from("empresas")
      .insert({
        nome: resolvedEmpresa,
        slug: createSlug(resolvedEmpresa),
        email: userEmail,
        telefone: resolvedTelefone,
        owner_user_id: user.id,
        status: EMPRESA_STATUS_INICIAL,
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
    const empresaUpdate: {
      nome?: string;
      email: string;
      telefone?: string | null;
    } = {
      email: userEmail,
    };

    if (empresaFromInputOrMetadata) {
      empresaUpdate.nome = empresaFromInputOrMetadata;
    }

    if (telefoneFromInputOrMetadata) {
      empresaUpdate.telefone = telefoneFromInputOrMetadata;
    }

    const { error: updateEmpresaError } = await supabaseAdmin
      .from("empresas")
      .update(empresaUpdate)
      .eq("id", empresaId);

    if (updateEmpresaError) {
      throw new Error(updateEmpresaError.message);
    }
  }

  const { error: usuarioUpsertError } = await supabaseAdmin
    .from("usuarios")
    .upsert(
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

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    const body = (await request.json().catch(() => ({}))) as ProvisionBody;

    const empresaId = await ensureAccountProvisioned(user, body);

    return NextResponse.json({
      ok: true,
      empresaId,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao provisionar conta.";

    console.error("Erro ao provisionar conta:", error);

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status: 400,
      }
    );
  }
}