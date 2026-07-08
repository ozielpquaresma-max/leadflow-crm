import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase não configurado.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

type KiwifyPayload = Record<string, any>;

type IntegracaoKiwify = {
  id: string;
  empresa_id: string;
  plataforma: string;
  token_plataforma: string | null;
  status: string | null;
};

function getNestedValue(payload: KiwifyPayload, paths: string[]) {
  for (const path of paths) {
    const value = path.split(".").reduce<any>((acc, key) => {
      if (acc && typeof acc === "object" && key in acc) {
        return acc[key];
      }

      return undefined;
    }, payload);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return null;
}

function cleanToken(value: unknown) {
  if (!value) return null;

  const token = String(value).replace(/^Bearer\s+/i, "").trim();

  return token || null;
}

function getReceivedSecrets(request: NextRequest, payload: KiwifyPayload) {
  const values = [
    request.nextUrl.searchParams.get("signature"),
    request.nextUrl.searchParams.get("token"),
    request.nextUrl.searchParams.get("webhook_token"),
    request.headers.get("x-webhook-secret"),
    request.headers.get("x-kiwify-token"),
    request.headers.get("kiwify-token"),
    request.headers.get("x-token"),
    request.headers.get("token"),
    request.headers.get("authorization"),
    getNestedValue(payload, [
      "token",
      "signature",
      "webhook_token",
      "kiwify_token",
      "data.token",
      "data.signature",
      "webhook.token",
      "webhook.signature",
      "event.token",
      "event.signature",
    ]),
  ];

  const cleaned = values
    .map(cleanToken)
    .filter((token): token is string => Boolean(token));

  return Array.from(new Set(cleaned));
}

function getKiwifyOrder(payload: KiwifyPayload) {
  return (
    getNestedValue(payload, ["order", "data.order", "event.order"]) || payload
  );
}

function normalizePaymentMethod(payload: KiwifyPayload) {
  const order = getKiwifyOrder(payload);

  const rawMethod = String(
    getNestedValue(payload, [
      "order.payment_method",
      "data.order.payment_method",
      "payment_method",
      "payment.type",
      "payment.method",
      "payment_method_type",
      "sale.payment_method",
      "data.payment_method",
      "transaction.payment_method",
    ]) ||
      getNestedValue(order, [
        "payment_method",
        "payment.type",
        "payment.method",
        "payment_method_type",
      ]) ||
      ""
  ).toLowerCase();

  const eventName = String(
    getNestedValue(payload, [
      "order.webhook_event_type",
      "data.order.webhook_event_type",
      "webhook_event_type",
      "event",
      "event_type",
      "type",
      "webhook_event",
      "trigger",
      "data.event",
    ]) || ""
  ).toLowerCase();

  if (rawMethod.includes("pix") || eventName.includes("pix")) return "pix";

  if (rawMethod.includes("card") || rawMethod.includes("cartao")) {
    return "cartao";
  }

  if (rawMethod.includes("boleto") || eventName.includes("boleto")) {
    return "boleto";
  }

  return rawMethod || "desconhecido";
}

function normalizeStatus(payload: KiwifyPayload) {
  const order = getKiwifyOrder(payload);

  const rawStatus = String(
    getNestedValue(payload, [
      "order.order_status",
      "order.status",
      "order.payment_status",
      "data.order.order_status",
      "status",
      "order_status",
      "payment_status",
      "sale.status",
      "data.status",
      "event.status",
      "payment.status",
      "transaction.status",
    ]) ||
      getNestedValue(order, ["order_status", "status", "payment_status"]) ||
      ""
  ).toLowerCase();

  const eventName = String(
    getNestedValue(payload, [
      "order.webhook_event_type",
      "data.order.webhook_event_type",
      "webhook_event_type",
      "event",
      "event_type",
      "type",
      "webhook_event",
      "trigger",
      "data.event",
    ]) || ""
  ).toLowerCase();

  const paymentMethod = normalizePaymentMethod(payload);

  if (
    rawStatus.includes("paid") ||
    rawStatus.includes("approved") ||
    rawStatus.includes("aprovado") ||
    rawStatus.includes("pago") ||
    eventName.includes("compra_aprovada") ||
    eventName.includes("order.paid") ||
    eventName.includes("approved")
  ) {
    return "pago";
  }

  if (
    rawStatus.includes("refused") ||
    rawStatus.includes("recused") ||
    rawStatus.includes("declined") ||
    rawStatus.includes("cartao_recusado") ||
    eventName.includes("compra_recusada") ||
    eventName.includes("refused")
  ) {
    return "cartao_recusado";
  }

  if (
    rawStatus.includes("abandoned") ||
    rawStatus.includes("abandonado") ||
    rawStatus.includes("checkout_abandonado") ||
    eventName.includes("carrinho_abandonado") ||
    eventName.includes("cart_abandoned") ||
    eventName.includes("abandoned")
  ) {
    return "checkout_abandonado";
  }

  if (
    paymentMethod === "pix" &&
    (rawStatus.includes("waiting_payment") ||
      rawStatus.includes("pending") ||
      rawStatus.includes("pendente") ||
      rawStatus.includes("waiting") ||
      rawStatus.includes("aguardando") ||
      eventName.includes("pix_created") ||
      eventName.includes("pix_gerado") ||
      eventName.includes("pix"))
  ) {
    return "pix_pendente";
  }

  if (
    rawStatus.includes("waiting_payment") ||
    rawStatus.includes("pending") ||
    rawStatus.includes("pendente") ||
    rawStatus.includes("waiting") ||
    rawStatus.includes("aguardando")
  ) {
    return "pendente";
  }

  return rawStatus || "pendente";
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const normalized = value
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim();

    const parsed = Number(normalized);

    if (!Number.isNaN(parsed)) return parsed;
  }

  return 0;
}

