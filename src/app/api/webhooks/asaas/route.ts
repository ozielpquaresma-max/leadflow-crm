import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AsaasPayment = {
  id?: string;
  customer?: string | null;
  subscription?: string | null;
  value?: number | null;
  status?: string | null;
  dueDate?: string | null;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
  confirmedDate?: string | null;
  externalReference?: string | null;
};

type AsaasSubscription = {
  id?: string;
  customer?: string | null;
  status?: string | null;
  value?: number | null;
  nextDueDate?: string | null;
  externalReference?: string | null;
};

type AsaasWebhookPayload = {
  id?: string;
  event?: string;
  payment?: AsaasPayment;
  subscription?: AsaasSubscription;
};

const PAYMENT_PAID_STATUSES = new Set([
  "RECEIVED",
  "CONFIRMED",
  "RECEIVED_IN_CASH",
]);

const PAYMENT_PENDING_STATUSES = new Set([
  "PENDING",
  "AWAITING_RISK_ANALYSIS",
]);

const PAYMENT_OVERDUE_STATUSES = new Set(["OVERDUE"]);

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

function centsFromValue(value?: number | null) {
  return Math.round(Number(value || 0) * 100);
}

function normalizeStatus(status?: string | null) {
  return String(status || "").toUpperCase();
}

function paymentStatusForDatabase(eventName: string, paymentStatus: string) {
  if (
    eventName === "PAYMENT_RECEIVED" ||
    eventName === "PAYMENT_CONFIRMED" ||
    PAYMENT_PAID_STATUSES.has(paymentStatus)
  ) {
    return "pago";
  }

  if (eventName === "PAYMENT_OVERDUE" || PAYMENT_OVERDUE_STATUSES.has(paymentStatus)) {
    return "atrasado";
  }

  if (eventName === "PAYMENT_REFUNDED" || paymentStatus === "REFUNDED") {
    return "estornado";
  }

  if (eventName === "PAYMENT_DELETED" || paymentStatus === "DELETED") {
    return "cancelado";
  }

  return "pendente";
}

async function findAssinaturaByPayment(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  payment: AsaasPayment
) {
  if (payment.subscription) {
    const { data, error } = await supabaseAdmin
      .from("assinaturas")
      .select("id, empresa_id, status, asaas_subscription_id")
      .eq("asaas_subscription_id", payment.subscription)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data;
    }
  }

  if (payment.externalReference) {
    const { data, error } = await supabaseAdmin
      .from("assinaturas")
      .select("id, empresa_id, status, asaas_subscription_id")
      .eq("empresa_id", payment.externalReference)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data;
    }
  }

  if (payment.customer) {
    const { data: billingCliente, error: billingClienteError } =
      await supabaseAdmin
        .from("billing_clientes")
        .select("empresa_id")
        .eq("asaas_customer_id", payment.customer)
        .maybeSingle();

    if (billingClienteError) {
      throw billingClienteError;
    }

    if (billingCliente?.empresa_id) {
      const { data, error } = await supabaseAdmin
        .from("assinaturas")
        .select("id, empresa_id, status, asaas_subscription_id")
        .eq("empresa_id", billingCliente.empresa_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        return data;
      }
    }
  }

  return null;
}

async function findAssinaturaBySubscription(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  subscription: AsaasSubscription
) {
  if (subscription.id) {
    const { data, error } = await supabaseAdmin
      .from("assinaturas")
      .select("id, empresa_id, status, asaas_subscription_id")
      .eq("asaas_subscription_id", subscription.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data;
    }
  }

  if (subscription.externalReference) {
    const { data, error } = await supabaseAdmin
      .from("assinaturas")
      .select("id, empresa_id, status, asaas_subscription_id")
      .eq("empresa_id", subscription.externalReference)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data;
    }
  }

  if (subscription.customer) {
    const { data: billingCliente, error: billingClienteError } =
      await supabaseAdmin
        .from("billing_clientes")
        .select("empresa_id")
        .eq("asaas_customer_id", subscription.customer)
        .maybeSingle();

    if (billingClienteError) {
      throw billingClienteError;
    }

    if (billingCliente?.empresa_id) {
      const { data, error } = await supabaseAdmin
        .from("assinaturas")
        .select("id, empresa_id, status, asaas_subscription_id")
        .eq("empresa_id", billingCliente.empresa_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        return data;
      }
    }
  }

  return null;
}

async function markWebhookProcessed(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  eventId: string,
  processado: boolean,
  erro: string | null
) {
  await supabaseAdmin
    .from("webhooks_asaas")
    .update({
      processado,
      erro,
    })
    .eq("asaas_event_id", eventId);
}

