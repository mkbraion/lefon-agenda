'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import {
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Timer,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';

/* WebGPU/WebGL só existem no navegador — nada de SSR para o hero. */
const HeroFuturistic = dynamic(
  () => import('@/components/ui/hero-futuristic').then((m) => m.HeroFuturistic),
  {
    ssr: false,
    loading: () => <div className="h-svh w-full bg-[#100D0B]" />,
  }
);

const APP_URL = 'https://lefon-agenda.vercel.app';

const FEATURES = [
  {
    icon: CalendarPlus,
    title: 'Agendamento em segundos',
    body: 'Visita, avaliação, reunião, assinatura ou captação: escolha o tipo, o cliente e o horário livre. O sistema bloqueia horários já ocupados sozinho.',
  },
  {
    icon: Timer,
    title: 'Próxima visita ao vivo',
    body: 'Uma contagem regressiva mostra quanto falta para o próximo compromisso, com endereço, cliente e corretor responsável à mão.',
  },
  {
    icon: MessageCircle,
    title: 'Confirmação em um toque',
    body: 'Mensagem pronta no WhatsApp, e-mail para o cliente e evento no Google Agenda — sem digitar tudo de novo a cada visita.',
  },
  {
    icon: MapPin,
    title: 'Endereço pelo CEP',
    body: 'Digite o CEP e a rua e o bairro do imóvel se preenchem sozinhos. Só falta o número.',
  },
  {
    icon: Users,
    title: 'Equipe no controle',
    body: 'Veja a carga de cada corretor da semana e filtre a agenda por profissional com um clique.',
  },
  {
    icon: ShieldCheck,
    title: 'Painel do dono',
    body: 'Crie o acesso do corretor na hora, troque cargos, desative quem saiu. Senhas ficam cifradas — ninguém lê a senha de ninguém.',
  },
] as const;

const STEPS = [
  {
    n: '01',
    title: 'Marque a visita',
    body: 'Preencha cliente, imóvel e horário. Leva menos tempo que anotar num caderno.',
  },
  {
    n: '02',
    title: 'Confirme com o cliente',
    body: 'Dispare o WhatsApp com a mensagem pronta e registre a confirmação na agenda.',
  },
  {
    n: '03',
    title: 'Acompanhe o dia',
    body: 'A agenda mostra o que vem agora, o que ficou pendente e quanto da semana já está fechada.',
  },
] as const;

/** Revela o conteúdo conforme entra na tela, sem biblioteca de animação. */
function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const nodes = ref.current?.querySelectorAll('.reveal-on-scroll');
    if (!nodes?.length) return;

    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  return ref;
}

export function Landing() {
  const rootRef = useRevealOnScroll<HTMLDivElement>();
  const contentRef = useRef<HTMLElement>(null);

  return (
    <div ref={rootRef}>
      <HeroFuturistic
        eyebrow="Lefon Agenda"
        title="A agenda que não esquece"
        subtitle="Agende visitas em segundos, acompanhe sua equipe em tempo real e nunca mais perca uma venda por esquecimento."
        cta={{ label: 'Entrar no sistema', href: APP_URL }}
        scrollLabel="Role para conhecer"
        onScrollClick={() =>
          contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      />

      <main ref={contentRef} className="bg-background">
        {/* ===== Recursos ===== */}
        <section className="container py-20 sm:py-28">
          <div className="reveal-on-scroll max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
              O que o sistema faz
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">
              Tudo que a visita precisa,{' '}
              <span className="italic text-primary">num lugar só</span>.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Nada de planilha, bloco de notas e conversa perdida no WhatsApp. A
              agenda guarda o compromisso, o imóvel, o cliente e o corretor — e
              lembra você antes da hora.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <article
                key={title}
                className={cn(
                  'reveal-on-scroll rounded-lg border bg-card p-6',
                  'transition-shadow hover:shadow-[0_1px_2px_rgba(32,26,18,.05),0_14px_34px_rgba(32,26,18,.07)]'
                )}
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon size={20} strokeWidth={2} aria-hidden />
                </span>
                <h3 className="font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ===== Como funciona ===== */}
        <section className="border-y bg-secondary/60">
          <div className="container py-20 sm:py-24">
            <div className="reveal-on-scroll max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                Como funciona
              </p>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                Três passos, do primeiro contato à visita fechada.
              </h2>
            </div>

            <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map(({ n, title, body }, i) => (
                <li
                  key={n}
                  className="reveal-on-scroll relative pl-16 md:pl-0 md:pt-14"
                  style={{ transitionDelay: `${i * 90}ms` }}
                >
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 font-display text-4xl font-semibold text-primary/25 md:text-5xl"
                  >
                    {n}
                  </span>
                  <h3 className="font-display text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ===== Chamada final ===== */}
        <section className="container py-24 sm:py-32">
          <div className="reveal-on-scroll relative overflow-hidden rounded-xl border bg-[#161210] px-7 py-16 text-center sm:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                backgroundImage:
                  'radial-gradient(70% 60% at 50% 0%, rgba(158,43,37,.35), transparent 70%)',
              }}
            />
            <div className="relative">
              <CalendarClock
                size={34}
                strokeWidth={1.6}
                className="mx-auto mb-6 text-[#E0857A]"
                aria-hidden
              />
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold leading-tight text-[#FBF7EF] sm:text-4xl">
                Sua próxima visita já pode estar na agenda.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#C9BFB2] sm:text-base">
                Entre com seu e-mail e senha e comece a agendar agora. Se você é
                o dono do escritório, cadastre sua equipe no painel.
              </p>
              <a
                href={APP_URL}
                className="mt-9 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-[#7C201B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E0857A] sm:text-base"
              >
                Abrir a Lefon Agenda
                <ArrowRight size={18} strokeWidth={2.4} aria-hidden />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-9 text-center sm:flex-row sm:text-left">
          <p className="font-display text-sm font-semibold text-foreground">
            Lefon Agenda
          </p>
          <a
            href={APP_URL}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Entrar no sistema
          </a>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
