import { useState, useEffect, useLayoutEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Bell, User, LayoutDashboard, Search, Sparkles, BookOpen, Award, Settings } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  icon: any;
  position: 'right' | 'left' | 'bottom' | 'top';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-dashboard',
    title: 'A tua Dashboard',
    content: 'Aqui tens um resumo de todo o teu progresso, recomendações personalizadas e as tuas estatísticas de aprendizagem.',
    icon: LayoutDashboard,
    position: 'right',
  },
  {
    targetId: 'tour-search',
    title: 'Pesquisa de Cursos',
    content: 'Explora milhares de cursos de várias plataformas. Podes filtrar por tecnologia, nível ou duração.',
    icon: Search,
    position: 'right',
  },
  {
    targetId: 'tour-ai',
    title: 'AI Assistant',
    content: 'O teu co-piloto inteligente. Tira dúvidas, pede sugestões de carreira ou ajuda para encontrar o curso ideal.',
    icon: Sparkles,
    position: 'right',
  },
  {
    targetId: 'tour-certificates',
    title: 'Os teus Certificados',
    content: 'Gere todas as tuas conquistas e certificados num só lugar. Podes até fazer upload de certificados externos.',
    icon: Award,
    position: 'right',
  },
  {
    targetId: 'tour-mylearning',
    title: 'O teu Progresso',
    content: 'Acompanha em tempo real os cursos que tens em mãos e o teu histórico de aprendizagem.',
    icon: BookOpen,
    position: 'right',
  },
  {
    targetId: 'tour-profile',
    title: 'O teu Perfil',
    content: 'Mantém o teu perfil técnico em dia para que a IA te consiga recomendar os melhores conteúdos.',
    icon: User,
    position: 'right',
  },
  {
    targetId: 'tour-settings',
    title: 'Definições',
    content: 'Personaliza a tua experiência, altera idiomas e gere as tuas preferências de privacidade.',
    icon: Settings,
    position: 'right',
  },
  {
    targetId: 'tour-notifications',
    title: 'Notificações',
    content: 'Fica a saber quando novos cursos obrigatórios são partilhados ou quando um certificado está prestes a expirar.',
    icon: Bell,
    position: 'bottom',
  },
];

export function ProductTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const activeStep = TOUR_STEPS[currentStep];

  // Logic to show tour only once
  useEffect(() => {
    const isDone = localStorage.getItem('lh_tour_complete');
    if (!isDone) {
      // Pequeno delay para garantir que a página carregou e o OnboardingModal fechou
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Update target position
  useLayoutEffect(() => {
    if (!isVisible) return;

    const updatePosition = () => {
      const el = document.getElementById(activeStep.targetId);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isVisible, currentStep, activeStep.targetId]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('lh_tour_complete', 'true');
    setIsVisible(false);
  };

  if (!isVisible || !targetRect) return null;

  const Icon = activeStep.icon;

  // Calculate popover position with safety checks for screen edges
  const getPopoverStyle = () => {
    const spacing = 16;
    const cardWidth = 320;
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

    if (activeStep.position === 'right') {
      return {
        top: targetRect.top + targetRect.height / 2,
        left: targetRect.right + spacing,
        transform: 'translateY(-50%)',
      };
    }

    if (activeStep.position === 'bottom') {
      const centerX = targetRect.left + targetRect.width / 2;
      
      // Se o cartão for sair pelo lado direito do ecrã
      if (centerX + cardWidth / 2 > screenWidth - spacing) {
        return {
          top: targetRect.bottom + spacing,
          right: spacing,
          transform: 'none',
        };
      }

      // Se o cartão for sair pelo lado esquerdo do ecrã
      if (centerX - cardWidth / 2 < spacing) {
        return {
          top: targetRect.bottom + spacing,
          left: spacing,
          transform: 'none',
        };
      }

      // Posicionamento centrado padrão
      return {
        top: targetRect.bottom + spacing,
        left: centerX,
        transform: 'translateX(-50%)',
      };
    }
    return {};
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Dynamic SVG Spotlight Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - 4}
              y={targetRect.top - 4}
              width={targetRect.width + 8}
              height={targetRect.height + 8}
              rx="12"
              fill="black"
              className="transition-all duration-500 ease-in-out"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#spotlight-mask)"
          className="backdrop-blur-[2px]"
        />
      </svg>

      {/* Popover Content */}
      <div
        className="absolute pointer-events-auto w-[320px] animate-in fade-in zoom-in-95 duration-300"
        style={getPopoverStyle()}
      >
        <div className="relative rounded-[2rem] bg-card/90 backdrop-blur-2xl border border-border/60 shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 overflow-hidden group">
          {/* Close button */}
          <button
            onClick={handleComplete}
            className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground/40 hover:bg-muted hover:text-foreground transition-all active:scale-90"
            title="Sair do Tutorial"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Progress dots */}
          <div className="flex gap-1.5 mb-6">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  i === currentStep ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/20"
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black tracking-tight">{activeStep.title}</h3>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground mb-8">
            {activeStep.content}
          </p>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleComplete}
              className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              Saltar Tutorial
            </button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  className="h-10 w-10 rounded-xl p-0 hover:bg-muted"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="h-10 rounded-xl px-5 flex items-center gap-2 bg-primary text-white font-bold text-xs shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <>
                    Finalizar <Check className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Seguinte <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
