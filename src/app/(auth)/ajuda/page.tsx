"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ProblemType =
  | "venda_nao_apareceu"
  | "mensagem_errada"
  | "webhook_erro"
  | "cliente_nao_responde"
  | "login_conta"
  | "outro";

type PlatformType =
  | "kiwify"
  | "hotmart"
  | "eduzz"
  | "monetizze"
  | "cartpanda"
  | "woocommerce"
  | "shopify"
  | "outra"
  | "";

type WebhookStatus = "sim" | "nao" | "nao_sei" | "";

type PaymentStatus =
  | "pix_pendente"
  | "checkout_abandonado"
  | "cartao_recusado"
  | "pago"
  | "nao_sei"
  | "";

type Diagnosis = {
  severity: "baixa" | "media" | "alta";
  title: string;
  cause: string;
  actions: string[];
  primaryHref: string;
  primaryAction: string;
};

const problemLabels: Record<ProblemType, string> = {
  venda_nao_apareceu: "Venda não apareceu na recuperação",
  mensagem_errada: "Mensagem do WhatsApp saiu errada",
  webhook_erro: "Webhook chegou com erro",
  cliente_nao_responde: "Cliente não responde",
  login_conta: "Problema de login ou conta",
  outro: "Outro problema",
};

const platformLabels: Record<PlatformType, string> = {
  kiwify: "Kiwify",
  hotmart: "Hotmart",
  eduzz: "Eduzz",
  monetizze: "Monetizze",
  cartpanda: "CartPanda",
  woocommerce: "WooCommerce",
  shopify: "Shopify",
  outra: "Outra plataforma",
  "": "Não informado",
};

const webhookLabels: Record<WebhookStatus, string> = {
  sim: "Sim, chegou",
  nao: "Não chegou",
  nao_sei: "Não sei verificar",
  "": "Não informado",
};

const paymentLabels: Record<PaymentStatus, string> = {
  pix_pendente: "PIX pendente",
  checkout_abandonado: "Checkout abandonado",
  cartao_recusado: "Cartão recusado",
  pago: "Pedido pago",
  nao_sei: "Não sei",
  "": "Não informado",
};