async function processPaymentEvent(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  eventName: string,
  payment: AsaasPayment
) {
  const paymentStatus = normalizeStatus(payment.status);
  const dbPaymentStatus = paymentStatusForDatabase(eventName, paymentStatus);
  const assinatura = await findAssinaturaByPayment(supabaseAdmin, payment);

  if (!assinatura) {
    throw new Error(
      `Assinatura não encontrada para o pagamento ${payment.id || "sem id"}.`
    );
  }

  const paidAt =
    payment.paymentDate ||
    payment.clientPaymentDate ||
    payment.confirmedDate ||
    null;

  if (payment.id) {
    const { error: pagamentoError } = await supabaseAdmin
      .from("pagamentos")
      .upsert(
        {
          empresa_id: assinatura.empresa_id,
          asaas_payment_id: payment.id,
          asaas_subscription_id:
            payment.subscription || assinatura.asaas_subscription_id || null,
          status: dbPaymentStatus,
          valor_centavos: centsFromValue(payment.value),
          vencimento: payment.dueDate || null,
          pago_em: dbPaymentStatus === "pago" ? paidAt || new Date().toISOString() : null,
        },
        {
          onConflict: "asaas_payment_id",
        }
      );

    if (pagamentoError) {
      throw pagamentoError;
    }
  }

  if (
    eventName === "PAYMENT_RECEIVED" ||
    eventName === "PAYMENT_CONFIRMED" ||
    PAYMENT_PAID_STATUSES.has(paymentStatus)
  ) {
    const { error: assinaturaError } = await supabaseAdmin
      .from("assinaturas")
      .update({
        status: "ativa",
        proximo_vencimento: payment.dueDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assinatura.id);

    if (assinaturaError) {
      throw assinaturaError;
    }

    const { error: empresaError } = await supabaseAdmin
      .from("empresas")
      .update({
        status: "ativo",
        updated_at: new Date().toISOString(),
      })
      .eq("id", assinatura.empresa_id);

    if (empresaError) {
      throw empresaError;
    }

    return;
  }

  if (eventName === "PAYMENT_OVERDUE" || PAYMENT_OVERDUE_STATUSES.has(paymentStatus)) {
    const { error: assinaturaError } = await supabaseAdmin
      .from("assinaturas")
      .update({
        status: "atrasada",
        updated_at: new Date().toISOString(),
      })
      .eq("id", assinatura.id);

    if (assinaturaError) {
      throw assinaturaError;
    }

    const { error: empresaError } = await supabaseAdmin
      .from("empresas")
      .update({
        status: "inativo",
        updated_at: new Date().toISOString(),
      })
      .eq("id", assinatura.empresa_id);

    if (empresaError) {
      throw empresaError;
    }

    return;
  }

  const { error: assinaturaError } = await supabaseAdmin
    .from("assinaturas")
    .update({
      status: "pendente",
      updated_at: new Date().toISOString(),
    })
    .eq("id", assinatura.id)
    .neq("status", "ativa");

  if (assinaturaError) {
    throw assinaturaError;
  }
}

async function processSubscriptionEvent(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  eventName: string,
  subscription: AsaasSubscription
) {
  const assinatura = await findAssinaturaBySubscription(
    supabaseAdmin,
    subscription
  );

  if (!assinatura) {
    return;
  }

  if (
    eventName === "SUBSCRIPTION_DELETED" ||
    eventName === "SUBSCRIPTION_INACTIVATED"
  ) {
    const { error: assinaturaError } = await supabaseAdmin
      .from("assinaturas")
      .update({
        status: "inativa",
        updated_at: new Date().toISOString(),
      })
      .eq("id", assinatura.id);

    if (assinaturaError) {
      throw assinaturaError;
    }

    const { error: empresaError } = await supabaseAdmin
      .from("empresas")
      .update({
        status: "inativo",
        updated_at: new Date().toISOString(),
      })
      .eq("id", assinatura.empresa_id);

    if (empresaError) {
      throw empresaError;
    }

    return;
  }

  /*
    IMPORTANTE:
    Eventos de assinatura criada/atualizada no Asaas NÃO liberam acesso.
    O Asaas pode criar uma assinatura ativa mesmo com a primeira cobrança pendente.
    A empresa só pode ser ativada por PAYMENT_CONFIRMED ou PAYMENT_RECEIVED.
  */
  const { error: assinaturaError } = await supabaseAdmin
    .from("assinaturas")
    .update({
      asaas_subscription_id:
        subscription.id || assinatura.asaas_subscription_id || null,
      proximo_vencimento: subscription.nextDueDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assinatura.id);

  if (assinaturaError) {
    throw assinaturaError;
  }
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminClient();

  try {
    const expectedToken = getEnv("ASAAS_WEBHOOK_TOKEN");
    const receivedToken = request.headers.get("asaas-access-token");

    if (!receivedToken || receivedToken !== expectedToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "Webhook Asaas não autorizado.",
        },
        { status: 401 }
      );
    }

    const payload = (await request.json()) as AsaasWebhookPayload;
    const eventName = payload.event || "UNKNOWN_EVENT";

    const resourceType = payload.payment
      ? "payment"
      : payload.subscription
        ? "subscription"
        : "unknown";

    const resourceId =
      payload.payment?.id || payload.subscription?.id || payload.id || null;

    const eventId =
      payload.id ||
      `${eventName}:${resourceType}:${resourceId || "sem-recurso"}`;

    const { error: webhookError } = await supabaseAdmin
      .from("webhooks_asaas")
      .upsert(
        {
          asaas_event_id: eventId,
          evento: eventName,
          recurso_tipo: resourceType,
          recurso_id: resourceId,
          payload,
          processado: false,
          erro: null,
        },
        {
          onConflict: "asaas_event_id",
        }
      );

    if (webhookError) {
      throw webhookError;
    }

    try {
      if (eventName.startsWith("PAYMENT_") && payload.payment) {
        await processPaymentEvent(supabaseAdmin, eventName, payload.payment);
      } else if (
        eventName.startsWith("SUBSCRIPTION_") &&
        payload.subscription
      ) {
        await processSubscriptionEvent(
          supabaseAdmin,
          eventName,
          payload.subscription
        );
      }

      await markWebhookProcessed(supabaseAdmin, eventId, true, null);

      return NextResponse.json({
        ok: true,
      });
    } catch (processError) {
      const message =
        processError instanceof Error
          ? processError.message
          : "Erro inesperado ao processar webhook.";

      await markWebhookProcessed(supabaseAdmin, eventId, false, message);

      /*
        Retornamos 200 para evitar nova penalização da fila do Asaas.
        O erro fica registrado na tabela webhooks_asaas para auditoria.
      */
      return NextResponse.json({
        ok: false,
        error: message,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado no webhook Asaas.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
