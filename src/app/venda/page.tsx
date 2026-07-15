import Link from "next/link";
import SalesTabletDemo from "./SalesTabletDemo";

const beneficios = [
  "Visualize Pix gerados e ainda não pagos",
  "Acompanhe cartões recusados e pedidos pendentes",
  "Organize clientes que quase compraram",
  "Identifique oportunidades que estavam se perdendo",
  "Tenha mais controle sobre suas campanhas de venda",
  "Use um painel simples, direto e acessível",
];

const etapas = [
  {
    titulo: "Crie sua conta",
    texto: "Faça seu cadastro no ReyCart e confirme seu e-mail.",
  },
  {
    titulo: "Ative a assinatura",
    texto: "O acesso é liberado após a confirmação do pagamento mensal.",
  },
  {
    titulo: "Conecte sua plataforma",
    texto: "Configure sua integração para receber os eventos de venda.",
  },
  {
    titulo: "Acompanhe as oportunidades",
    texto: "Veja pedidos pendentes, Pix não pagos e cartões recusados em um só lugar.",
  },
];

const faqs = [
  {
    pergunta: "O ReyCart promete recuperar todas as vendas?",
    resposta:
      "Não. O ReyCart não promete resultado garantido. Ele ajuda você a organizar e acompanhar oportunidades de venda que ficaram pendentes, para agir com mais controle.",
  },
  {
    pergunta: "Gerar Pix libera acesso automaticamente?",
    resposta:
      "Não. O acesso ao ReyCart só é liberado depois que o pagamento da assinatura é confirmado.",
  },
  {
    pergunta: "Para quem o ReyCart é indicado?",
    resposta:
      "Para infoprodutores, vendedores digitais, pequenos negócios e produtores que querem acompanhar melhor oportunidades de venda não finalizadas.",
  },
];

export const metadata = {
  title: "ReyCart | Recupere oportunidades de venda",
  description:
    "Painel para acompanhar Pix pendentes, cartões recusados e checkouts abandonados.",
};

