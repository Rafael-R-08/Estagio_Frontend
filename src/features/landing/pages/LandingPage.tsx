import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Moon, Sun, Sparkles, BadgeCheck, MessageSquare } from 'lucide-react';
import { applyTheme } from '../../../utils/theme';

export default function LandingPage() {
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    setIsDark(!isDark);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm transition-all duration-300">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-foreground">LearningHub</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              to="/login"
              className="hidden sm:inline-flex h-9 items-center justify-center px-4 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Iniciar sessão
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-4xl w-full flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
          <div className="border border-border rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground tracking-tight select-none">
            Plataforma interna Softinsa · IBM Company
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground">
            A plataforma de formação<br />
            <span className="text-blue-600 dark:text-blue-400">inteligente</span>.
          </h1>

          <p className="max-w-xl mx-auto text-lg text-muted-foreground leading-relaxed">
            Agrega formações externas, recomenda percursos com IA e centraliza certificados — disponível na web e em dispositivos móveis.
          </p>

          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link
              to="/login"
              className="h-12 inline-flex items-center justify-center rounded-full bg-foreground px-10 text-sm font-medium text-background transition-all hover:bg-foreground/90 active:scale-95 shadow-lg shadow-foreground/5"
            >
              Iniciar sessão
            </Link>
          </div>

          <div className="pt-6">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-60">
              PWA disponível · iOS · Android · Desktop
            </p>
          </div>
        </div>
      </section>

      {/* Search/Platforms Section */}
      <section className="py-24 border-t border-border bg-background select-none">
        <div className="container mx-auto max-w-7xl px-6 flex flex-col items-center gap-16 animate-in fade-in duration-1000">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase opacity-70">Plataformas integradas</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-3xl">Pesquisa de formações simplificada.</h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-12 grayscale opacity-40 hover:opacity-100 transition-opacity duration-500">
            <div className="flex flex-col items-center">
              <span className="font-black text-2xl tracking-tighter">Salesforce</span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-blue-600 dark:text-blue-400 -mt-1">TRAILHEAD</span>
            </div>
            <div className="font-black text-2xl tracking-normal text-foreground uppercase border-b-4 border-foreground pb-0.5">Udemy</div>
            <div className="flex items-center gap-2 font-semibold text-xl tracking-tight">
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                <div className="w-full h-full bg-foreground" />
                <div className="w-full h-full bg-foreground" />
                <div className="w-full h-full bg-foreground" />
                <div className="w-full h-full bg-foreground" />
              </div>
              Microsoft Learn
            </div>
            <div className="flex items-center gap-1.5 font-black text-xl tracking-tighter border-l-2 border-foreground pl-3">
              <span className="text-blue-600 dark:text-blue-400 italic">IBM</span>
              <span>SkillsBuild</span>
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="font-serif italic font-bold text-xl uppercase tracking-tighter">Academia</span>
              <span className="font-black text-sm tracking-widest text-blue-600 dark:text-blue-400">PORTUGAL DIGITAL</span>
            </div>
            <div className="flex flex-col items-end leading-none border-r-2 border-foreground pr-3">
              <span className="font-medium text-[10px] tracking-widest text-muted-foreground uppercase">Softinsa</span>
              <span className="font-bold text-xl tracking-tight lowercase">Everyday learning</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features section (Grid Divider Trick) */}
      <section className="pt-24 pb-24 border-t border-border">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-16 space-y-4">
            <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Funcionalidades</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-3xl">Tudo o que precisas para crescer</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border overflow-hidden">
            {/* Card 1 */}
            <div className="bg-background p-10 flex flex-col gap-6 transition-colors hover:bg-muted/30 group">
              <Sparkles className="h-5 w-5 text-foreground stroke-[1.5]" />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-foreground">Recomendações com IA</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Recebe sugestões de formações personalizadas com base no teu perfil, service line e lacunas de competências.
                </p>
              </div>
            </div>
            {/* Card 2 */}
            <div className="bg-background p-10 flex flex-col gap-6 transition-colors hover:bg-muted/30 group">
              <BadgeCheck className="h-5 w-5 text-foreground stroke-[1.5]" />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-foreground">Gestão de Certificados</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Carrega e acompanha as tuas certificações com alertas automáticos de expiração.
                </p>
              </div>
            </div>
            {/* Card 3 */}
            <div className="bg-background p-10 flex flex-col gap-6 transition-colors hover:bg-muted/30 group">
              <MessageSquare className="h-5 w-5 text-foreground stroke-[1.5]" />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-foreground">Assistente de IA</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Faz perguntas ao assistente e obtém orientação imediata sobre que formações fazer a seguir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Lines Section */}
      <section className="pt-24 pb-24 border-t border-border">
        <div className="container mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
            <div className="flex flex-col justify-center space-y-4">
              <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Service Lines</p>
              <h2 className="text-3xl font-bold tracking-tight">Organizado pela estrutura da Softinsa.</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                As recomendações adaptam-se automaticamente à service line de cada colaborador.
              </p>
            </div>
            <div className="flex flex-col border-t border-border">
              {[
                "Hybrid Cloud",
                "Data",
                "Business Applications",
                "Application Operations",
                "Sourcing & Talent Management"
              ].map((line) => (
                <div 
                  key={line} 
                  className="group flex items-center justify-between py-5 border-b border-border transition-colors hover:bg-muted/20 px-2 -mx-2 cursor-default"
                >
                  <span className="text-sm font-medium text-foreground transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA section */}
      <section className="pt-32 pb-48 border-t border-border bg-background transition-colors duration-300">
        <div className="container mx-auto max-w-7xl px-6 text-center space-y-12">
          <div className="space-y-6 animate-in fade-in duration-1000">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl max-w-4xl mx-auto leading-[1.2]">
              Criado para potenciar o crescimento dos <br />
              <span className="text-blue-600 dark:text-blue-400">colaboradores.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto font-medium">
              Tecnologia moderna, IA de última geração e foco total na aprendizagem contínua. Estamos a construir o futuro do conhecimento, um módulo de cada vez.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 animate-in fade-in zoom-in-95 duration-500 delay-300 fill-mode-both">
            {["INOVAÇÃO", "FLEXIBILIDADE", "TECNOLOGIA DE PONTA"].map((pills) => (
              <span
                key={pills}
                className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-muted/50 px-6 text-[10px] font-bold tracking-[0.2em] text-muted-foreground transition-all hover:bg-muted hover:text-foreground cursor-default"
              >
                {pills}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Extended Footer */}
      <footer className="border-t border-border py-32 bg-background">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-y-16 lg:grid-cols-4">
            <div className="space-y-5">
              <h3 className="text-xs font-semibold tracking-[0.2em] text-foreground uppercase">Softinsa Learning</h3>
              <p className="text-xs leading-relaxed text-muted-foreground max-w-[200px] font-medium opacity-80">
                Plataforma central de conhecimento da Softinsa, acelerando o desenvolvimento de competências.
              </p>
            </div>
            <div className="space-y-5">
              <h3 className="text-xs font-semibold tracking-[0.2em] text-foreground uppercase">Plataforma</h3>
              <ul className="space-y-3 text-xs text-muted-foreground font-medium opacity-80">
                <li className="hover:text-foreground transition-colors cursor-pointer">Soluções</li>
                <li className="hover:text-foreground transition-colors cursor-pointer">Currículo</li>
                <li className="hover:text-foreground transition-colors cursor-pointer">IA Engine</li>
              </ul>
            </div>
            <div className="space-y-5">
              <h3 className="text-xs font-semibold tracking-[0.2em] text-foreground uppercase">Recursos</h3>
              <ul className="space-y-3 text-xs text-muted-foreground font-medium opacity-80">
                <li className="hover:text-foreground transition-colors cursor-pointer">Suporte</li>
                <li className="hover:text-foreground transition-colors cursor-pointer">Contacto</li>
                <li className="hover:text-foreground transition-colors cursor-pointer">Carreiras</li>
              </ul>
            </div>
            <div className="space-y-5">
              <h3 className="text-xs font-semibold tracking-[0.2em] text-foreground uppercase">Legal</h3>
              <ul className="space-y-3 text-xs text-muted-foreground font-medium opacity-80">
                <li className="hover:text-foreground transition-colors cursor-pointer">Privacidade</li>
                <li className="hover:text-foreground transition-colors cursor-pointer">Termos de Uso</li>
              </ul>
            </div>
          </div>
          <div className="mt-24 pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-muted-foreground font-bold tracking-[0.15em] uppercase opacity-40">
            <p>© 2026 Softinsa · LearningHub</p>
            <p>Portugal · Todos os direitos reservados</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
