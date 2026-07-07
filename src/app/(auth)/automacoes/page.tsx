"use client";

import { useState } from "react";

type MessageTemplate = {
  id: string;
  title: string;
  description: string;
  status: string;
  badgeClass: string;
  message: string;
};

const defaultTemplates: MessageTemplate[] = [
  {
    id: "pix_pendente",
    title: "PIX pendente",
    description: "Mensagem para clientes que geraram PIX e ainda não pagaram.",
    status: "PIX",
    badgeClass: "bg-amber-50 text-amber-700 ring-amber-100",
    message:
      "Olá, {{nome}}. Tudo bem?\n\nVi que seu pedido do {{produto}} ficou com o PIX pendente.\nO valor é {{valor}}.\n\nSe quiser finalizar agora, o link está aqui:\n{{checkout_url}}\n\nQualquer dúvida, me chama que eu te ajudo.",
  },
  {
    id: "checkout_abandonado",
    title: "Checkout abandonado",
    description: "Mensagem para quem iniciou o pedido, mas não finalizou.",
    status: "Checkout",
    badgeClass: "bg-blue-50 text-blue-700 ring-blue-100",
    message:
      "Olá, {{nome}}. Tudo bem?\n\nVi que você iniciou o pedido do {{produto}}, mas não chegou a finalizar.\n\nAconteceu algum problema no checkout?\nVocê pode continuar por aqui:\n{{checkout_url}}\n\nSe precisar, eu te ajudo agora.",
  },
  {
    id: "cartao_recusado",
    title: "Cartão recusado",
    description: "Mensagem para falha no pagamento com cartão.",
    status: "Cartão",
    badgeClass: "bg-red-50 text-red-700 ring-red-100",
    message:
      "Olá, {{nome}}. Tudo bem?\n\nSeu pedido do {{produto}} não foi concluído porque o pagamento no cartão não foi aprovado.\n\nVocê pode tentar novamente ou finalizar por outro método de pagamento.\nLink para tentar novamente:\n{{checkout_url}}\n\nSe quiser, te ajudo a concluir agora.",
  },
  {
    id: "aguardando_resposta",
    title: "Aguardando resposta",
    description: "Follow-up leve para cliente já contatado.",
    status: "Follow-up",
    badgeClass: "bg-sky-50 text-sky-700 ring-sky-100",
    message:
      "Olá, {{nome}}. Tudo bem?\n\nPassando só para acompanhar seu pedido do {{produto}}.\n\nFicou alguma dúvida ou posso te ajudar a finalizar?\nLink para continuar:\n{{checkout_url}}",
  },
  {
    id: "sem_resposta",
    title: "Sem resposta",
    description: "Mensagem para segunda tentativa de contato.",
    status: "Retorno",
    badgeClass: "bg-slate-50 text-slate-700 ring-slate-100",
    message:
      "Olá, {{nome}}. Tudo bem?\n\nTentei falar com você sobre o pedido do {{produto}}.\n\nAinda posso te ajudar a finalizar ou prefere que eu encerre por aqui?\nLink do pedido:\n{{checkout_url}}",
  },
  {
    id: "ultima_tentativa",
    title: "Última tentativa",
    description: "Mensagem final antes de marcar como perdido.",
    status: "Final",
    badgeClass: "bg-purple-50 text-purple-700 ring-purple-100",
    message:
      "Olá, {{nome}}. Tudo bem?\n\nEstou passando para fazer uma última tentativa sobre o pedido do {{produto}}.\n\nSe ainda tiver interesse, você pode finalizar por aqui:\n{{checkout_url}}\n\nSe não for o momento, sem problema. Posso encerrar esse atendimento por enquanto.",
  },
];

const variables = [
  "{{nome}}",
  "{{produto}}",
  "{{valor}}",
  "{{checkout_url}}",
  "{{pix}}",
];

export default function AutomacoesPage() {
  const [templates, setTemplates] = useState(defaultTemplates);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function updateMessage(id: string, message: string) {
    setTemplates((currentTemplates) =>
      currentTemplates.map((template) =>
        template.id === id ? { ...template, message } : template
      )
    );
  }

  async function copyMessage(template: MessageTemplate) {
    await navigator.clipboard.writeText(template.message);

    setCopiedId(template.id);

    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  }

  return (
    <main className="h-[calc(100vh-73px)] overflow-y-auto bg-slate-50 p-6 pb-10 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">ReyCart</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Automações
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            Configure os modelos de mensagens usados na recuperação de PIX
            pendentes, carrinhos abandonados e pagamentos recusados.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Primeira versão: edição local dos modelos. Depois vamos salvar no
          Supabase.
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">
          Variáveis disponíveis
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Use essas variáveis dentro das mensagens. O ReyCart troca
          automaticamente pelos dados reais da venda.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {variables.map((variable) => (
            <span
              key={variable}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              {variable}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {templates.map((template) => (
          <section
            key={template.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-950">
                    {template.title}
                  </h2>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${template.badgeClass}`}
                  >
                    {template.status}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {template.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyMessage(template)}
                className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                {copiedId === template.id ? "Copiado" : "Copiar"}
              </button>
            </div>

            <textarea
              value={template.message}
              onChange={(event) =>
                updateMessage(template.id, event.target.value)
              }
              className="min-h-[220px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />

            <p className="mt-3 text-xs text-slate-400">
              Esse texto será usado como base para mensagens inteligentes no
              WhatsApp.
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
