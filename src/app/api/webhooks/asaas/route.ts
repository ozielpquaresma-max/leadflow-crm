import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AsaasWebhookPayload = {
  id?: string;
  event?: string;
  dateCreated?: string;
  payment?: AsaasPayment;
  subscription?: AsaasSubscription;
  customer?: unknown;
  [key: string]: unknown;
};

type AsaasPayment = {
  object?: string;
  id?: string;
  customer?: string;
  subscription?: string;
  value?: number;
  netValue?: number;
  originalValue?: number;
  status?: string;
  billingType?: string;
  dueDate?: string;
  originalDueDate?: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  confirmedDate?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
  externalReference?: string;
  [key: string]: unknown;
};

type AsaasSubscription = {
  object?: string;
  id?: string;
  customer?: string;
  status?: string;
  value?: number;
  cycle?: string;
  billingType?: string;
  nextDueDate?: string;
  dateCreated?: string;
  description?: string;
  externalReference?: string;
  deleted?: boolean;
  [key: string]: unknown;
};

type Assinatura = {
  id: string;
  empresa_id: string;
  asaas_subscription_id: string | null;
  status: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const asaasWebhookToken = process.env.ASAAS_WEBHOOK_TOKEN;

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

function centsFromValue(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return Math.round(value * 100);
}

function asaasDateToIso(value?: string | null) {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00.000Z`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function normalizePaymentStatus(evento: string, paymentStatus?: string | null) {
  const status = paymentStatus?.toUpperCase();

  if (
    evento === "PAYMENT_RECEIVED" ||
    evento === "PAYMENT_CONFIRMED" ||
    status === "RECEIVED" ||
    status === "CONFIRMED"
  ) {
    return "pago";
  }

  if (evento === "PAYMENT_OVERDUE" || status === "OVERDUE") {
    return "atrasado";
  }

  if (
    evento === "PAYMENT_DELETED" ||
    evento === "PAYMENT_REFUNDED" ||
    evento === "PAYMENT_REFUND_IN_PROGRESS" ||
    status === "REFUNDED"
  ) {
    return "cancelado";
  }

  return "pendente";
}

function normalizeSubscriptionStatus(evento: string, subscription?: AsaasSubscription) {
  const status = subscription?.status?.toUpperCase();

  if (
    evento === "SUBSCRIPTION_INACTIVATED" ||
    evento === "SUBSCRIPTION_DELETED" ||
    subscription?.deleted === true
  ) {
    return "cancelada";
  }

  if (status === "ACTIVE") {
    return "ativa";
  }

  if (status === "INACTIVE") {
    return "inativa";
  }

  if (status === "EXPIRED") {
    return "expirada";
  }

  return "pendente";
}

function getResourceInfo(payload: AsaasWebhookPayload) {
  if (payload.payment?.id) {
    return {
      tipo: "payment",
      id: payload.payment.id,
    };
  }

  if (payload.subscription?.id) {
    return {
      tipo: "subscription",
      id: payload.subscription.id,
    };
  }

  return {
    tipo: null,
    id: null,
  };
}

function validateWebhookToken(request: NextRequest) {
  if (!asaasWebhookToken) {
    throw new Error("ASAAS_WEBHOOK_TOKEN não configurado.");
  }

  const receivedToken = request.headers.get("asaas-access-token");

  if (!receivedToken || receivedToken !== asaasWebhookToken) {
    throw new Error("Webhook Asaas não autorizado.");
  }
}

async function saveWebhookLog(payload: AsaasWebhookPayload) {
  const resource = getResourceInfo(payload);

  const { data: existing } = await supabaseAdmin
    .from("webhooks_asaas")
    .select("id, processado")
    .eq("asaas_event_id", payload.id || "")
    .maybeSingle();

  if (existing?.processado) {
    return {
      id: existing.id as string,
      alreadyProcessed: true,
    };
  }

  const { data, error } = await supabaseAdmin
    .from("webhooks_asaas")
    .upsert(
      {
        evento: payload.event || null,
        asaas_event_id: payload.id || null,
        recurso_tipo: resource.tipo,
        recurso_id: resource.id,
        processado: false,
        erro: null,
        payload,
      },
      {
        onConflict: "asaas_event_id",
      }
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id as string,
    alreadyProcessed: false,
  };
}

async function markWebhookProcessed(id: string) {
  const { error } = await supabaseAdmin
    .from("webhooks_asaas")
    .update({
      processado: true,
      erro: null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

async function markWebhookError(id: string, message: string) {
  await supabaseAdmin
    .from("webhooks_asaas")
    .update({
      processado: false,
      erro: message,
    })
    .eq("id", id);
}

async function findSubscriptionByAsaasId(asaasSubscriptionId?: string | null) {
  if (!asaasSubscriptionId) return null;

  const { data, error } = await supabaseAdmin
    .from("assinaturas")
    .select("id, empresa_id, asaas_subscription_id, status")
    .eq("asaas_subscription_id", asaasSubscriptionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Assinatura | null;
}

async function activateCompany(empresaId: string) {
  const { error } = await supabaseAdmin
    .from("empresas")
    .update({
      status: "ativo",
      updated_at: new Date().toISOString(),
    })
    .eq("id", empresaId);

  if (error) {
    throw new Error(error.message);
  }
}

async function deactivateCompany(empresaId: string) {
  const { error } = await supabaseAdmin
    .from("empresas")
    .update({
      status: "inativo",
      updated_at: new Date().toISOString(),
    })
    .eq("id", empresaId);

  if (error) {
    throw new Error(error.message);
  }
}

async function processPaymentEvent(payload: AsaasWebhookPayload) {
  const evento = payload.event || "PAYMENT_EVENT";
  const payment = payload.payment;

  if (!payment?.id) {
    return;
  }

  const assinatura = await findSubscriptionByAsaasId(payment.subscription);

  if (!assinatura) {
    throw new Error(
      `Assinatura não encontrada para o pagamento ${payment.id}.`
    );
  }

  const pagamentoStatus = normalizePaymentStatus(evento, payment.status);
  const valorCentavos = centsFromValue(payment.value);

  const paidAt =
    asaasDateToIso(payment.paymentDate) ||
    asaasDateToIso(payment.clientPaymentDate) ||
    asaasDateToIso(payment.confirmedDate);

  const { error: pagamentoError } = await supabaseAdmin.from("pagamentos").upsert(
    {
      empresa_id: assinatura.empresa_id,
      assinatura_id: assinatura.id,
      gateway: "asaas",
      asaas_payment_id: payment.id,
      asaas_subscription_id: payment.subscription || null,
      status: pagamentoStatus,
      valor_centavos: valorCentavos > 0 ? valorCentavos : 4900,
      moeda: "BRL",
      vencimento: payment.dueDate || payment.originalDueDate || null,
      pago_em: pagamentoStatus === "pago" ? paidAt || new Date().toISOString() : null,
      invoice_url: payment.invoiceUrl || null,
      payment_url: payment.invoiceUrl || payment.bankSlipUrl || null,
      raw: payment,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "asaas_payment_id",
    }
  );

  if (pagamentoError) {
    throw new Error(pagamentoError.message);
  }

  if (pagamentoStatus === "pago") {
    const { error: assinaturaError } = await supabaseAdmin
      .from("assinaturas")
      .update({
        status: "ativa",
        proximo_vencimento: payment.dueDate || null,
        raw: payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assinatura.id);

    if (assinaturaError) {
      throw new Error(assinaturaError.message);
    }

    await activateCompany(assinatura.empresa_id);
    return;
  }

  if (pagamentoStatus === "atrasado") {
    const { error: assinaturaError } = await supabaseAdmin
      .from("assinaturas")
      .update({
        status: "atrasada",
        raw: payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assinatura.id);

    if (assinaturaError) {
      throw new Error(assinaturaError.message);
    }

    await deactivateCompany(assinatura.empresa_id);
  }
}

async function processSubscriptionEvent(payload: AsaasWebhookPayload) {
  const evento = payload.event || "SUBSCRIPTION_EVENT";
  const subscription = payload.subscription;

  if (!subscription?.id) {
    return;
  }

  const assinatura = await findSubscriptionByAsaasId(subscription.id);

  if (!assinatura) {
    return;
  }

  const assinaturaStatus = normalizeSubscriptionStatus(evento, subscription);

  const updatePayload: Record<string, unknown> = {
    status: assinaturaStatus,
    proximo_vencimento: subscription.nextDueDate || null,
    raw: payload,
    updated_at: new Date().toISOString(),
  };

  if (["cancelada", "inativa", "expirada"].includes(assinaturaStatus)) {
    updatePayload.atual = false;
    updatePayload.cancelada_em = new Date().toISOString();
  }

  const { error } = await supabaseAdmin
    .from("assinaturas")
    .update(updatePayload)
    .eq("id", assinatura.id);

  if (error) {
    throw new Error(error.message);
  }

  if (assinaturaStatus === "ativa") {
    await activateCompany(assinatura.empresa_id);
  }

  if (["cancelada", "inativa", "expirada"].includes(assinaturaStatus)) {
    await deactivateCompany(assinatura.empresa_id);
  }
}

async function processAsaasEvent(payload: AsaasWebhookPayload) {
  const evento = payload.event || "";

  if (evento.startsWith("PAYMENT_")) {
    await processPaymentEvent(payload);
    return;
  }

  if (evento.startsWith("SUBSCRIPTION_")) {
    await processSubscriptionEvent(payload);
  }
}

export async function POST(request: NextRequest) {
  let webhookLogId: string | null = null;

  try {
    validateWebhookToken(request);

    const payload = (await request.json()) as AsaasWebhookPayload;

    const webhookLog = await saveWebhookLog(payload);
    webhookLogId = webhookLog.id;

    if (webhookLog.alreadyProcessed) {
      return NextResponse.json({
        ok: true,
        duplicated: true,
      });
    }

    await processAsaasEvent(payload);
    await markWebhookProcessed(webhookLog.id);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao processar webhook Asaas.";

    console.error("Erro no webhook Asaas:", error);

    if (webhookLogId) {
      await markWebhookError(webhookLogId, message);
    }

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