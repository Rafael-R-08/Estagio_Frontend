import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logoIcon from '../../../assets/logo2.icon.png';
import { Moon, Sun, Sparkles, BadgeCheck, MessageSquare, X, Smartphone, Monitor, Apple } from 'lucide-react';
import { applyTheme } from '../../../utils/theme';
import LoginCard from '../../auth/components/LoginCard';

export default function LandingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(() => {
    return location.pathname === '/login' || location.search.includes('login=true');
  });
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    setIsDark(!isDark);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    if (location.pathname === '/login') {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm transition-all duration-300">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="Softinsa Learning Hub" className="h-8 w-8 object-contain" />
            <span className="text-sm font-bold tracking-tight text-foreground">Softinsa Learning Hub</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="hidden sm:inline-flex h-9 items-center justify-center px-4 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Iniciar sessão
            </button>
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
            Agrega formações externas, recomenda percursos com IA, gere e organiza o teu progresso e centraliza certificados.
          </p>

          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="h-12 inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white px-10 text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-blue-600/20"
            >
              Iniciar sessão
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-10 pt-2 border-t border-border/40 w-full max-w-md">
            {[
              { value: '6+', label: 'Plataformas' },
              { value: 'IA', label: 'Recomendações' },
              { value: 'PWA', label: 'iOS · Android' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-black text-foreground tracking-tight">{value}</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{label}</span>
              </div>
            ))}
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
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 stroke-[1.5]" />
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-foreground">Recomendações com IA</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Recebe sugestões de formações personalizadas com base no teu perfil, service line e lacunas de competências.
                </p>
              </div>
            </div>
            {/* Card 2 */}
            <div className="bg-background p-10 flex flex-col gap-6 transition-colors hover:bg-muted/30 group">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-foreground">Gestão de Certificados</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Carrega e acompanha as tuas certificações com alertas automáticos de expiração.
                </p>
              </div>
            </div>
            {/* Card 3 */}
            <div className="bg-background p-10 flex flex-col gap-6 transition-colors hover:bg-muted/30 group">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40">
                <MessageSquare className="h-5 w-5 text-violet-600 dark:text-violet-400 stroke-[1.5]" />
              </div>
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

      {/* Mobile Section */}
      <section className="py-24 border-t border-border overflow-hidden">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

            {/* Phone mockup */}
            <div className="flex justify-center">
              <div className="relative w-[220px]">
                {/* Phone frame */}
                <div className="relative w-full aspect-[9/19] rounded-[2.5rem] border-[6px] border-foreground/10 bg-muted/30 shadow-2xl shadow-foreground/10 overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-foreground/10 z-10" />
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-5 pt-9 pb-2">
                    <span className="text-[8px] font-bold text-foreground/40">9:41</span>
                    <div className="flex gap-1 items-center">
                      <div className="w-3 h-1.5 rounded-sm bg-foreground/30" />
                      <div className="w-1 h-1 rounded-full bg-foreground/30" />
                    </div>
                  </div>
                  {/* App content */}
                  <div className="px-3 space-y-2">
                    {/* Header bar */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-2 w-16 rounded-full bg-foreground/20" />
                      <div className="h-5 w-5 rounded-full bg-blue-500/30" />
                    </div>
                    {/* Progress card */}
                    <div className="rounded-xl bg-blue-600 p-3 space-y-2">
                      <div className="h-1.5 w-12 rounded-full bg-white/40" />
                      <div className="h-2 w-20 rounded-full bg-white/80" />
                      <div className="h-1 w-full rounded-full bg-white/20 mt-1">
                        <div className="h-full w-3/5 rounded-full bg-white/70" />
                      </div>
                    </div>
                    {/* Cards */}
                    {[0.7, 0.5, 0.85].map((w, i) => (
                      <div key={i} className="rounded-xl border border-border/40 bg-background/60 p-2.5 flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-blue-500/20 shrink-0" />
                        <div className="space-y-1 flex-1">
                          <div className="h-1.5 rounded-full bg-foreground/25" style={{ width: `${w * 100}%` }} />
                          <div className="h-1 rounded-full bg-foreground/10 w-2/3" />
                        </div>
                      </div>
                    ))}
                    {/* Bottom nav */}
                    <div className="absolute bottom-0 left-0 right-0 border-t border-border/30 bg-background/80 backdrop-blur-sm flex justify-around py-2 px-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={`h-4 w-4 rounded-md ${i === 0 ? 'bg-blue-500/60' : 'bg-foreground/15'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                {/* Reflection glow */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-8 bg-blue-500/20 blur-2xl rounded-full" />
              </div>
            </div>

            {/* Text content */}
            <div className="flex flex-col space-y-6">
              <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Mobile</p>
              <h2 className="text-3xl font-bold tracking-tight leading-snug">
                Sempre consigo.<br />
                <span className="text-blue-600 dark:text-blue-400">Em qualquer dispositivo.</span>
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Acede ao teu percurso de aprendizagem, consulta recomendações e gere certificados a partir do teu smartphone — com a mesma experiência da versão web.
              </p>
              <div className="flex flex-col gap-3 pt-2">
                {[
                  { icon: Apple, label: 'iOS', desc: 'Adiciona ao ecrã principal' },
                  { icon: Smartphone, label: 'Android', desc: 'Instala como app nativa' },
                  { icon: Monitor, label: 'Desktop', desc: 'Chrome, Edge, Safari' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl border border-border/60 px-4 py-3 bg-muted/20">
                    <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-foreground">{label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA section */}
      <section className="py-32 border-t border-border bg-background transition-colors duration-300 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/8 dark:bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative container mx-auto max-w-3xl px-6 flex flex-col items-center text-center gap-8 animate-in fade-in duration-1000">
          <img src={logoIcon} alt="Softinsa Learning Hub" className="h-14 w-14 object-contain opacity-90" />

          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.15] text-foreground">
            O teu próximo passo<br />
            <span className="text-blue-600 dark:text-blue-400">começa aqui.</span>
          </h2>

          <p className="text-muted-foreground text-base max-w-xl leading-relaxed">
            Acede ao teu perfil, descobre formações relevantes e mantém o teu percurso sempre atualizado — tudo numa única plataforma.
          </p>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="mt-2 h-12 inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white px-12 text-sm font-semibold transition-all active:scale-95 shadow-xl shadow-blue-600/25"
          >
            Vamos começar
          </button>
        </div>
      </section>

      {/* Extended Footer */}
      <footer className="border-t border-border py-16 bg-background">
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
          <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-muted-foreground font-bold tracking-[0.15em] uppercase opacity-40">
            <p>© 2026 Softinsa · LearningHub</p>
            <p>Portugal · Todos os direitos reservados</p>
          </div>
        </div>
      </footer>
      {/* ── Login Modal Overlay ── */}
      {isLoginModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300"
          onClick={closeLoginModal}
        >
          {/* Backdrop Blur Layer */}
          <div className="absolute inset-0 bg-background/20 backdrop-blur-3xl" />
          
          {/* Login Card */}
          <div className="relative z-10 w-full max-w-[420px] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            <LoginCard />
            
            {/* Optional Close hint or button if needed, but per request clicking BG is enough */}
            <button 
              className="absolute -top-12 right-0 p-2 text-foreground/40 hover:text-foreground transition-colors sm:hidden"
              onClick={closeLoginModal}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