function toCurrencyFromKiwify(value: unknown) {
  const numberValue = toNumber(value);

  if (numberValue > 999) {
    return numberValue / 100;
  }

  return numberValue;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "produto-kiwify";
}

function normalizeDate(value: unknown) {
  if (!value) return new Date().toISOString();

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(raw)) {
    return `${raw.replace(" ", "T")}:00-03:00`;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) {
    return `${raw.replace(" ", "T")}-03:00`;
  }

  return raw;
}

async function findKiwifyIntegration(receivedSecrets: string[]) {
  if (receivedSecrets.length === 0) {
    return null;
  }

  const { data, error } = await supabase
    .from("integracoes")
    .select("id, empresa_id, plataforma, token_plataforma, status")
    .eq("plataforma", "kiwify")
    .in("token_plataforma", receivedSecrets)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as IntegracaoKiwify | null;
}

async function resolveCompanyFromWebhook(receivedSecrets: string[]) {
  const integration = await findKiwifyIntegration(receivedSecrets);

  if (integration?.empresa_id) {
    return {
      empresaId: integration.empresa_id,
      integracaoId: integration.id,
      authMode: "integracao_token",
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  let webhookLogId: string | null = null;
  let integracaoId: string | null = null;

  try {
    const payload = (await request.json()) as KiwifyPayload;
    const order = getKiwifyOrder(payload);
    const createdAt = new Date().toISOString();

    const receivedSecrets = getReceivedSecrets(request, payload);

    const resolvedCompany = await resolveCompanyFromWebhook(receivedSecrets);

    if (!resolvedCompany?.empresaId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Webhook não autorizado. Token/signature da Kiwify não encontrado nas integrações do ReyCart.",
          receivedSecretFields: receivedSecrets.length,
        },
        { status: 401 }
      );
    }

    integracaoId = resolvedCompany.integracaoId;

    const empresaId = resolvedCompany.empresaId;

    const { data: plataforma, error: plataformaError } = await supabase
      .from("plataformas")
      .select("id")
      .eq("slug", "kiwify")
      .maybeSingle();

    if (plataformaError) {
      throw plataformaError;
    }

    if (!plataforma?.id) {
      return NextResponse.json(
        { ok: false, error: "Plataforma Kiwify não encontrada." },
        { status: 500 }
      );
    }

    const plataformaId = plataforma.id as string;

    const eventName =
      getNestedValue(payload, [
        "order.webhook_event_type",
        "data.order.webhook_event_type",
        "webhook_event_type",
        "event",
        "event_type",
        "type",
        "webhook_event",
        "trigger",
        "data.event",
      ]) || "kiwify_event";

    const { data: webhookLog, error: webhookError } = await supabase
      .from("webhooks")
      .insert({
        empresa_id: empresaId,
        plataforma_id: plataformaId,
        evento: String(eventName),
        payload,
        processado: false,
      })
      .select("id")
      .single();

    if (webhookError) {
      throw webhookError;
    }

    webhookLogId = webhookLog.id as string;

    const customerName =
      getNestedValue(payload, [
        "order.Customer.full_name",
        "order.Customer.first_name",
        "order.customer.full_name",
        "order.customer.name",
        "data.order.Customer.full_name",
        "customer.name",
        "customer.full_name",
        "buyer.name",
        "client.name",
        "data.customer.name",
        "data.buyer.name",
        "name",
      ]) ||
      getNestedValue(order, [
        "Customer.full_name",
        "Customer.first_name",
        "customer.full_name",
        "customer.name",
      ]) ||
      "Cliente Kiwify";

    const customerEmailRaw =
      getNestedValue(payload, [
        "order.Customer.email",
        "order.customer.email",
        "data.order.Customer.email",
        "customer.email",
        "buyer.email",
        "client.email",
        "data.customer.email",
        "data.buyer.email",
        "email",
      ]) ||
      getNestedValue(order, ["Customer.email", "customer.email"]) ||
      null;

    const customerEmail = customerEmailRaw ? String(customerEmailRaw) : null;

    const customerPhoneRaw =
      getNestedValue(payload, [
        "order.Customer.mobile",
        "order.Customer.phone",
        "order.customer.mobile",
        "order.customer.phone",
        "data.order.Customer.mobile",
        "customer.phone",
        "customer.mobile",
        "buyer.phone",
        "client.phone",
        "data.customer.phone",
        "data.buyer.phone",
        "phone",
        "whatsapp",
      ]) ||
      getNestedValue(order, [
        "Customer.mobile",
        "Customer.phone",
        "customer.mobile",
        "customer.phone",
      ]) ||
      null;

    const customerPhone = customerPhoneRaw ? String(customerPhoneRaw) : null;

    const customerCityRaw =
      getNestedValue(payload, [
        "order.Customer.address.city",
        "order.customer.address.city",
        "customer.address.city",
        "buyer.address.city",
        "data.customer.address.city",
        "city",
      ]) || null;

    const customerCity = customerCityRaw ? String(customerCityRaw) : null;

    const customerStateRaw =
      getNestedValue(payload, [
        "order.Customer.address.state",
        "order.customer.address.state",
        "customer.address.state",
        "buyer.address.state",
        "data.customer.address.state",
        "state",
      ]) || null;

    const customerState = customerStateRaw ? String(customerStateRaw) : null;

    const { data: existingCustomer } = customerEmail
      ? await supabase
          .from("clientes")
          .select("id")
          .eq("empresa_id", empresaId)
          .eq("email", customerEmail)
          .maybeSingle()
      : { data: null };

    let clienteId = existingCustomer?.id as string | undefined;

    if (!clienteId) {
      const { data: createdCustomer, error: customerError } = await supabase
        .from("clientes")
        .insert({
          empresa_id: empresaId,
          nome: String(customerName),
          email: customerEmail,
          telefone: customerPhone,
          cidade: customerCity,
          estado: customerState,
          origem: "Kiwify",
        })
        .select("id")
        .single();

      if (customerError) {
        throw customerError;
      }

      clienteId = createdCustomer.id as string;
    }

    const productName =
      getNestedValue(payload, [
        "order.Product.product_name",
        "order.Product.product_offer_name",
        "order.product.product_name",
        "order.product.name",
        "data.order.Product.product_name",
        "product.name",
        "product.title",
        "data.product.name",
        "sale.product.name",
        "order.product.name",
        "product_name",
        "productName",
      ]) ||
      getNestedValue(order, [
        "Product.product_name",
        "Product.product_offer_name",
        "product.product_name",
        "product.name",
      ]) ||
      "Produto Kiwify";

    const productSlug = slugify(String(productName));

    const productValue = toCurrencyFromKiwify(
      getNestedValue(payload, [
        "order.Commissions.charge_amount",
        "order.Commissions.product_base_price",
        "order.commissions.charge_amount",
        "data.order.Commissions.charge_amount",
        "product.price",
        "product.value",
        "amount",
        "price",
        "total",
        "sale.amount",
        "order.amount",
        "data.amount",
        "data.total",
        "transaction.amount",
      ]) ||
        getNestedValue(order, [
          "Commissions.charge_amount",
          "Commissions.product_base_price",
          "commissions.charge_amount",
          "amount",
          "total",
        ])
    );

    const checkoutRef =
      getNestedValue(payload, [
        "order.checkout_link",
        "data.order.checkout_link",
        "checkout_link",
      ]) || getNestedValue(order, ["checkout_link"]);

    const checkoutUrl =
      getNestedValue(payload, [
        "order.checkout_url",
        "order.checkout.url",
        "data.order.checkout_url",
        "checkout_url",
        "checkout.url",
        "sale.checkout_url",
        "data.checkout_url",
        "payment.checkout_url",
        "checkoutUrl",
      ]) || (checkoutRef ? `https://pay.kiwify.com.br/${checkoutRef}` : null);

    const { data: existingProduct } = await supabase
      .from("produtos")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("slug", productSlug)
      .maybeSingle();

    let produtoId = existingProduct?.id as string | undefined;

    if (!produtoId) {
      const { data: createdProduct, error: productError } = await supabase
        .from("produtos")
        .insert({
          empresa_id: empresaId,
          plataforma_id: plataformaId,
          nome: String(productName),
          slug: productSlug,
          valor: productValue,
          checkout_url: checkoutUrl,
          ativo: true,
        })
        .select("id")
        .single();

      if (productError) {
        throw productError;
      }

      produtoId = createdProduct.id as string;
    }

    const externalOrderId = String(
      getNestedValue(payload, [
        "order.order_id",
        "order.order_ref",
        "data.order.order_id",
        "order_id",
        "id",
        "sale_id",
        "transaction_id",
        "order.id",
        "sale.id",
        "data.id",
        "data.order_id",
        "transaction.id",
        "order.code",
      ]) ||
        getNestedValue(order, ["order_id", "order_ref", "id"]) ||
        `kiwify-${Date.now()}`
    );

    const status = normalizeStatus(payload);
    const paymentMethod = normalizePaymentMethod(payload);

    const pixCode =
      getNestedValue(payload, [
        "order.pix_code",
        "data.order.pix_code",
        "pix_code",
        "pix.code",
        "pix.qr_code",
        "pix.copia_cola",
        "payment.pix.code",
        "payment.pix.qr_code",
        "data.pix.code",
        "data.pix.qr_code",
      ]) ||
      getNestedValue(order, ["pix_code", "pix.code", "pix.qr_code"]) ||
      null;

    const pixQrCodeUrl =
      getNestedValue(payload, [
        "order.pix_qrcode_url",
        "order.pix.qrcode_url",
        "pix.qrcode_url",
        "pix.qr_code_url",
        "payment.pix.qrcode_url",
        "data.pix.qrcode_url",
        "pix_qrcode_url",
      ]) ||
      getNestedValue(order, [
        "pix_qrcode_url",
        "pix.qrcode_url",
        "pix.qr_code_url",
      ]) ||
      null;

    const paidAt =
      status === "pago"
        ? normalizeDate(
            getNestedValue(payload, [
              "order.approved_date",
              "order.paid_at",
              "data.order.approved_date",
              "paid_at",
              "payment.paid_at",
              "sale.paid_at",
              "data.paid_at",
              "transaction.paid_at",
            ]) || getNestedValue(order, ["approved_date", "paid_at"])
          )
        : null;

    const { data: existingOrder } = await supabase
      .from("pedidos")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("pedido_externo_id", externalOrderId)
      .maybeSingle();

    if (existingOrder?.id) {
      const { error: updateOrderError } = await supabase
        .from("pedidos")
        .update({
          cliente_id: clienteId,
          produto_id: produtoId,
          plataforma_id: plataformaId,
          status,
          metodo_pagamento: paymentMethod,
          valor: productValue,
          checkout_url: checkoutUrl,
          pix_copia_cola: pixCode,
          pix_qrcode_url: pixQrCodeUrl,
          criado_na_plataforma: createdAt,
          pago_em: paidAt,
        })
        .eq("id", existingOrder.id);

      if (updateOrderError) {
        throw updateOrderError;
      }
    } else {
      const { error: orderError } = await supabase.from("pedidos").insert({
        empresa_id: empresaId,
        cliente_id: clienteId,
        produto_id: produtoId,
        plataforma_id: plataformaId,
        pedido_externo_id: externalOrderId,
        status,
        metodo_pagamento: paymentMethod,
        valor: productValue,
        checkout_url: checkoutUrl,
        pix_copia_cola: pixCode,
        pix_qrcode_url: pixQrCodeUrl,
        criado_na_plataforma: createdAt,
        pago_em: paidAt,
      });

      if (orderError) {
        throw orderError;
      }
    }

    await supabase
      .from("webhooks")
      .update({ processado: true })
      .eq("id", webhookLogId);

    if (integracaoId) {
      await supabase
        .from("integracoes")
        .update({
          status: "ativo",
          ultimo_evento_em: createdAt,
          ultimo_evento_status: "processado",
          updated_at: createdAt,
        })
        .eq("id", integracaoId);
    }

    return NextResponse.json({
      ok: true,
      message: "Webhook Kiwify recebido e processado.",
      eventName,
      status,
      paymentMethod,
      externalOrderId,
      authMode: resolvedCompany.authMode,
    });
  } catch (error) {
    console.error("Erro no webhook Kiwify:", error);

    if (webhookLogId) {
      await supabase
        .from("webhooks")
        .update({ processado: false })
        .eq("id", webhookLogId);
    }

    if (integracaoId) {
      await supabase
        .from("integracoes")
        .update({
          status: "erro",
          ultimo_evento_status: "erro",
          updated_at: new Date().toISOString(),
        })
        .eq("id", integracaoId);
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro desconhecido.",
      },
      { status: 500 }
    );
  }
}