import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const kiwifyWebhookSecret = process.env.KIWIFY_WEBHOOK_SECRET;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase não configurado.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

type KiwifyPayload = Record<string, any>;

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

function normalizeStatus(payload: KiwifyPayload) {
  const rawStatus = String(
    getNestedValue(payload, [
      "status",
      "order_status",
      "payment_status",
      "sale.status",
      "order.status",
      "data.status",
      "event.status",
    ]) || ""
  ).toLowerCase();

  const paymentMethod = normalizePaymentMethod(payload);

  if (
    rawStatus.includes("paid") ||
    rawStatus.includes("approved") ||
    rawStatus.includes("aprovado") ||
    rawStatus.includes("pago")
  ) {
    return "pago";
  }

  if (
    rawStatus.includes("refused") ||
    rawStatus.includes("recused") ||
    rawStatus.includes("declined") ||
    rawStatus.includes("cartao_recusado")
  ) {
    return "cartao_recusado";
  }

  if (
    rawStatus.includes("abandoned") ||
    rawStatus.includes("abandonado") ||
    rawStatus.includes("checkout_abandonado")
  ) {
    return "checkout_abandonado";
  }

  if (
    paymentMethod === "pix" &&
    (rawStatus.includes("pending") ||
      rawStatus.includes("pendente") ||
      rawStatus.includes("waiting") ||
      rawStatus.includes("aguardando"))
  ) {
    return "pix_pendente";
  }

  if (
    rawStatus.includes("pending") ||
    rawStatus.includes("pendente") ||
    rawStatus.includes("waiting") ||
    rawStatus.includes("aguardando")
  ) {
    return "pendente";
  }

  return rawStatus || "pendente";
}

