"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const telas = [
  {
    nome: "Dashboard",
    src: "/venda/reycart-dashboard.webp",
    alt: "Dashboard real do ReyCart com indicadores de oportunidades de recuperação",
    transform: "scale(1.03) translate3d(0, 0, 0)",
    objectPosition: "left top",
  },
  {
    nome: "Indicadores",
    src: "/venda/reycart-dashboard.webp",
    alt: "Indicadores reais do dashboard do ReyCart",
    transform: "scale(1.34) translate3d(-8%, -8%, 0)",
    objectPosition: "center top",
  },
  {
    nome: "Recuperação",
    src: "/venda/reycart-recuperacao.webp",
    alt: "Tela real de recuperação de vendas do ReyCart",
    transform: "scale(1.04) translate3d(0, 0, 0)",
    objectPosition: "left top",
  },
] as const;

const TEMPO_TELA = 3800;

export default function SalesTabletDemo() {
  const [telaAtiva, setTelaAtiva] = useState(0);
  const [ciclo, setCiclo] = useState(0);

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setTelaAtiva((atual) => (atual + 1) % telas.length);
      setCiclo((atual) => atual + 1);
    }, TEMPO_TELA);

    return () => window.clearInterval(intervalo);
  }, []);

  function selecionarTela(indice: number) {
    setTelaAtiva(indice);
    setCiclo((atual) => atual + 1);
  }

  return (
    <div className="relative">
      <div
        className="sales-glow absolute -inset-6 rounded-[2.5rem] bg-blue-500/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="sales-tablet-shell relative mx-auto w-full max-w-[720px]">
        <div className="sales-tablet-device relative z-[2] w-full overflow-hidden rounded-[30px] border border-white/70 bg-slate-950 p-[14px] pb-[18px] shadow-2xl">
          <span className="sales-tablet-camera" aria-hidden="true" />

          <div
            className="sales-tablet-screen relative w-full overflow-hidden rounded-[18px] border border-slate-300/40 bg-slate-100 shadow-inner"
            style={{
              aspectRatio: "2.19 / 1",
              height: "clamp(180px, 24vw, 330px)",
            }}
          >
            {telas.map((tela, indice) => {
              const ativa = telaAtiva === indice;

              return (
                <Image
                  key={`${tela.nome}-${indice}`}
                  src={tela.src}
                  alt={tela.alt}
                  fill
                  priority={indice === 0}
                  sizes="(max-width: 767px) 94vw, (max-width: 1279px) 48vw, 680px"
                  className="sales-screen-image"
                  style={{
                    zIndex: ativa ? 4 : indice + 1,
                    objectFit: "cover",
                    objectPosition: tela.objectPosition,
                    opacity: ativa ? 1 : 0,
                    transform: ativa
                      ? tela.transform
                      : "scale(1.09) translate3d(1.5%, 1%, 0)",
                    transition:
                      "opacity 700ms ease, transform 3600ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              );
            })}

            <div className="sales-screen-shine" aria-hidden="true" />

            <div className="sales-screen-badge">
              <span className="sales-screen-live-dot" aria-hidden="true" />
              Navegação automática
            </div>

            <div className="sales-screen-progress" aria-hidden="true">
              <span
                key={ciclo}
                style={{ animationDuration: `${TEMPO_TELA}ms` }}
              />
            </div>
          </div>
        </div>

        <div className="sales-tablet-base" aria-hidden="true" />
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-bold">
        {telas.map((tela, indice) => {
          const ativa = telaAtiva === indice;

          return (
            <button
              key={tela.nome}
              type="button"
              onClick={() => selecionarTela(indice)}
              aria-pressed={ativa}
              className={`rounded-full border px-3 py-1.5 shadow-sm transition duration-300 ${
                ativa
                  ? "border-blue-600 bg-blue-700 text-white shadow-blue-500/20"
                  : "border-blue-100 bg-white/90 text-slate-600 hover:border-blue-300 hover:text-blue-700"
              }`}
            >
              {tela.nome}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs leading-5 text-slate-500">
        Telas reais do ReyCart com dados pessoais protegidos. A demonstração
        alterna automaticamente entre as áreas do sistema.
      </p>
    </div>
  );
}
