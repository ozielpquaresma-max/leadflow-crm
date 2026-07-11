import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type BillingBody = {
  nome?: string;
  email?: string;
  telefone?: string;
  documento?: string;
  billingType?: "UNDEFINED" | "PIX" | "BOLETO";
};

type Plano = {
  id: string;
  codigo: string;
  nome: string;
  valor_centavos: number;
  moeda: string;
  intervalo: string;
};

type Empresa = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  status: string | null;
};

type UsuarioInterno = {
  empresa_id: string;
  nome: string | null;
  email: string | null;
};

type BillingCliente = {
  id: string;
  empresa_id: string;
  gateway: string;
  asaas_customer_id: string | null;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  documento: string | null;
};

type AsaasCustomerResponse = {
  id?: string;
  name?: string;
  email?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  errors?: Array<{
    code?: string;
    description?: string;
  }>;
};

type AsaasSubscriptionResponse = {
  id?: string;
  customer?: string;
  value?: number;
  status?: string;
  billingType?: string;
  cycle?: string;
  nextDueDate?: string;
  description?: string;
  externalReference?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  errors?: Array<{
    code?: string;
    description?: string;
  }>;
};

type AsaasPayment = {
  id?: string;
  status?: string;
  value?: number;
  dueDate?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  billingType?: string;
  subscription?: string;
};

type AsaasSubscriptionPaymentsResponse = {
  object?: string;
  hasMore?: boolean;
  totalCount?: number;
  limit?: number;
  offset?: number;
  data?: AsaasPayment[];
  errors?: Array<{
    code?: string;
    description?: string;
  }>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const asaasApiKey = process.env.ASAAS_API_KEY;
const asaasBaseUrl =
  process.env.ASAAS_BASE_URL || "https://api.asaas.com/v3";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reycart.com.br";

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

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization) return null;

  const [type, token] = authorization.split(" ");

  if (type?.toLowerCase() !== "bearer") return null;

  return token || null;
}

function onlyDigits(value?: string | null) {
  return value ? value.replace(/\D/g, "") : "";
}

