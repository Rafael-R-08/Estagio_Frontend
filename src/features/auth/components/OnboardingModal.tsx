import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bot, Award, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { storage } from '../../../lib/storage';

// ─── Slide definitions ────────────────────────────────────────────────────────

const SLIDES = [
  {
    icon: Search,
    color: 'bg-blue-100 text-softinsa-blue',
    title: 'Descoberta de Cursos',
    description:
      'Pesquisa e encontra cursos em múltiplas plataformas de uma só vez — Microsoft Learn, Udemy, IBM Skills Build, Trailhead e muito mais. Tudo centralizado num único lugar.',
    highlight: 'Múltiplas plataformas, uma pesquisa.',
  },
  {
    icon: Bot,
    color: 'bg-purple-100 text-purple-600',
    title: 'Assistente de IA',
    description:
      'O teu assistente inteligente analisa o teu perfil, experiência e objetivos para te sugerir os cursos mais relevantes. Faz perguntas em linguagem natural e obtém respostas instantâneas.',
    highlight: 'Recomendações personalizadas por IA.',
  },
  {
    icon: Award,
    color: 'bg-amber-100 text-amber-600',
    title: 'Gestão de Certificados',
    description:
      'Regista os cursos que completaste, guarda os teus certificados e acompanha o teu progresso de aprendizagem ao longo do tempo. Partilha as tuas conquistas com a equipa.',
    highlight: 'O teu percurso de aprendizagem, sempre visível.',
  },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface OnboardingModalProps {
  open: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingModal({ open }: OnboardingModalProps) {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);

  if (!open) return null;

  const current = SLIDES[slide];
  const Icon = current.icon;
  const isLast = slide === SLIDES.length - 1;

  const finish = () => {
    storage.setOnboardingSeen();
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div
        className="relative w-full max-w-md rounded-2xl bg-background shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Bem-vindo ao Softinsa Learning Hub"
      >
        {/* Skip button */}
        <button
          onClick={finish}
          aria-label="Saltar introdução"
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Slide progress bar */}
        <div className="flex gap-1.5 px-6 pt-6 pb-0">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-300',
                i <= slide ? 'bg-primary' : 'bg-muted',
              )}
            />
          ))}
        </div>

        {/* Slide content */}
        <div className="px-8 py-8 text-center">
          {/* Icon */}
          <div
            className={cn(
              'mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl',
              current.color,
            )}
          >
            <Icon className="h-10 w-10" />
          </div>

          {/* Step indicator */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Passo {slide + 1} de {SLIDES.length}
          </p>

          {/* Title */}
          <h2 className="mb-3 text-2xl font-bold text-foreground">{current.title}</h2>

          {/* Description */}
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            {current.description}
          </p>

          {/* Highlight pill */}
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            {current.highlight}
          </span>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          {/* Previous */}
          <button
            onClick={() => setSlide((s) => s - 1)}
            disabled={slide === 0}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              slide === 0
                ? 'invisible'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          {/* Dots */}
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Ir para slide ${i + 1}`}
                className={cn(
                  'h-2 w-2 rounded-full transition-all duration-300',
                  i === slide ? 'bg-primary w-5' : 'bg-muted-foreground/30',
                )}
              />
            ))}
          </div>

          {/* Next / Start */}
          {isLast ? (
            <button
              onClick={finish}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Começar
            </button>
          ) : (
            <button
              onClick={() => setSlide((s) => s + 1)}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
