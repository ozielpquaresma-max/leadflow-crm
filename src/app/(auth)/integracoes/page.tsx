import Link from "next/link";

const webhookUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

export default function IntegracoesPage() {
  const kiwifyWebhookUrl = `${webhookUrl}/api/webhooks/kiwify`;

  return (
    <main className="h-[calc(100vh-73px)] overflow-y-auto bg-slate-50 p-6 pb-10 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Configuração</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Integrações
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            Conecte plataformas externas ao LeadFlow para receber pedidos,
            pagamentos pendentes e eventos de recuperação automaticamente.
          </p>
        </div>

        <Link
          href="/recuperacao"
          className="flex w-fit items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          Ver recuperação
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                Plataforma de vendas
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-950">
                Kiwify
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Receba automaticamente pedidos criados, PIX pendentes,
                checkouts abandonados e informações do cliente dentro do
                LeadFlow.
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
              Webhook criado
            </span>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                URL do webhook
              </p>

              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <code className="break-all text-sm font-semibold text-slate-800">
                  {kiwifyWebhookUrl}
                </code>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Essa é a URL que deve ser cadastrada na Kiwify para enviar os
                eventos de venda para o LeadFlow.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Cabeçalho de segurança
              </p>

              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <code className="break-all text-sm font-semibold text-slate-800">
                  x-webhook-secret
                </code>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                A Kiwify precisa enviar esse cabeçalho com a mesma chave que
                está configurada no arquivo <strong>.env.local</strong> como{" "}
                <strong>KIWIFY_WEBHOOK_SECRET</strong>.
              </p>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">
              Status da integração
            </h2>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div>
                  <p className="text-sm font-bold text-emerald-800">
                    Rota ativa
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    O endpoint da Kiwify já existe no sistema.
                  </p>
                </div>

                <span className="h-3 w-3 rounded-full bg-emerald-500" />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div>
                  <p className="text-sm font-bold text-emerald-800">
                    Proteção ativa
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    O webhook exige chave secreta para aceitar requisições.
                  </p>
                </div>

                <span className="h-3 w-3 rounded-full bg-emerald-500" />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    Produção pendente
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    Falta publicar o sistema para usar uma URL pública.
                  </p>
                </div>

                <span className="h-3 w-3 rounded-full bg-amber-500" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">
              Próximo passo
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Quando o LeadFlow for publicado na Vercel, a URL do webhook
              deixará de ser localhost e passará a ser o domínio real do
              sistema.
            </p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Exemplo futuro
              </p>

              <code className="mt-2 block break-all text-sm font-semibold text-slate-800">
                https://seudominio.com/api/webhooks/kiwify
              </code>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}