function normalizePaymentMethod(payload: KiwifyPayload) {
  const rawMethod = String(
    getNestedValue(payload, [
      "payment_method",
      "payment.type",
      "payment.method",
      "payment_method_type",
      "sale.payment_method",
      "order.payment_method",
      "data.payment_method",
    ]) || ""
  ).toLowerCase();

  if (rawMethod.includes("pix")) return "pix";
  if (rawMethod.includes("card") || rawMethod.includes("cartao")) return "cartao";
  if (rawMethod.includes("boleto")) return "boleto";

  return rawMethod || "desconhecido";
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const normalized = value.replace("R$", "").replace(".", "").replace(",", ".").trim();
    const parsed = Number(normalized);

    if (!Number.isNaN(parsed)) return parsed;
  }

  return 0;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: NextRequest) {
  try {
    if (!kiwifyWebhookSecret) {
      return NextResponse.json(
        { ok: false, error: "Webhook secret não configurado." },
        { status: 500 }
      );
    }

    const receivedSecret = request.headers.get("x-webhook-secret");

    if (receivedSecret !== kiwifyWebhookSecret) {
      return NextResponse.json(
        { ok: false, error: "Webhook não autorizado." },
        { status: 401 }
      );
    }

    const payload = (await request.json()) as KiwifyPayload;

    const { data: empresa } = await supabase
      .from("empresas")
      .select("id")
      .eq("slug", "leadflow-crm")
      .single();

    const { data: plataforma } = await supabase
      .from("plataformas")
      .select("id")
      .eq("slug", "kiwify")
      .single();

    if (!empresa?.id || !plataforma?.id) {
      return NextResponse.json(
        { ok: false, error: "Empresa ou plataforma Kiwify não encontrada." },
        { status: 500 }
      );
    }

    const eventName =
      getNestedValue(payload, ["event", "event_type", "type", "webhook_event"]) ||
      "kiwify_event";

    await supabase.from("webhooks").insert({
      empresa_id: empresa.id,
      plataforma_id: plataforma.id,
      evento: String(eventName),
      payload,
      processado: false,
    });

    const customerName =
      getNestedValue(payload, [
        "customer.name",
        "customer.full_name",
        "buyer.name",
        "client.name",
        "data.customer.name",
        "data.buyer.name",
        "name",
      ]) || "Cliente Kiwify";

    const customerEmail =
      getNestedValue(payload, [
        "customer.email",
        "buyer.email",
        "client.email",
        "data.customer.email",
        "data.buyer.email",
        "email",
      ]) || null;

    const customerPhone =
      getNestedValue(payload, [
        "customer.phone",
        "customer.mobile",
        "buyer.phone",
        "client.phone",
        "data.customer.phone",
        "data.buyer.phone",
        "phone",
        "whatsapp",
      ]) || null;

    const customerCity =
      getNestedValue(payload, [
        "customer.address.city",
        "buyer.address.city",
        "data.customer.address.city",
        "city",
      ]) || null;

    const customerState =
      getNestedValue(payload, [
        "customer.address.state",
        "buyer.address.state",
        "data.customer.address.state",
        "state",
      ]) || null;

    const { data: existingCustomer } = customerEmail
      ? await supabase
          .from("clientes")
          .select("id")
          .eq("empresa_id", empresa.id)
          .eq("email", customerEmail)
          .maybeSingle()
      : { data: null };

    let clienteId = existingCustomer?.id;

    if (!clienteId) {
      const { data: createdCustomer, error: customerError } = await supabase
        .from("clientes")
        .insert({
          empresa_id: empresa.id,
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

      clienteId = createdCustomer.id;
    }

    const productName =
      getNestedValue(payload, [
        "product.name",
        "product.title",
        "data.product.name",
        "sale.product.name",
        "order.product.name",
      ]) || "Produto Kiwify";

    const productSlug = slugify(String(productName));

    const productValue = toNumber(
      getNestedValue(payload, [
        "product.price",
        "product.value",
        "amount",
        "price",
        "total",
        "sale.amount",
        "order.amount",
        "data.amount",
        "data.total",
      ])
    );

    const checkoutUrl =
      getNestedValue(payload, [
        "checkout_url",
        "checkout.url",
        "order.checkout_url",
        "sale.checkout_url",
        "data.checkout_url",
        "payment.checkout_url",
      ]) || null;

    const { data: existingProduct } = await supabase
      .from("produtos")
      .select("id")
      .eq("empresa_id", empresa.id)
      .eq("slug", productSlug)
      .maybeSingle();

    let produtoId = existingProduct?.id;

    if (!produtoId) {
      const { data: createdProduct, error: productError } = await supabase
        .from("produtos")
        .insert({
          empresa_id: empresa.id,
          plataforma_id: plataforma.id,
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

      produtoId = createdProduct.id;
    }

    const externalOrderId = String(
      getNestedValue(payload, [
        "order_id",
        "id",
        "sale_id",
        "transaction_id",
        "order.id",
        "sale.id",
        "data.id",
        "data.order_id",
      ]) || `kiwify-${Date.now()}`
    );

    const status = normalizeStatus(payload);
    const paymentMethod = normalizePaymentMethod(payload);

    const pixCode =
      getNestedValue(payload, [
        "pix.code",
        "pix.qr_code",
        "pix.copia_cola",
        "payment.pix.code",
        "payment.pix.qr_code",
        "data.pix.code",
        "data.pix.qr_code",
      ]) || null;

    const pixQrCodeUrl =
      getNestedValue(payload, [
        "pix.qrcode_url",
        "pix.qr_code_url",
        "payment.pix.qrcode_url",
        "data.pix.qrcode_url",
      ]) || null;

    const createdAt =
      getNestedValue(payload, [
        "created_at",
        "order.created_at",
        "sale.created_at",
        "data.created_at",
      ]) || new Date().toISOString();

    const paidAt =
      status === "pago"
        ? getNestedValue(payload, [
            "paid_at",
            "payment.paid_at",
            "order.paid_at",
            "sale.paid_at",
            "data.paid_at",
          ]) || new Date().toISOString()
        : null;

    const { data: existingOrder } = await supabase
      .from("pedidos")
      .select("id")
      .eq("empresa_id", empresa.id)
      .eq("pedido_externo_id", externalOrderId)
      .maybeSingle();

    if (existingOrder?.id) {
      await supabase
        .from("pedidos")
        .update({
          cliente_id: clienteId,
          produto_id: produtoId,
          plataforma_id: plataforma.id,
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
    } else {
      const { error: orderError } = await supabase.from("pedidos").insert({
        empresa_id: empresa.id,
        cliente_id: clienteId,
        produto_id: produtoId,
        plataforma_id: plataforma.id,
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
      .eq("empresa_id", empresa.id)
      .eq("plataforma_id", plataforma.id)
      .eq("evento", String(eventName))
      .order("created_at", { ascending: false })
      .limit(1);

    return NextResponse.json({
      ok: true,
      message: "Webhook Kiwify recebido e processado.",
      status,
      paymentMethod,
      externalOrderId,
    });
  } catch (error) {
    console.error("Erro no webhook Kiwify:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro desconhecido.",
      },
      { status: 500 }
    );
  }
}