function formatDateForAsaas(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getAsaasErrorMessage(response: unknown) {
  const result = response as {
    errors?: Array<{
      description?: string;
    }>;
  };

  const firstError = result?.errors?.[0]?.description;

  return firstError || "Erro ao comunicar com o sistema de pagamento.";
}

async function asaasRequest<T>(path: string, init: RequestInit) {
  if (!asaasApiKey) {
    throw new Error("ASAAS_API_KEY não configurada.");
  }

  const response = await fetch(`${asaasBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: asaasApiKey,
      ...(init.headers || {}),
    },
  });

  const result = (await response.json().catch(() => null)) as T;

  if (!response.ok) {
    throw new Error(getAsaasErrorMessage(result));
  }

  return result;
}

async function getAuthenticatedUser(request: NextRequest) {
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

async function getEmpresaFromUser(authUserId: string) {
  const { data: usuario, error: usuarioError } = await supabaseAdmin
    .from("usuarios")
    .select("empresa_id, nome, email")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (usuarioError) {
    throw new Error(usuarioError.message);
  }

  if (!usuario?.empresa_id) {
    throw new Error("Usuário interno não encontrado no ReyCart.");
  }

  const usuarioInterno = usuario as UsuarioInterno;

  const { data: empresa, error: empresaError } = await supabaseAdmin
    .from("empresas")
    .select("id, nome, email, telefone, status")
    .eq("id", usuarioInterno.empresa_id)
    .maybeSingle();

  if (empresaError) {
    throw new Error(empresaError.message);
  }

  if (!empresa) {
    throw new Error("Empresa não encontrada.");
  }

  return {
    usuario: usuarioInterno,
    empresa: empresa as Empresa,
  };
}

async function getPlanoMensal() {
  const { data: plano, error } = await supabaseAdmin
    .from("planos")
    .select("id, codigo, nome, valor_centavos, moeda, intervalo")
    .eq("codigo", "reycart_mensal_49")
    .eq("ativo", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!plano) {
    throw new Error("Plano mensal do ReyCart não encontrado.");
  }

  return plano as Plano;
}

async function getOrCreateBillingCustomer({
  empresa,
  usuario,
  body,
}: {
  empresa: Empresa;
  usuario: UsuarioInterno;
  body: BillingBody;
}) {
  const { data: existingBillingCustomer, error: existingError } =
    await supabaseAdmin
      .from("billing_clientes")
      .select(
        "id, empresa_id, gateway, asaas_customer_id, nome, email, telefone, documento"
      )
      .eq("empresa_id", empresa.id)
      .eq("gateway", "asaas")
      .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existing = existingBillingCustomer as BillingCliente | null;

  if (existing?.asaas_customer_id) {
    return existing;
  }

  const nome =
    body.nome?.trim() ||
    empresa.nome?.trim() ||
    usuario.nome?.trim() ||
    "Cliente ReyCart";

  const email =
    body.email?.trim().toLowerCase() ||
    empresa.email?.trim().toLowerCase() ||
    usuario.email?.trim().toLowerCase();

  if (!email) {
    throw new Error("Informe um e-mail para criar a assinatura.");
  }

  const telefoneLimpo = onlyDigits(body.telefone || empresa.telefone);
  const documentoLimpo = onlyDigits(body.documento);

  const asaasCustomer = await asaasRequest<AsaasCustomerResponse>(
    "/customers",
    {
      method: "POST",
      body: JSON.stringify({
        name: nome,
        email,
        mobilePhone: telefoneLimpo || undefined,
        cpfCnpj: documentoLimpo || undefined,
        externalReference: empresa.id,
        notificationDisabled: false,
        groupName: "ReyCart",
      }),
    }
  );

  if (!asaasCustomer.id) {
    throw new Error("O sistema de pagamento não retornou o ID do cliente.");
  }

  const payload = {
    empresa_id: empresa.id,
    gateway: "asaas",
    asaas_customer_id: asaasCustomer.id,
    nome,
    email,
    telefone: telefoneLimpo || null,
    documento: documentoLimpo || null,
    raw: asaasCustomer,
    updated_at: new Date().toISOString(),
  };

  const { data: billingCustomer, error: upsertError } = await supabaseAdmin
    .from("billing_clientes")
    .upsert(payload, {
      onConflict: "empresa_id,gateway",
    })
    .select(
      "id, empresa_id, gateway, asaas_customer_id, nome, email, telefone, documento"
    )
    .single();

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return billingCustomer as BillingCliente;
}

async function createAsaasSubscription({
  empresa,
  plano,
  billingCustomer,
  body,
}: {
  empresa: Empresa;
  plano: Plano;
  billingCustomer: BillingCliente;
  body: BillingBody;
}) {
  if (!billingCustomer.asaas_customer_id) {
    throw new Error("Cliente de cobrança não encontrado.");
  }

  const billingType = body.billingType || "UNDEFINED";
  const today = new Date();
  const nextDueDate = formatDateForAsaas(today);
  const valor = plano.valor_centavos / 100;

  const asaasSubscription = await asaasRequest<AsaasSubscriptionResponse>(
    "/subscriptions",
    {
      method: "POST",
      body: JSON.stringify({
        customer: billingCustomer.asaas_customer_id,
        billingType,
        value: valor,
        nextDueDate,
        cycle: "MONTHLY",
        description: "Assinatura mensal ReyCart",
        externalReference: empresa.id,
        callback: {
          successUrl: `${appUrl}/assinatura?pagamento=sucesso`,
          autoRedirect: true,
        },
      }),
    }
  );

  if (!asaasSubscription.id) {
    throw new Error("O sistema de pagamento não retornou o ID da assinatura.");
  }

  return asaasSubscription;
}

async function getFirstPaymentFromSubscription(subscriptionId: string) {
  const response = await asaasRequest<AsaasSubscriptionPaymentsResponse>(
    `/subscriptions/${subscriptionId}/payments`,
    {
      method: "GET",
    }
  );

  const payments = response.data || [];

  if (payments.length === 0) {
    return null;
  }

  const pendingPayment =
    payments.find((payment) => payment.status === "PENDING") || payments[0];

  return pendingPayment;
}

function getPaymentLink(payment: AsaasPayment | null) {
  if (!payment) return null;

  return payment.invoiceUrl || payment.bankSlipUrl || null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = (await request.json().catch(() => ({}))) as BillingBody;

    const { usuario, empresa } = await getEmpresaFromUser(user.id);
    const plano = await getPlanoMensal();

    const { data: assinaturaAtual, error: assinaturaAtualError } =
      await supabaseAdmin
        .from("assinaturas")
        .select("id, status, asaas_subscription_id")
        .eq("empresa_id", empresa.id)
        .eq("atual", true)
        .maybeSingle();

    if (assinaturaAtualError) {
      throw new Error(assinaturaAtualError.message);
    }

    if (
      assinaturaAtual?.asaas_subscription_id &&
      ["pendente", "ativa", "atrasada"].includes(
        assinaturaAtual.status as string
      )
    ) {
      const assinaturaAtualId = assinaturaAtual.asaas_subscription_id as string;

      const payment = await getFirstPaymentFromSubscription(assinaturaAtualId);

      return NextResponse.json({
        ok: true,
        assinaturaId: assinaturaAtual.id,
        status: assinaturaAtual.status,
        paymentUrl: getPaymentLink(payment),
        invoiceUrl: payment?.invoiceUrl || null,
        bankSlipUrl: payment?.bankSlipUrl || null,
        message:
          "Já existe uma assinatura atual para esta empresa. Vamos abrir a cobrança disponível para pagamento.",
      });
    }

    const billingCustomer = await getOrCreateBillingCustomer({
      empresa,
      usuario,
      body,
    });

    const asaasSubscription = await createAsaasSubscription({
      empresa,
      plano,
      billingCustomer,
      body,
    });

    const asaasSubscriptionId = asaasSubscription.id;

    if (!asaasSubscriptionId) {
      throw new Error("O sistema de pagamento não retornou o ID da assinatura.");
    }

    const firstPayment = await getFirstPaymentFromSubscription(
      asaasSubscriptionId
    );

    await supabaseAdmin
      .from("assinaturas")
      .update({
        atual: false,
        updated_at: new Date().toISOString(),
      })
      .eq("empresa_id", empresa.id)
      .eq("atual", true);

    const { data: assinatura, error: assinaturaError } = await supabaseAdmin
      .from("assinaturas")
      .insert({
        empresa_id: empresa.id,
        plano_id: plano.id,
        billing_cliente_id: billingCustomer.id,
        gateway: "asaas",
        asaas_subscription_id: asaasSubscriptionId,
        status: "pendente",
        atual: true,
        valor_centavos: plano.valor_centavos,
        moeda: plano.moeda,
        intervalo: plano.intervalo,
        proximo_vencimento: asaasSubscription.nextDueDate || null,
        inicio_em: new Date().toISOString(),
        raw: {
          subscription: asaasSubscription,
          firstPayment,
        },
      })
      .select("id")
      .single();

    if (assinaturaError) {
      throw new Error(assinaturaError.message);
    }

    return NextResponse.json({
      ok: true,
      assinaturaId: assinatura.id,
      asaasSubscriptionId,
      status: "pendente",
      paymentUrl: getPaymentLink(firstPayment),
      invoiceUrl: firstPayment?.invoiceUrl || null,
      bankSlipUrl: firstPayment?.bankSlipUrl || null,
      message:
        "Assinatura criada. Você será direcionado para concluir o pagamento.",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao criar assinatura.";

    console.error("Erro ao criar assinatura:", error);

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