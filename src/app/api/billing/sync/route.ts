import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AsaasPayment = {
  id?: string;
  status?: string;
  value?: number;
  dueDate?: string | null;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
  confirmedDate?: string | null;
  subscription?: string | null;
  externalReference?: string | null;
};

type AsaasPaymentsResponse = {
  data?: AsaasPayment[];
};

const PAID_STATUSES = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

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

async function fetchAsaasSubscriptionPayments(subscriptionId: string) {
  const asaasApiKey = getEnv("ASAAS_API_KEY");
  const asaasBaseUrl = process.env.ASAAS_BASE_URL || "https://api.asaas.com/v3";

  const response = await fetch(
    `${asaasBaseUrl}/subscriptions/${subscriptionId}/payments`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        access_token: asaasApiKey,
      },
      cache: "no-store",
    }
  );

  const data = (await response.json().catch(() => null)) as
    | AsaasPaymentsResponse
    | { errors?: unknown }
    | null;

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      data,
    };
  }

  return {
    ok: true as const,
    status: response.status,
    data: data as AsaasPaymentsResponse,
  };
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
      .select("id, empresa_id")
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
      .select("id, status")
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

    const { data: assinatura, error: assinaturaError } = await supabaseAdmin
      .from("assinaturas")
      .select("id, empresa_id, status, asaas_subscription_id, proximo_vencimento, created_at")
      .eq("empresa_id", empresa.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assinaturaError) {
      throw assinaturaError;
    }

    if (!assinatura) {
      return NextResponse.json({
        ok: true,
        active: empresa.status === "ativo",
        empresaStatus: empresa.status,
        assinaturaStatus: null,
        message: "Nenhuma assinatura encontrada para esta empresa.",
      });
    }

    if (empresa.status === "ativo" && assinatura.status === "ativa") {
      return NextResponse.json({
        ok: true,
        active: true,
        empresaStatus: empresa.status,
        assinaturaStatus: assinatura.status,
        message: "Assinatura já está ativa.",
      });
    }

    if (!assinatura.asaas_subscription_id) {
      return NextResponse.json({
        ok: true,
        active: false,
        empresaStatus: empresa.status,
        assinaturaStatus: assinatura.status,
        message: "Assinatura ainda não possui ID do Asaas.",
      });
    }

    const paymentsResponse = await fetchAsaasSubscriptionPayments(
      assinatura.asaas_subscription_id
    );

    if (!paymentsResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          active: false,
          empresaStatus: empresa.status,
          assinaturaStatus: assinatura.status,
          error: "Não foi possível consultar os pagamentos no Asaas.",
          asaasStatusCode: paymentsResponse.status,
          asaasResponse: paymentsResponse.data,
        },
        { status: 502 }
      );
    }

    const payments = paymentsResponse.data.data || [];

    const paidPayment = payments.find((payment) =>
      PAID_STATUSES.has(String(payment.status || "").toUpperCase())
    );

    if (!paidPayment) {
      const latestPayment = payments[0];

      return NextResponse.json({
        ok: true,
        active: false,
        empresaStatus: empresa.status,
        assinaturaStatus: assinatura.status,
        paymentStatus: latestPayment?.status || null,
        message:
          "Pagamento ainda não confirmado pelo Asaas. Acesso permanece bloqueado.",
      });
    }

    const paidAt =
      paidPayment.paymentDate ||
      paidPayment.clientPaymentDate ||
      paidPayment.confirmedDate ||
      new Date().toISOString().slice(0, 10);

    const nextDueDate =
      paidPayment.dueDate || assinatura.proximo_vencimento || null;

    const { error: updateEmpresaError } = await supabaseAdmin
      .from("empresas")
      .update({
        status: "ativo",
        updated_at: new Date().toISOString(),
      })
      .eq("id", empresa.id);

    if (updateEmpresaError) {
      throw updateEmpresaError;
    }

    const { error: updateAssinaturaError } = await supabaseAdmin
      .from("assinaturas")
      .update({
        status: "ativa",
        proximo_vencimento: nextDueDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assinatura.id);

    if (updateAssinaturaError) {
      throw updateAssinaturaError;
    }

    return NextResponse.json({
      ok: true,
      active: true,
      empresaStatus: "ativo",
      assinaturaStatus: "ativa",
      paymentStatus: paidPayment.status,
      paymentId: paidPayment.id || null,
      paidAt,
      message: "Pagamento confirmado no Asaas. Acesso liberado.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro inesperado ao sincronizar assinatura.";

    return NextResponse.json(
      {
        ok: false,
        active: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
