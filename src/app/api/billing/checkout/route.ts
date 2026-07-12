import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckoutBody = {
  cpfCnpj?: string;
  documento?: string;
  billingType?: string;
};

type AsaasCustomer = {
  id: string;
};

type AsaasSubscription = {
  id: string;
  status?: string;
};

type AsaasPayment = {
  id?: string;
  status?: string;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  paymentUrl?: string | null;
  dueDate?: string | null;
};

type AsaasPaymentsResponse = {
  data?: AsaasPayment[];
};

const PLANO_CODIGO = "reycart_mensal_49";

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} não configurada`);
  }

  return value;
}

function createAdminClient() {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

function validateCpfCnpj(value: string) {
  const numbers = onlyNumbers(value);
  return numbers.length === 11 || numbers.length === 14;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getAsaasBaseUrl() {
  return process.env.ASAAS_BASE_URL || "https://api.asaas.com/v3";
}

async function asaasRequest<T>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PUT";
    body?: Record<string, unknown>;
  }
) {
  const asaasApiKey = getEnv("ASAAS_API_KEY");
  const baseUrl = getAsaasBaseUrl();

  const response = await fetch(`${baseUrl}${path}`, {
    method: options?.method || "GET",
    headers: {
      "Content-Type": "application/json",
      access_token: asaasApiKey,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const rawText = await response.text();

  let data: unknown = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = rawText;
  }

  if (!response.ok) {
    let message = `Erro Asaas HTTP ${response.status}`;

    if (
      data &&
      typeof data === "object" &&
      "errors" in data &&
      Array.isArray((data as { errors?: unknown[] }).errors)
    ) {
      const errors = (data as { errors: Array<{ description?: string }> })
        .errors;

      message =
        errors
          .map((error) => error.description)
          .filter(Boolean)
          .join(" ") || message;
    }

    throw new Error(message);
  }

  return data as T;
}

async function getFirstPaymentFromSubscription(subscriptionId: string) {
  const paymentsResponse = await asaasRequest<AsaasPaymentsResponse>(
    `/subscriptions/${subscriptionId}/payments`
  );

  return paymentsResponse.data?.[0] || null;
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error: "Sessão não informada.",
        },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as CheckoutBody;

    const cpfCnpj = onlyNumbers(body.cpfCnpj || body.documento || "");

    if (!validateCpfCnpj(cpfCnpj)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Para criar esta cobrança é necessário preencher um CPF ou CNPJ válido.",
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Sessão inválida.",
        },
        { status: 401 }
      );
    }

    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from("usuarios")
      .select("id, nome, email, empresa_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (usuarioError) {
      throw usuarioError;
    }

    if (!usuario?.empresa_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Usuário sem empresa vinculada.",
        },
        { status: 404 }
      );
    }

    const { data: empresa, error: empresaError } = await supabaseAdmin
      .from("empresas")
      .select("id, nome, email, status")
      .eq("id", usuario.empresa_id)
      .maybeSingle();

    if (empresaError) {
      throw empresaError;
    }

    if (!empresa) {
      return NextResponse.json(
        {
          ok: false,
          error: "Empresa não encontrada.",
        },
        { status: 404 }
      );
    }

    const { data: plano, error: planoError } = await supabaseAdmin
      .from("planos")
      .select("id, codigo, nome, valor_centavos, moeda, intervalo, ativo")
      .eq("codigo", PLANO_CODIGO)
      .eq("ativo", true)
      .maybeSingle();

    if (planoError) {
      throw planoError;
    }

    if (!plano) {
      return NextResponse.json(
        {
          ok: false,
          error: "Plano mensal do ReyCart não encontrado.",
        },
        { status: 404 }
      );
    }

    const { data: assinaturaAtual, error: assinaturaAtualError } =
      await supabaseAdmin
        .from("assinaturas")
        .select(
          "id, empresa_id, plano_id, status, asaas_subscription_id, proximo_vencimento, created_at"
        )
        .eq("empresa_id", empresa.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (assinaturaAtualError) {
      throw assinaturaAtualError;
    }

    if (
      empresa.status === "ativo" &&
      assinaturaAtual?.status === "ativa"
    ) {
      return NextResponse.json({
        ok: true,
        active: true,
        empresaStatus: "ativo",
        assinaturaStatus: "ativa",
        message: "Sua assinatura já está ativa.",
      });
    }

    const { data: billingCliente, error: billingClienteError } =
      await supabaseAdmin
        .from("billing_clientes")
        .select("id, empresa_id, asaas_customer_id")
        .eq("empresa_id", empresa.id)
        .maybeSingle();

    if (billingClienteError) {
      throw billingClienteError;
    }

    const customerName =
      empresa.nome ||
      usuario.nome ||
      user.email ||
      "Cliente ReyCart";

    const customerEmail =
      empresa.email ||
      usuario.email ||
      user.email ||
      "cliente@reycart.com.br";

    let asaasCustomerId = billingCliente?.asaas_customer_id as
      | string
      | null
      | undefined;

    if (asaasCustomerId) {
      await asaasRequest<AsaasCustomer>(`/customers/${asaasCustomerId}`, {
        method: "PUT",
        body: {
          name: customerName,
          email: customerEmail,
          cpfCnpj,
          externalReference: empresa.id,
        },
      });
    } else {
      const asaasCustomer = await asaasRequest<AsaasCustomer>("/customers", {
        method: "POST",
        body: {
          name: customerName,
          email: customerEmail,
          cpfCnpj,
          externalReference: empresa.id,
        },
      });

      asaasCustomerId = asaasCustomer.id;

      const { error: upsertClienteError } = await supabaseAdmin
        .from("billing_clientes")
        .upsert(
          {
            empresa_id: empresa.id,
            asaas_customer_id: asaasCustomerId,
            nome: customerName,
            email: customerEmail,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "empresa_id",
          }
        );

      if (upsertClienteError) {
        throw upsertClienteError;
      }
    }

    if (!asaasCustomerId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Não foi possível criar o cliente no Asaas.",
        },
        { status: 500 }
      );
    }

    if (assinaturaAtual?.asaas_subscription_id) {
      const firstPayment = await getFirstPaymentFromSubscription(
        assinaturaAtual.asaas_subscription_id
      );

      const paymentLink =
        firstPayment?.paymentUrl ||
        firstPayment?.invoiceUrl ||
        firstPayment?.bankSlipUrl ||
        null;

      if (paymentLink) {
        return NextResponse.json({
          ok: true,
          empresaStatus: empresa.status,
          assinaturaStatus: assinaturaAtual.status,
          paymentStatus: firstPayment?.status || null,
          paymentUrl: paymentLink,
          invoiceUrl: firstPayment?.invoiceUrl || null,
          bankSlipUrl: firstPayment?.bankSlipUrl || null,
          message: "Cobrança já existente localizada.",
        });
      }
    }

    const appUrl = getEnv("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
    const valor = Number((Number(plano.valor_centavos) / 100).toFixed(2));
    const vencimento = todayDate();

    const asaasSubscription = await asaasRequest<AsaasSubscription>(
      "/subscriptions",
      {
        method: "POST",
        body: {
          customer: asaasCustomerId,
          billingType: body.billingType || "UNDEFINED",
          value: valor,
          nextDueDate: vencimento,
          cycle: "MONTHLY",
          description: "Assinatura mensal ReyCart",
          externalReference: empresa.id,
          callback: {
            successUrl: `${appUrl}/assinatura?pagamento=sucesso`,
            autoRedirect: true,
          },
        },
      }
    );

    const asaasSubscriptionId = asaasSubscription.id;

    if (!asaasSubscriptionId) {
      throw new Error("O Asaas não retornou o ID da assinatura.");
    }

    let assinaturaId = assinaturaAtual?.id as string | undefined;

    if (assinaturaId) {
      const { error: updateAssinaturaError } = await supabaseAdmin
        .from("assinaturas")
        .update({
          plano_id: plano.id,
          status: "pendente",
          asaas_subscription_id: asaasSubscriptionId,
          valor_centavos: plano.valor_centavos,
          moeda: plano.moeda,
          intervalo: plano.intervalo,
          proximo_vencimento: vencimento,
          updated_at: new Date().toISOString(),
        })
        .eq("id", assinaturaId);

      if (updateAssinaturaError) {
        throw updateAssinaturaError;
      }
    } else {
      const { data: novaAssinatura, error: insertAssinaturaError } =
        await supabaseAdmin
          .from("assinaturas")
          .insert({
            empresa_id: empresa.id,
            plano_id: plano.id,
            status: "pendente",
            asaas_subscription_id: asaasSubscriptionId,
            valor_centavos: plano.valor_centavos,
            moeda: plano.moeda,
            intervalo: plano.intervalo,
            proximo_vencimento: vencimento,
          })
          .select("id")
          .single();

      if (insertAssinaturaError) {
        throw insertAssinaturaError;
      }

      assinaturaId = novaAssinatura.id;
    }

    const firstPayment = await getFirstPaymentFromSubscription(
      asaasSubscriptionId
    );

    const paymentLink =
      firstPayment?.paymentUrl ||
      firstPayment?.invoiceUrl ||
      firstPayment?.bankSlipUrl ||
      null;

    return NextResponse.json({
      ok: true,
      active: false,
      empresaStatus: empresa.status,
      assinaturaStatus: "pendente",
      assinaturaId,
      asaasSubscriptionId,
      paymentStatus: firstPayment?.status || null,
      paymentUrl: paymentLink,
      invoiceUrl: firstPayment?.invoiceUrl || null,
      bankSlipUrl: firstPayment?.bankSlipUrl || null,
      message: "Cobrança criada com sucesso.",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao criar cobrança.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
