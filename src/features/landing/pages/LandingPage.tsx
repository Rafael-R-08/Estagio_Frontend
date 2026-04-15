import { useState, useRef, useEffect } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';
import logoIcon from '../../../assets/logo2.icon.png';
import mobileScreenshot from '../../../assets/mobile2.png';
import { Moon, Sun, Sparkles, BadgeCheck, MessageSquare, X, Smartphone, Apple, Search, Bot, CheckCircle2, BookOpen } from 'lucide-react';
import { applyTheme } from '../../../utils/theme';
import LoginCard from '../../auth/components/LoginCard';
import 'flag-icons/css/flag-icons.min.css';
import { cn } from '../../../lib/utils';

// ─── Animations Variants ──────────────────────────────────────────────────────
const fadeUpConfig = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
};

// ─── Typewriter Effect Component ──────────────────────────────────────────────
const searchPhrases = [
  "Aprender Kubernetes...",
  "Aprender Cloud...",
  "Aprender Next.js...",
  "Aprender Salesforce...",
  "Aprender IA Generativa..."
];

function TypewriterEffect() {
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = searchPhrases[phraseIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (isDeleting) {
      if (text === "") {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % searchPhrases.length);
      } else {
        timeout = setTimeout(() => setText(text.slice(0, -1)), 35);
      }
    } else {
      if (text === currentPhrase) {
        timeout = setTimeout(() => setIsDeleting(true), 2500);
      } else {
        timeout = setTimeout(() => setText(currentPhrase.slice(0, text.length + 1)), 80);
      }
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex]);

  return (
    <span className="text-xs font-mono text-muted-foreground whitespace-nowrap relative">
      {text || "\u00A0"}
      <span className="inline-block w-[2px] h-3 bg-primary ml-0.5 align-middle opacity-80" />
    </span>
  );
}

// ─── Glow Action Card ─────────────────────────────────────────────────────────
function GlowCard({ className, children }: { className?: string; children: ReactNode }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn(
        "group relative bg-background flex flex-col gap-6 overflow-hidden transition-all duration-300",
        className
      )}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              450px circle at ${mouseX}px ${mouseY}px,
              rgba(59, 130, 246, 0.08),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10 w-full h-full p-10 flex flex-col gap-6">
        {children}
      </div>
    </div>
  );
}

// ─── 3D Tilt Wrapper ──────────────────────────────────────────────────────────
function TiltWrapper({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the animation
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn("relative", className)}
    >
      <motion.div
        className="absolute inset-0 z-20 pointer-events-none rounded-2xl transition-opacity opacity-0 hover:opacity-10"
        style={{
          background: useMotionTemplate`radial-gradient(ellipse at ${useTransform(x, [-0.5, 0.5], ["0%", "100%"])} ${useTransform(y, [-0.5, 0.5], ["0%", "100%"])}, white, transparent 50%)`
        }}
      />
      {children}
    </motion.div>
  );
}

// ─── Mesh Gradients Background ────────────────────────────────────────────────
function MeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute top-0 right-0 -mr-[10%] -mt-[5%] w-[50%] h-[50%] rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-none sm:animate-[spin_40s_linear_infinite]" />
      <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 dark:bg-purple-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-none sm:animate-[spin_40s_linear_infinite_reverse]" />
    </div>
  );
}

