import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logoIcon from '../../../assets/logo2.icon.png';
import mobileScreenshot from '../../../assets/mobile2.png';
import pcScreenshot from '../../../assets/pc.png';
import { Moon, Sun, Sparkles, BadgeCheck, MessageSquare, X, Smartphone, Apple } from 'lucide-react';
import { applyTheme } from '../../../utils/theme';
import LoginCard from '../../auth/components/LoginCard';
import 'flag-icons/css/flag-icons.min.css';

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
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
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
      <section className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-7xl w-full">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 items-center">

            {/* Left: Text content */}
            <div className="flex flex-col items-center xl:items-start text-center xl:text-left space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
              <div className="border border-border rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground tracking-tight select-none">
                {t('landing.badge')}
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground">
                {t('landing.heroLine1')}<br />
                <span className="text-blue-600 dark:text-blue-400">{t('landing.heroLine2')}</span>.
              </h1>

              <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
                {t('landing.heroDesc')}
              </p>

              <div className="flex flex-wrap gap-4 justify-center xl:justify-start pt-4">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="h-12 inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white px-10 text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                >
                  {t('landing.cta')}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center xl:justify-start gap-10 pt-2 border-t border-border/40 w-full max-w-md">
                {[
                  { value: '6+', label: t('landing.stat1') },
                  { value: t('landing.statAI'), label: t('landing.stat2') },
                  { value: 'PWA', label: t('landing.stat3') },
                ].map(({ value, label }) => (
                  <div key={label} className="flex flex-col items-center gap-0.5">
                    <span className="text-sm font-black text-foreground tracking-tight">{value}</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: PC mockup (only on xl+) */}
            <div className="hidden xl:flex justify-center items-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 ease-out">
              <div className="relative w-full max-w-[600px]">
                {/* Screen bezel */}
                <div className="relative rounded-2xl border-[10px] border-foreground/15 bg-foreground/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden">
                  <img
                    src={pcScreenshot}
                    alt="App desktop preview"
                    className="w-full h-auto block"
                  />
                </div>
                {/* Stand neck */}
                <div className="mx-auto w-20 h-5 bg-foreground/10 border-x-[8px] border-foreground/12" />
                {/* Stand base */}
                <div className="mx-auto w-44 h-3 rounded-full bg-foreground/10 border border-foreground/12" />
                {/* Glow */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-64 h-10 bg-blue-500/15 blur-3xl rounded-full pointer-events-none" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Search/Platforms Section */}
      <section id="platforms" className="py-24 border-t border-border bg-background select-none">
        <div className="container mx-auto max-w-7xl px-6 flex flex-col items-center gap-16 animate-in fade-in duration-1000">
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
        </div>
      </section>

      {/* Features section (Grid Divider Trick) */}
      <section id="features" className="pt-24 pb-24 border-t border-border">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-16 space-y-4">
            <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase">{t('landing.featuresLabel')}</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-3xl">{t('landing.featuresTitle')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border overflow-hidden">
            {/* Card 1 */}
            <div className="bg-background p-10 flex flex-col gap-6 transition-colors hover:bg-muted/30 group">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 stroke-[1.5]" />
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-foreground">{t('landing.feat1Title')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('landing.feat1Desc')}
                </p>
              </div>
            </div>
            {/* Card 2 */}
            <div className="bg-background p-10 flex flex-col gap-6 transition-colors hover:bg-muted/30 group">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-foreground">{t('landing.feat2Title')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('landing.feat2Desc')}
                </p>
              </div>
            </div>
            {/* Card 3 */}
            <div className="bg-background p-10 flex flex-col gap-6 transition-colors hover:bg-muted/30 group">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40">
                <MessageSquare className="h-5 w-5 text-violet-600 dark:text-violet-400 stroke-[1.5]" />
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-foreground">{t('landing.feat3Title')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('landing.feat3Desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Lines Section */}
      <section id="service-lines" className="pt-24 pb-24 border-t border-border">
        <div className="container mx-auto max-w-4xl px-6">
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
      <section id="mobile" className="py-24 border-t border-border overflow-hidden">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

            {/* Phone mockup */}
            <div className="flex justify-center">
              <div className="relative w-[240px]">
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
              </div>
            </div>

            {/* Text content */}
            <div className="flex flex-col space-y-6">
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
        <div className="container mx-auto max-w-6xl px-6">
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
