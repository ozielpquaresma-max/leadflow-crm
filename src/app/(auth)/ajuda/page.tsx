"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type HelpItem = {
  id: string;
  title: string;
  description: string;
  checklist: string[];
  href: string;
  action: string;
};

const helpItems: HelpItem[] = [
  {
    id: "venda-nao-apareceu",
    title: "A venda não apareceu no ReyCart",
    description:
      "Use este diagnóstico quando uma venda, PIX pendente ou carrinho abandonado não aparecer na tela de recuperação.",
    checklist: [
      "Confira se a URL do webhook está cadastrada corretamente na plataforma de venda.",
      "Verifique se a integração está ativa na página Integrações.",
      "Veja se o último webhook recebido aparece como Processado.",
      "Atualize a página de Recuperação e confira novamente.",
    ],
    href: "/integracoes",
    action: "Ver integrações",
  },
  {
    id: "mensagem-whatsapp",
    title: "A mensagem do WhatsApp saiu errada",
    description:
      "Use este diagnóstico quando o texto enviado ao cliente não estiver correto ou faltar alguma informação.",
    checklist: [
      "Abra a página Automações.",
      "Revise o modelo de mensagem do tipo de pedido.",
      "Mantenha as variáveis padrão, como {{nome}}, {{produto}} e {{checkout_url}}.",
      "Salve o modelo e teste novamente pelo botão Chamar no WhatsApp.",
    ],
    href: "/automacoes",
    action: "Editar mensagens",
  },
  {
    id: "recuperacao",
    title: "Quero acompanhar minhas oportunidades",
    description:
      "Use esta área para entender onde estão os pedidos que ainda podem ser recuperados.",
    checklist: [
      "Acesse a tela Recuperação.",
      "Use os filtros de PIX, checkout abandonado e cartão recusado.",
      "Clique em Chamar no WhatsApp para abordar o cliente.",
      "Marque o resultado como Convertido, Aguardando, Sem resposta ou Perdido.",
    ],
    href: "/recuperacao",
    action: "Abrir recuperação",
  },
  {
    id: "conta-empresa",
    title: "Quero revisar minha conta ou empresa",
    description:
      "Use esta opção para conferir dados do usuário, empresa e configurações básicas da conta.",
    checklist: [
      "Abra Meu Perfil para revisar seu nome e dados da empresa.",
      "Abra Configurações para ver integração, webhook e mensagens.",
      "Confira se a conta aparece como ativa.",
      "Salve as alterações feitas no perfil.",
    ],
    href: "/perfil",
    action: "Abrir perfil",
  },
];

export default function AjudaPage() {
  const [selectedId, setSelectedId] = useState(helpItems[0].id);

  const selectedHelp = useMemo(() => {
    return helpItems.find((item) => item.id === selectedId) || helpItems[0];
  }, [selectedId]);

  const suporteWhatsapp = "5591993912660";

  const suporteMessage = encodeURIComponent(
    `Olá, preciso de ajuda no ReyCart.\n\nAssunto: ${selectedHelp.title}\n\nPode me orientar?`
  );

  const suporteUrl = `https://wa.me/${suporteWhatsapp}?text=${suporteMessage}`;

  return (
    <main className="h-[calc(100vh-73px)] overflow-y-auto bg-slate-50 p-6 pb-10 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">ReyCart</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Ajuda
          </h1>

          <p className="mt-2 max-w-4xl text-slate-600">
            Encontre orientações rápidas para resolver dúvidas sobre integração,
            recuperação de vendas, mensagens automáticas e dados da conta.
          </p>
        </div>

        <a
          href={suporteUrl}
          target="_blank"
          rel="noreferrer"
          className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          Chamar suporte
        </a>
      </div>

      <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-blue-950">
              Central de suporte ReyCart
            </h2>

            <p className="mt-1 text-sm text-blue-700">
              Primeiro escolha o problema. O ReyCart mostra um diagnóstico
              rápido e o caminho certo para resolver.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/integracoes"
              className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              Integrações
            </Link>

            <Link
              href="/automacoes"
              className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              Automações
            </Link>

            <Link
              href="/recuperacao"
              className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              Recuperação
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            O que você precisa resolver?
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Selecione uma opção para abrir o diagnóstico.
          </p>

          <div className="mt-5 space-y-3">
            {helpItems.map((item) => {
              const active = selectedId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                  }`}
                >
                  <p
                    className={`text-sm font-bold ${
                      active ? "text-blue-700" : "text-slate-950"
                    }`}
                  >
                    {item.title}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                {selectedHelp.title}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                {selectedHelp.description}
              </p>
            </div>

            <Link
              href={selectedHelp.href}
              className="w-fit rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              {selectedHelp.action}
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <h3 className="text-sm font-bold text-slate-950">
              Diagnóstico rápido
            </h3>

            <div className="mt-4 space-y-3">
              {selectedHelp.checklist.map((item, index) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {index + 1}
                  </div>

                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <h3 className="text-sm font-bold text-emerald-800">
              Ainda precisa de ajuda?
            </h3>

            <p className="mt-1 text-sm leading-6 text-emerald-700">
              Clique no botão abaixo para abrir uma conversa no WhatsApp com uma
              mensagem pronta sobre este problema.
            </p>

            <a
              href={suporteUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Falar com suporte
            </a>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Integração por webhook
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use a página de Integrações para copiar a URL do webhook e conferir
            se os eventos estão chegando corretamente.
          </p>

          <Link
            href="/integracoes"
            className="mt-5 inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Abrir integrações
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Mensagens inteligentes
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Edite os modelos usados no WhatsApp para PIX pendente, carrinho
            abandonado, cartão recusado e follow-up.
          </p>

          <Link
            href="/automacoes"
            className="mt-5 inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Abrir automações
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Recuperação de vendas
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Acompanhe oportunidades, chame clientes no WhatsApp e registre o
            resultado de cada tentativa de recuperação.
          </p>

          <Link
            href="/recuperacao"
            className="mt-5 inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Abrir recuperação
          </Link>
        </section>
      </div>
    </main>
  );
}