// ─── Interactive Hero Section ───────────────────────────────────────────────────
function HeroSection({ onCtaClick }: { onCtaClick: () => void }) {
  const { t } = useTranslation();
  const heroRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for parallax
  const smoothX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Parallax layers mapped to mouse movements (invert and boost scales)
  const layer1X = useTransform(smoothX, [-0.5, 0.5], [40, -40]);
  const layer1Y = useTransform(smoothY, [-0.5, 0.5], [40, -40]);
  
  const layer2X = useTransform(smoothX, [-0.5, 0.5], [-30, 30]);
  const layer2Y = useTransform(smoothY, [-0.5, 0.5], [-30, 30]);

  const layer3X = useTransform(smoothX, [-0.5, 0.5], [20, -20]);
  const layer3Y = useTransform(smoothY, [-0.5, 0.5], [-20, 20]);

  const layer4X = useTransform(smoothX, [-0.5, 0.5], [25, -25]);
  const layer4Y = useTransform(smoothY, [-0.5, 0.5], [25, -25]);

  return (
    <section 
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden"
    >
      <MeshBackground />
      
      {/* ── Floating Bento Cards (Parallax) ── */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none max-w-[1600px] mx-auto">
        
        {/* Card 1: Typing Search (Top Right) */}
        <motion.div 
          style={{ x: layer1X, y: layer1Y, rotate: 3 }}
          className="absolute top-[20%] right-[10%] bg-background/80 backdrop-blur-xl border border-border/60 shadow-2xl shadow-blue-900/5 rounded-2xl p-4 w-72 flex flex-col gap-3"
        >
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg overflow-hidden">
            <Search className="w-4 h-4 text-primary shrink-0" />
            <TypewriterEffect />
          </div>
          <div className="flex justify-between items-center px-1">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 border border-background shadow-sm" />
              <div className="w-6 h-6 rounded-full bg-indigo-100 border border-background shadow-sm" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">+15 Cursos</span>
          </div>
        </motion.div>

        {/* Card 2: AI Assistant (Bottom Left) */}
        <motion.div 
          style={{ x: layer2X, y: layer2Y, rotate: -4 }}
          className="absolute bottom-[25%] left-[8%] bg-background/80 backdrop-blur-xl border border-border/60 shadow-2xl shadow-purple-900/5 rounded-3xl p-5 w-64 flex gap-4 items-start"
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-foreground">AI Assitant</span>
            <p className="text-[10px] text-muted-foreground leading-snug">
              "Cruzei os teus skills! Encontrei 2 percursos de Arquitetura ideais para ti."
            </p>
          </div>
        </motion.div>

        {/* Card 3: Certificate Upload (Bottom Right) */}
        <motion.div 
          style={{ x: layer3X, y: layer3Y, rotate: 2 }}
          className="absolute bottom-[18%] right-[15%] bg-background/80 backdrop-blur-xl border border-border/60 shadow-2xl shadow-green-900/5 rounded-2xl p-4 flex gap-3 items-center"
        >
          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">Certificado Validado</span>
            <span className="text-[10px] text-muted-foreground">Azure Solutions Architect</span>
          </div>
        </motion.div>

        {/* Card 4: Course Progress (Top Left) */}
        <motion.div 
          style={{ x: layer4X, y: layer4Y, rotate: -3 }}
          className="absolute top-[18%] left-[8%] bg-background/80 backdrop-blur-xl border border-border/60 shadow-2xl shadow-blue-900/5 rounded-2xl p-4 flex gap-3 items-center w-60"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex flex-col flex-1 gap-1.5">
            <div className="flex justify-between items-center w-full">
              <span className="text-xs font-bold text-foreground">React Patterns</span>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">75%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 dark:bg-blue-400 rounded-full" style={{ width: '75%' }} />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-4xl w-full px-6 flex flex-col items-center justify-center relative z-10 mx-auto pointer-events-auto">
        <motion.div
          initial="initial"
          animate="whileInView"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.1 }}
          className="flex flex-col items-center text-center space-y-8"
        >
          <motion.div variants={fadeUpConfig} className="border border-border rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground tracking-tight select-none bg-background/50 backdrop-blur-sm shadow-sm">
            {t('landing.badge')}
          </motion.div>

          <motion.h1 variants={fadeUpConfig} className="text-4xl md:text-[5rem] font-extrabold tracking-tight leading-[1.1] text-foreground">
            {t('landing.heroLine1')}<br />
            <span className="text-blue-600 dark:text-blue-400 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">
              {t('landing.heroLine2')}
            </span>.
          </motion.h1>

          <motion.p variants={fadeUpConfig} className="max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed mt-4">
            {t('landing.heroDesc')}
          </motion.p>

          <motion.div variants={fadeUpConfig} className="flex flex-wrap gap-4 justify-center pt-6">
            <button
              onClick={onCtaClick}
              className="h-12 inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white px-10 text-sm font-semibold transition-all active:scale-95 shadow-xl shadow-blue-600/25 ring-1 ring-blue-600/50 hover:ring-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/20"
            >
              {t('landing.cta')}
            </button>
          </motion.div>

          <motion.div variants={fadeUpConfig} className="flex flex-wrap items-center justify-center gap-12 pt-8 border-t border-border/40 w-full max-w-lg mt-8">
            {[
              { value: '6+', label: t('landing.stat1') },
              { value: t('landing.statAI'), label: t('landing.stat2') },
              { value: 'PWA', label: t('landing.stat3') },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-base font-black text-foreground tracking-tight">{value}</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(() => {
    return location.pathname === '/login' || location.search.includes('login=true');
  });
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [lang, setLang] = useState<'pt' | 'en'>(() => {
    return (localStorage.getItem('lh_lang') as 'pt' | 'en') ?? 'pt';
  });

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    setIsDark(!isDark);
  };

  const toggleLang = () => {
    const newLang = lang === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(newLang);
    setLang(newLang);
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
        <div className="container mx-auto flex h-16 max-w-7xl 2xl:max-w-[1600px] items-center justify-between px-6 xl:px-12">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="Softinsa Learning Hub" className="h-8 w-8 object-contain" />
            <span className="text-sm font-bold tracking-tight text-foreground">Softinsa Learning Hub</span>
          </div>

          {/* Section links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Navegação da página">
            {[
              { href: '#platforms', label: t('landing.platformsLabel') },
              { href: '#features', label: t('landing.featuresLabel') },
              { href: '#service-lines', label: t('landing.slLabel') },
              { href: '#mobile', label: t('landing.mobileLabel') },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/40"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleLang}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 hover:text-foreground transition-colors"
              aria-label={lang === 'pt' ? 'Switch to English' : 'Mudar para Português'}
              title={lang === 'pt' ? 'English' : 'Português'}
            >
              <span className={`fi fi-${lang === 'pt' ? 'gb' : 'pt'} text-base`} />
            </button>
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
              {t('landing.cta')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection onCtaClick={() => setIsLoginModalOpen(true)} />

      {/* Search/Platforms Section */}
      <section id="platforms" className="py-24 border-t border-border bg-background select-none overflow-hidden">
        <motion.div
          {...fadeUpConfig}
          className="container mx-auto flex flex-col items-center gap-16 px-6"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase opacity-70">{t('landing.platformsLabel')}</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-3xl">{t('landing.platformsTitle')}</h2>
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
        </motion.div>
      </section>

      {/* Features section (Grid Divider Trick) */}
      <section id="features" className="pt-24 pb-24 border-t border-border">
        <motion.div
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ staggerChildren: 0.1 }}
          className="container mx-auto max-w-7xl 2xl:max-w-[1600px] px-6 xl:px-12"
        >
          <motion.div variants={fadeUpConfig} className="text-center mb-16 space-y-4">
            <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase">{t('landing.featuresLabel')}</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-3xl">{t('landing.featuresTitle')}</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 lg:gap-4 lg:bg-transparent bg-border border-border">
            {/* Card 1 */}
            <motion.div variants={fadeUpConfig} className="h-full">
              <GlowCard className="h-full rounded-none lg:rounded-2xl">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 stroke-[1.5]" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-foreground">{t('landing.feat1Title')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('landing.feat1Desc')}
                  </p>
                </div>
              </GlowCard>
            </motion.div>

            {/* Card 2 */}
            <motion.div variants={fadeUpConfig} className="h-full">
              <GlowCard className="h-full rounded-none lg:rounded-2xl">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                  <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-foreground">{t('landing.feat2Title')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('landing.feat2Desc')}
                  </p>
                </div>
              </GlowCard>
            </motion.div>

            {/* Card 3 */}
            <motion.div variants={fadeUpConfig} className="h-full">
              <GlowCard className="h-full rounded-none lg:rounded-2xl">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40">
                  <MessageSquare className="h-5 w-5 text-violet-600 dark:text-violet-400 stroke-[1.5]" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-foreground">{t('landing.feat3Title')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('landing.feat3Desc')}
                  </p>
                </div>
              </GlowCard>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Service Lines Section */}
      <section id="service-lines" className="pt-24 pb-24 border-t border-border">
        <div className="container mx-auto max-w-4xl 2xl:max-w-6xl px-6 xl:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
            <div className="flex flex-col justify-center space-y-4">
              <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase">{t('landing.slLabel')}</p>
              <h2 className="text-3xl font-bold tracking-tight">{t('landing.slTitle')}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t('landing.slDesc')}
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
      <section id="mobile" className="py-24 border-t border-border overflow-hidden relative">
        <motion.div
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ staggerChildren: 0.1 }}
          className="container mx-auto max-w-5xl 2xl:max-w-7xl px-6 xl:px-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

            {/* Phone mockup */}
            <motion.div variants={fadeUpConfig} className="flex justify-center perspective-1000">
              <TiltWrapper className="w-[240px] cursor-none">
                {/* Outer shell — simulates phone body */}
                <div className="relative rounded-[3rem] border-[10px] border-foreground/15 bg-foreground/15 shadow-2xl shadow-foreground/10 p-[3px]">
                  {/* Inner bezel */}
                  <div className="rounded-[2.2rem] overflow-hidden">
                    <img
                      src={mobileScreenshot}
                      alt="App mobile preview"
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
                {/* Reflection glow */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-36 h-8 bg-blue-500/20 blur-2xl rounded-full" />
              </TiltWrapper>
            </motion.div>

            {/* Text content */}
            <motion.div variants={fadeUpConfig} className="flex flex-col space-y-6">
              <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase">{t('landing.mobileLabel')}</p>
              <h2 className="text-3xl font-bold tracking-tight leading-snug">
                {t('landing.mobileTitle1')}<br />
                <span className="text-blue-600 dark:text-blue-400">{t('landing.mobileTitle2')}</span>
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('landing.mobileDesc')}
              </p>
              <div className="flex flex-col gap-3 pt-2">
                {[
                  { icon: Apple, label: 'iOS', desc: t('landing.iosDesc') },
                  { icon: Smartphone, label: 'Android', desc: t('landing.androidDesc') },
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
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Bottom CTA section */}
      <section className="py-32 border-t border-border bg-background transition-colors duration-300 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/8 dark:bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative container mx-auto max-w-3xl 2xl:max-w-5xl px-6 flex flex-col items-center text-center gap-8 animate-in fade-in duration-1000">
          <img src={logoIcon} alt="Softinsa Learning Hub" className="h-14 w-14 object-contain opacity-90" />

          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.15] text-foreground">
            {t('landing.ctaTitle1')}<br />
            <span className="text-blue-600 dark:text-blue-400">{t('landing.ctaTitle2')}</span>
          </h2>

          <p className="text-muted-foreground text-base max-w-xl leading-relaxed">
            {t('landing.ctaDesc')}
          </p>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="mt-2 h-12 inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white px-12 text-sm font-semibold transition-all active:scale-95 shadow-xl shadow-blue-600/25"
          >
            {t('landing.ctaButton')}
          </button>
        </div>
      </section>

      {/* Extended Footer */}
      <footer className="border-t border-border py-16 bg-background">
        <div className="container mx-auto max-w-6xl 2xl:max-w-[1600px] px-6 xl:px-12">
          <div className="grid grid-cols-2 gap-y-16 lg:grid-cols-4">
            <div className="space-y-5">
              <h3 className="text-xs font-semibold tracking-[0.2em] text-foreground uppercase">Softinsa Learning</h3>
              <p className="text-xs leading-relaxed text-muted-foreground max-w-[200px] font-medium opacity-80">
                {t('landing.footerTagline')}
              </p>
            </div>
            <div className="space-y-5">
              <h3 className="text-xs font-semibold tracking-[0.2em] text-foreground uppercase">{t('landing.footerPlatform')}</h3>
              <ul className="space-y-3 text-xs text-muted-foreground font-medium opacity-80">
                <li className="hover:text-foreground transition-colors cursor-pointer">{t('landing.footerSolutions')}</li>
                <li className="hover:text-foreground transition-colors cursor-pointer">{t('landing.footerCurriculum')}</li>
                <li className="hover:text-foreground transition-colors cursor-pointer">{t('landing.footerAI')}</li>
              </ul>
            </div>
            <div className="space-y-5">
              <h3 className="text-xs font-semibold tracking-[0.2em] text-foreground uppercase">{t('landing.footerResources')}</h3>
              <ul className="space-y-3 text-xs text-muted-foreground font-medium opacity-80">
                <li className="hover:text-foreground transition-colors cursor-pointer">{t('landing.footerSupport')}</li>
                <li className="hover:text-foreground transition-colors cursor-pointer">{t('landing.footerContact')}</li>
                <li className="hover:text-foreground transition-colors cursor-pointer">{t('landing.footerCareers')}</li>
              </ul>
            </div>
            <div className="space-y-5">
              <h3 className="text-xs font-semibold tracking-[0.2em] text-foreground uppercase">{t('landing.footerLegal')}</h3>
              <ul className="space-y-3 text-xs text-muted-foreground font-medium opacity-80">
                <li className="hover:text-foreground transition-colors cursor-pointer">{t('landing.footerPrivacy')}</li>
                <li className="hover:text-foreground transition-colors cursor-pointer">{t('landing.footerTerms')}</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-muted-foreground font-bold tracking-[0.15em] uppercase opacity-40">
            <p>{t('landing.footerCopyright')}</p>
            <p>{t('landing.footerRights')}</p>
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