function getSeverityClass(severity: Diagnosis["severity"]) {
  if (severity === "alta") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (severity === "media") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getSeverityLabel(severity: Diagnosis["severity"]) {
  if (severity === "alta") return "Prioridade alta";
  if (severity === "media") return "Prioridade média";
  return "Prioridade baixa";
}

function buildDiagnosis({
  problem,
  platform,
  webhookStatus,
  paymentStatus,
  errorText,
}: {
  problem: ProblemType;
  platform: PlatformType;
  webhookStatus: WebhookStatus;
  paymentStatus: PaymentStatus;
  errorText: string;
}): Diagnosis {
  if (problem === "venda_nao_apareceu") {
    if (webhookStatus === "nao") {
      return {
        severity: "alta",
        title: "O evento provavelmente não chegou ao ReyCart",
        cause:
          "Quando a venda não aparece e nenhum webhook chegou, a causa mais provável é URL incorreta, webhook desativado ou evento não configurado na plataforma de venda.",
        actions: [
          "Copie novamente a URL do webhook na página de Integrações.",
          "Cole a URL no painel da plataforma de venda.",
          "Verifique se os eventos de PIX pendente, checkout abandonado e pagamento recusado estão ativos.",
          "Faça uma venda ou teste de checkout para forçar um novo evento.",
          "Depois volte em Integrações e confira se chegou um novo webhook.",
        ],
        primaryHref: "/integracoes",
        primaryAction: "Ver integração",
      };
    }

    if (webhookStatus === "sim" && paymentStatus === "pago") {
      return {
        severity: "baixa",
        title: "O pedido pago não entra na recuperação",
        cause:
          "Pedidos pagos ou aprovados não aparecem na tela de recuperação porque não precisam ser recuperados.",
        actions: [
          "Confira se o pedido aparece como pago na plataforma de venda.",
          "Veja a página de Integrações para confirmar o webhook recebido.",
          "Use a Recuperação apenas para PIX pendente, checkout abandonado e cartão recusado.",
        ],
        primaryHref: "/integracoes",
        primaryAction: "Ver webhooks",
      };
    }

    if (webhookStatus === "sim") {
      return {
        severity: "media",
        title: "O webhook chegou, mas o pedido pode não ter sido classificado",
        cause:
          "Quando o webhook chega mas a venda não aparece, o evento pode ter vindo com status diferente do esperado ou faltando dados do cliente/produto.",
        actions: [
          "Abra Integrações e clique em Ver payload do último webhook.",
          "Confira se existe telefone, e-mail, produto e status do pedido.",
          "Verifique se o status é PIX pendente, checkout abandonado ou cartão recusado.",
          "Atualize a página de Recuperação.",
          "Se o payload estiver diferente, envie o relatório ao suporte.",
        ],
        primaryHref: "/integracoes",
        primaryAction: "Analisar payload",
      };
    }

    return {
      severity: "media",
      title: "É preciso confirmar se o webhook chegou",
      cause:
        "Ainda não dá para saber se o problema está na plataforma de venda ou na classificação dentro do ReyCart.",
      actions: [
        "Abra a página de Integrações.",
        "Veja se existe webhook recente no horário da venda.",
        "Se não existir, revise a URL cadastrada na plataforma.",
        "Se existir, abra o payload e veja o status do pedido.",
      ],
      primaryHref: "/integracoes",
      primaryAction: "Verificar agora",
    };
  }

  if (problem === "mensagem_errada") {
    return {
      severity: "media",
      title: "A mensagem pode estar com variável ausente ou modelo incorreto",
      cause:
        "Quando a mensagem sai errada, normalmente o modelo foi editado sem alguma variável padrão ou o pedido não possui dados suficientes, como nome, produto, valor ou link do checkout.",
      actions: [
        "Abra a página Automações.",
        "Revise o modelo correspondente ao tipo do pedido.",
        "Mantenha variáveis como {{nome}}, {{produto}}, {{valor}}, {{checkout_url}} e {{pix}}.",
        "Salve o modelo novamente.",
        "Volte em Recuperação e teste o botão Chamar no WhatsApp.",
      ],
      primaryHref: "/automacoes",
      primaryAction: "Editar automações",
    };
  }

  if (problem === "webhook_erro") {
    return {
      severity: "alta",
      title: "O ReyCart recebeu o evento, mas não conseguiu processar",
      cause:
        "Quando um webhook aparece com erro, o evento chegou ao sistema, mas pode ter vindo incompleto, com assinatura inválida ou em formato diferente do esperado.",
      actions: [
        "Abra a página Integrações.",
        "Localize o webhook marcado como Erro.",
        "Abra o payload e veja se há dados de cliente, produto, status e valor.",
        "Confira se a assinatura/segredo do webhook está correta.",
        "Envie o relatório técnico para o suporte analisar o payload.",
      ],
      primaryHref: "/integracoes",
      primaryAction: "Ver webhook com erro",
    };
  }

  if (problem === "cliente_nao_responde") {
    return {
      severity: "baixa",
      title: "Use uma sequência de follow-up antes de marcar como perdido",
      cause:
        "Nem todo cliente responde na primeira tentativa. O ideal é registrar as tentativas e mudar o status da recuperação conforme a evolução.",
      actions: [
        "Abra a venda na tela de Recuperação.",
        "Envie a primeira mensagem pelo WhatsApp.",
        "Se não responder, marque como Sem resposta.",
        "Depois envie uma segunda tentativa usando o modelo de follow-up.",
        "Se ainda não houver retorno, marque como Perdido.",
      ],
      primaryHref: "/recuperacao",
      primaryAction: "Abrir recuperação",
    };
  }

  if (problem === "login_conta") {
    return {
      severity: "media",
      title: "O problema pode estar na sessão, e-mail confirmado ou senha",
      cause:
        "Problemas de acesso normalmente acontecem quando o e-mail ainda não foi confirmado, a senha foi digitada incorretamente ou a sessão expirou.",
      actions: [
        "Confira se o e-mail de confirmação foi clicado.",
        "Tente sair e entrar novamente.",
        "Verifique se o e-mail digitado é o mesmo usado no cadastro.",
        "Se necessário, solicite redefinição de senha em uma próxima etapa do sistema.",
      ],
      primaryHref: "/configuracoes",
      primaryAction: "Ver configurações",
    };
  }

  return {
    severity: errorText.trim() ? "media" : "baixa",
    title: "Relatório pronto para análise",
    cause:
      "O problema não se encaixa nos diagnósticos principais. O melhor caminho é enviar um relatório com os dados preenchidos para o suporte.",
    actions: [
      "Descreva exatamente o que aconteceu.",
      "Informe a plataforma usada.",
      "Informe se houve webhook recente.",
      "Envie o relatório pelo WhatsApp do suporte.",
    ],
    primaryHref: "/configuracoes",
    primaryAction: "Ver configurações",
  };
}

export default function AjudaPage() {
  const [problem, setProblem] = useState<ProblemType>("venda_nao_apareceu");
  const [platform, setPlatform] = useState<PlatformType>("kiwify");
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>("nao_sei");
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>("pix_pendente");
  const [errorText, setErrorText] = useState("");
  const [copied, setCopied] = useState(false);

  const diagnosis = useMemo(() => {
    return buildDiagnosis({
      problem,
      platform,
      webhookStatus,
      paymentStatus,
      errorText,
    });
  }, [problem, platform, webhookStatus, paymentStatus, errorText]);

  const reportText = useMemo(() => {
    return [
      "RELATÓRIO DE SUPORTE — REYCART",
      "",
      `Problema: ${problemLabels[problem]}`,
      `Plataforma: ${platformLabels[platform]}`,
      `Webhook chegou?: ${webhookLabels[webhookStatus]}`,
      `Status do pedido: ${paymentLabels[paymentStatus]}`,
      "",
      "Diagnóstico gerado:",
      diagnosis.title,
      "",
      "Causa provável:",
      diagnosis.cause,
      "",
      "Observações do usuário:",
      errorText.trim() || "Não informado",
      "",
      "Ações recomendadas:",
      ...diagnosis.actions.map((action, index) => `${index + 1}. ${action}`),
    ].join("\n");
  }, [problem, platform, webhookStatus, paymentStatus, errorText, diagnosis]);

  const suporteWhatsapp = "5591993912660";
  const suporteUrl = `https://wa.me/${suporteWhatsapp}?text=${encodeURIComponent(
    `Olá, preciso de suporte no ReyCart.\n\n${reportText}`
  )}`;

  async function copyReport() {
    await navigator.clipboard.writeText(reportText);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <main className="h-[calc(100vh-73px)] overflow-y-auto bg-slate-50 p-6 pb-10 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">ReyCart</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Ajuda inteligente
          </h1>

          <p className="mt-2 max-w-4xl text-slate-600">
            Responda algumas perguntas e o ReyCart gera um diagnóstico com causa
            provável, próximos passos e relatório para suporte.
          </p>
        </div>

        <a
          href={suporteUrl}
          target="_blank"
          rel="noreferrer"
          className="w-fit rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
        >
          Enviar diagnóstico ao suporte
        </a>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Diagnóstico guiado
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Preencha os dados abaixo para o ReyCart indicar o caminho mais
            provável.
          </p>

          <div className="mt-5 space-y-5">
            <div>
              <label className="text-sm font-bold text-slate-700">
                Qual é o problema?
              </label>

              <select
                value={problem}
                onChange={(event) => setProblem(event.target.value as ProblemType)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              >
                <option value="venda_nao_apareceu">
                  Venda não apareceu na recuperação
                </option>
                <option value="mensagem_errada">
                  Mensagem do WhatsApp saiu errada
                </option>
                <option value="webhook_erro">Webhook chegou com erro</option>
                <option value="cliente_nao_responde">
                  Cliente não responde
                </option>
                <option value="login_conta">Problema de login ou conta</option>
                <option value="outro">Outro problema</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">
                Plataforma de venda
              </label>

              <select
                value={platform}
                onChange={(event) =>
                  setPlatform(event.target.value as PlatformType)
                }
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              >
                <option value="kiwify">Kiwify</option>
                <option value="hotmart">Hotmart</option>
                <option value="eduzz">Eduzz</option>
                <option value="monetizze">Monetizze</option>
                <option value="cartpanda">CartPanda</option>
                <option value="woocommerce">WooCommerce</option>
                <option value="shopify">Shopify</option>
                <option value="outra">Outra plataforma</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">
                O webhook aparece na página de Integrações?
              </label>

              <select
                value={webhookStatus}
                onChange={(event) =>
                  setWebhookStatus(event.target.value as WebhookStatus)
                }
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              >
                <option value="nao_sei">Não sei verificar</option>
                <option value="sim">Sim, aparece</option>
                <option value="nao">Não aparece</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">
                Qual era o status esperado do pedido?
              </label>

              <select
                value={paymentStatus}
                onChange={(event) =>
                  setPaymentStatus(event.target.value as PaymentStatus)
                }
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              >
                <option value="pix_pendente">PIX pendente</option>
                <option value="checkout_abandonado">
                  Checkout abandonado
                </option>
                <option value="cartao_recusado">Cartão recusado</option>
                <option value="pago">Pedido pago</option>
                <option value="nao_sei">Não sei</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">
                Descreva o que aconteceu
              </label>

              <textarea
                value={errorText}
                onChange={(event) => setErrorText(event.target.value)}
                placeholder="Ex: A venda foi feita às 14h, mas não apareceu na recuperação..."
                className="mt-2 min-h-[130px] w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div
            className={`rounded-2xl border p-5 shadow-sm ${getSeverityClass(
              diagnosis.severity
            )}`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide">
                  {getSeverityLabel(diagnosis.severity)}
                </p>

                <h2 className="mt-2 text-xl font-black">{diagnosis.title}</h2>

                <p className="mt-2 text-sm leading-6 opacity-90">
                  {diagnosis.cause}
                </p>
              </div>

              <Link
                href={diagnosis.primaryHref}
                className="w-fit rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                {diagnosis.primaryAction}
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">
              Próximos passos recomendados
            </h2>

            <div className="mt-5 space-y-3">
              {diagnosis.actions.map((action, index) => (
                <div
                  key={action}
                  className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {index + 1}
                  </div>

                  <p className="text-sm leading-6 text-slate-600">{action}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Relatório técnico gerado
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Copie ou envie este relatório para o suporte entender o caso
                  mais rápido.
                </p>
              </div>

              <button
                type="button"
                onClick={copyReport}
                className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                {copied ? "Copiado" : "Copiar relatório"}
              </button>
            </div>

            <pre className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs leading-5 text-slate-100">
              {reportText}
            </pre>

            <a
              href={suporteUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Enviar relatório pelo WhatsApp
            </a>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-4">
        <Link
          href="/integracoes"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
        >
          <p className="text-sm font-black text-slate-950">Integrações</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Ver URL do webhook, últimos eventos e payloads.
          </p>
        </Link>

        <Link
          href="/recuperacao"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
        >
          <p className="text-sm font-black text-slate-950">Recuperação</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Acompanhar vendas pendentes e abordagens.
          </p>
        </Link>

        <Link
          href="/automacoes"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
        >
          <p className="text-sm font-black text-slate-950">Automações</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Editar mensagens inteligentes do WhatsApp.
          </p>
        </Link>

        <Link
          href="/perfil"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
        >
          <p className="text-sm font-black text-slate-950">Meu Perfil</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Revisar usuário e dados da empresa.
          </p>
        </Link>
      </div>
    </main>
  );
}