export default function VendaPage() {
  return (
    <main data-sales-page="true" className="min-h-screen overflow-x-hidden bg-[#f6f8ff] text-slate-950">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_35%),linear-gradient(135deg,#ffffff_0%,#eef4ff_45%,#eaf1ff_100%)]">
        <div className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 px-5 py-10 md:grid-cols-[1fr_0.95fr] md:px-8 lg:px-10">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm">
              ReyCart • Recuperação de oportunidades
            </div>

            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              Pare de perder vendas que ficaram pelo caminho
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
              O ReyCart ajuda você a acompanhar Pix pendentes, cartões recusados
              e checkouts abandonados em um painel simples, para agir antes que
              essas oportunidades desapareçam.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="sales-cta-pulse rounded-2xl bg-blue-700 px-7 py-4 text-center text-base font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
              >
                Criar minha conta agora
              </Link>

              <a
                href="#como-funciona"
                className="rounded-2xl border border-slate-300 bg-white px-7 py-4 text-center text-base font-black text-slate-800 transition hover:bg-slate-50"
              >
                Ver como funciona
              </a>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Plano mensal de R$49. Acesso liberado somente após confirmação do
              pagamento.
            </p>
          </div>

          <SalesTabletDemo />
        </div>
      </section>

      <section className="bg-white px-5 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">
              O problema
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              Você paga pelo clique, mas muitas vendas ficam sem acompanhamento
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              A pessoa chega no checkout, gera Pix, tenta pagar no cartão ou
              abandona a compra. Sem um painel de controle, essas oportunidades
              ficam espalhadas e você perde clareza sobre o que precisa ser
              recuperado.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <div className="sales-card-motion rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-3xl font-black text-blue-700">01</p>
              <h3 className="mt-4 text-xl font-black">Pix não pago</h3>
              <p className="mt-3 leading-7 text-slate-600">
                O cliente gera o Pix, mas não finaliza. Sem acompanhamento, a
                venda pode simplesmente esfriar.
              </p>
            </div>

            <div className="sales-card-motion rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-3xl font-black text-blue-700">02</p>
              <h3 className="mt-4 text-xl font-black">Cartão recusado</h3>
              <p className="mt-3 leading-7 text-slate-600">
                O pagamento falha, mas ainda existe intenção de compra. É uma
                oportunidade que precisa ser vista rápido.
              </p>
            </div>

            <div className="sales-card-motion rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-3xl font-black text-blue-700">03</p>
              <h3 className="mt-4 text-xl font-black">Checkout abandonado</h3>
              <p className="mt-3 leading-7 text-slate-600">
                A pessoa demonstrou interesse, mas saiu antes de concluir. O
                ReyCart ajuda você a enxergar esses sinais.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">
              A solução
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              Um painel simples para organizar oportunidades de recuperação
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              O ReyCart centraliza informações importantes para quem vende
              online e quer acompanhar melhor pedidos não finalizados.
            </p>

            <div className="mt-8">
              <Link
                href="/"
                className="inline-flex rounded-2xl bg-blue-700 px-7 py-4 text-base font-black text-white shadow-lg shadow-blue-700/20 transition duration-300 hover:-translate-y-1 hover:bg-blue-800 hover:shadow-xl"
              >
                Começar agora por R$49/mês
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {beneficios.map((beneficio) => (
              <div
                key={beneficio}
                className="sales-card-motion rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-lg font-black text-blue-700">
                  ✓
                </div>
                <p className="font-bold leading-7 text-slate-800">
                  {beneficio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-white px-5 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">
              Como funciona
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              Simples para começar, direto para usar
            </h2>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {etapas.map((etapa, index) => (
              <div
                key={etapa.titulo}
                className="sales-card-motion rounded-3xl border border-slate-200 bg-slate-50 p-6"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-lg font-black text-white">
                  {index + 1}
                </div>
                <h3 className="text-lg font-black">{etapa.titulo}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {etapa.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-slate-950 p-6 text-white md:p-10">
          <div className="grid gap-8 md:grid-cols-[1fr_0.8fr] md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-300">
                Plano mensal
              </p>
              <h2 className="mt-4 text-4xl font-black md:text-5xl">
                R$49/mês
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
                Uma assinatura simples para acessar o painel ReyCart e começar a
                organizar suas oportunidades de recuperação.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 text-slate-950">
              <p className="text-sm font-bold text-slate-500">
                O acesso é liberado após confirmação do pagamento.
              </p>

              <Link
                href="/"
                className="mt-6 block rounded-2xl bg-blue-700 px-6 py-4 text-center text-base font-black text-white transition duration-300 hover:-translate-y-1 hover:bg-blue-800 hover:shadow-xl"
              >
                Criar minha conta
              </Link>

              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                Sem promessa de resultado garantido. O ReyCart é uma ferramenta
                de organização e acompanhamento de oportunidades.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 md:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">
              Dúvidas frequentes
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              Antes de começar
            </h2>
          </div>

          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.pergunta}
                className="sales-card-motion rounded-3xl border border-slate-200 bg-slate-50 p-6"
              >
                <h3 className="text-lg font-black">{faq.pergunta}</h3>
                <p className="mt-3 leading-7 text-slate-600">{faq.resposta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-blue-700 p-8 text-center text-white shadow-2xl shadow-blue-700/20 md:p-14">
          <h2 className="text-3xl font-black tracking-tight md:text-5xl">
            Comece a enxergar as vendas que hoje ficam invisíveis
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-50">
            Organize Pix pendentes, cartões recusados e checkouts abandonados em
            um painel simples para tomar decisões com mais clareza.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-2xl bg-white px-8 py-4 text-base font-black text-blue-700 transition duration-300 hover:-translate-y-1 hover:bg-blue-50 hover:shadow-xl"
          >
            Criar minha conta no ReyCart
          </Link>
        </div>
      </section>
    </main>
  );
}




