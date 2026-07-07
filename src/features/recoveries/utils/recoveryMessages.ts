export type RecoveryMessageInput = {
  clienteNome?: string | null;
  produtoNome?: string | null;
  status?: string | null;
  valor?: number | null;
  checkoutUrl?: string | null;
  pixCopiaCola?: string | null;
  statusRecuperacao?: string | null;
};

function getPrimeiroNome(nome?: string | null) {
  if (!nome) return "tudo bem";

  const primeiroNome = nome.trim().split(" ")[0];

  return primeiroNome || "tudo bem";
}

function formatCurrency(value?: number | null) {
  if (!value) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function gerarMensagemRecuperacao({
  clienteNome,
  produtoNome,
  status,
  valor,
  checkoutUrl,
  pixCopiaCola,
  statusRecuperacao,
}: RecoveryMessageInput) {
  const nome = getPrimeiroNome(clienteNome);
  const produto = produtoNome || "seu pedido";
  const valorFormatado = formatCurrency(valor);

  if (statusRecuperacao === "aguardando_resposta") {
    return [
      `Olá, ${nome}. Tudo bem?`,
      "",
      `Passando só para acompanhar seu pedido do ${produto}.`,
      valorFormatado ? `O valor ficou em ${valorFormatado}.` : null,
      "",
      "Ficou alguma dúvida ou posso te ajudar a finalizar?",
      checkoutUrl ? `Link para continuar: ${checkoutUrl}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (statusRecuperacao === "sem_resposta") {
    return [
      `Olá, ${nome}. Tudo bem?`,
      "",
      `Tentei falar com você sobre o pedido do ${produto}.`,
      "",
      "Ainda posso te ajudar a finalizar ou prefere que eu encerre por aqui?",
      checkoutUrl ? `Link do pedido: ${checkoutUrl}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (status === "pix_pendente") {
    return [
      `Olá, ${nome}. Tudo bem?`,
      "",
      `Vi que seu pedido do ${produto} ficou com o PIX pendente.`,
      valorFormatado ? `O valor é ${valorFormatado}.` : null,
      "",
      "Se quiser finalizar agora, o link está aqui:",
      checkoutUrl || null,
      "",
      pixCopiaCola ? "Também posso te enviar o PIX copia e cola por aqui." : null,
      "Qualquer dúvida, me chama que eu te ajudo.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (status === "checkout_abandonado") {
    return [
      `Olá, ${nome}. Tudo bem?`,
      "",
      `Vi que você iniciou o pedido do ${produto}, mas não chegou a finalizar.`,
      valorFormatado ? `O valor ficou em ${valorFormatado}.` : null,
      "",
      "Aconteceu algum problema no checkout?",
      checkoutUrl ? `Você pode continuar por aqui: ${checkoutUrl}` : null,
      "",
      "Se precisar, eu te ajudo agora.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (status === "cartao_recusado") {
    return [
      `Olá, ${nome}. Tudo bem?`,
      "",
      `Seu pedido do ${produto} não foi concluído porque o pagamento no cartão não foi aprovado.`,
      valorFormatado ? `O valor era ${valorFormatado}.` : null,
      "",
      "Você pode tentar novamente ou finalizar por outro método de pagamento.",
      checkoutUrl ? `Link para tentar novamente: ${checkoutUrl}` : null,
      "",
      "Se quiser, te ajudo a concluir agora.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `Olá, ${nome}. Tudo bem?`,
    "",
    `Estou entrando em contato sobre seu pedido do ${produto}.`,
    valorFormatado ? `O valor é ${valorFormatado}.` : null,
    checkoutUrl ? `Você pode acessar por aqui: ${checkoutUrl}` : null,
    "",
    "Posso te ajudar a finalizar?",
  ]
    .filter(Boolean)
    .join("\n");
}

export function montarLinkWhatsappComMensagem({
  telefone,
  mensagem,
}: {
  telefone?: string | null;
  mensagem: string;
}) {
  const telefoneLimpo = String(telefone || "").replace(/\D/g, "");

  if (!telefoneLimpo) {
    return null;
  }

  const telefoneComPais = telefoneLimpo.startsWith("55")
    ? telefoneLimpo
    : `55${telefoneLimpo}`;

  return `https://wa.me/${telefoneComPais}?text=${encodeURIComponent(
    mensagem
  )}`;
}
