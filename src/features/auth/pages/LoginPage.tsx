import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { Eye, EyeOff, Loader2, Mail, Lock, BookOpen, Brain } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { storage } from '../../../lib/storage';
import OnboardingModal from '../components/OnboardingModal';
import logo from '../../../assets/Logo1.png';

// ─── Decorative orb ──────────────────────────────────────────────────────────
function Orb({ className }: { className: string }) {
  return <div className={cn('absolute rounded-full blur-3xl opacity-20 pointer-events-none', className)} />;
}

// ─── Platform badge ───────────────────────────────────────────────────────────
function Badge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="group flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/20 hover:border-white/40 cursor-default select-none">
      <Icon className="h-3.5 w-3.5 text-blue-200" />
      {label}
    </div>
  );
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [passwordRotated, setPasswordRotated] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      setServerError('');
      await login(data.email, data.password);
      if (!storage.getOnboardingSeen()) {
        setShowOnboarding(true);
      } else {
        window.location.replace('/dashboard');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const msg = axiosErr?.response?.data?.message;
      if (Array.isArray(msg)) setServerError(msg.join(', '));
      else if (msg) setServerError(msg);
      else setServerError(axiosErr?.message ?? 'Erro ao iniciar sessão.');
    }
  };

  const togglePassword = () => {
    setPasswordRotated(true);
    setShowPassword((v) => !v);
    setTimeout(() => setPasswordRotated(false), 300);
  };

  return (
    <>
      <OnboardingModal open={showOnboarding} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drift {
          0%   { transform: translate(0,0) rotate(0deg); }
          33%  { transform: translate(18px,-14px) rotate(120deg); }
          66%  { transform: translate(-10px,10px) rotate(240deg); }
          100% { transform: translate(0,0) rotate(360deg); }
        }
        .lh-float      { animation: float 5s ease-in-out infinite; }
        .lh-fade-0     { animation: fadeSlideUp 0.55s 0.00s ease both; }
        .lh-fade-1     { animation: fadeSlideUp 0.55s 0.10s ease both; }
        .lh-fade-2     { animation: fadeSlideUp 0.55s 0.20s ease both; }
        .lh-fade-3     { animation: fadeSlideUp 0.55s 0.30s ease both; }
        .lh-drift      { animation: drift 20s linear infinite; }
        .lh-input:focus { box-shadow: 0 0 0 3px rgba(37,99,235,0.18); border-color: #2563EB; background: #fff; }
        .lh-btn:not(:disabled):hover { box-shadow: 0 10px 30px rgba(27,79,217,0.45); transform: translateY(-1px); }
        .lh-btn { transition: all 0.2s ease; }
      `}</style>

      <div className="flex min-h-screen bg-[#F0F4FF]">

        {/* ── LEFT ───────────────────────────────────────────────────────── */}
        <div
          className="relative hidden lg:flex w-[52%] flex-col items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #060F2B 0%, #0B2362 35%, #1444C0 70%, #2563EB 100%)' }}
        >
          {/* Ambient orbs */}
          <Orb className="w-[480px] h-[480px] bg-blue-500 -top-32 -left-32" />
          <Orb className="w-[360px] h-[360px] bg-indigo-600 bottom-0 -right-24" />
          <Orb className="w-56 h-56 bg-cyan-400 top-1/2 left-1/2 -translate-x-1/2" />

          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}
          />

          {/* Drifting particles */}
          {[
            { size: 3, top: '12%', left: '80%', delay: '0s',  dur: '22s', color: 'rgba(147,197,253,0.5)' },
            { size: 4, top: '70%', left: '15%', delay: '4s',  dur: '18s', color: 'rgba(199,210,254,0.4)' },
            { size: 2, top: '40%', left: '8%',  delay: '8s',  dur: '26s', color: 'rgba(103,232,249,0.5)' },
            { size: 3, top: '85%', left: '70%', delay: '2s',  dur: '20s', color: 'rgba(165,180,252,0.4)' },
          ].map((p, i) => (
            <div
              key={i}
              className="lh-drift absolute rounded-full"
              style={{ width: p.size * 2, height: p.size * 2, top: p.top, left: p.left, background: p.color, animationDuration: p.dur, animationDelay: p.delay }}
            />
          ))}

          {/* Main content */}
          <div className="relative z-10 w-full max-w-md px-16 text-center">

            {/* Logo */}
            <div className="lh-float lh-fade-0 mx-auto mb-8 w-fit rounded-2xl bg-white px-10 py-6 shadow-2xl">
              <img src={logo} alt="Softinsa Learning Hub" className="h-20 w-auto object-contain" />
            </div>

            {/* Title */}
            <h1 className="lh-fade-1 mb-2 text-4xl font-black tracking-tight text-white">
              Softinsa Learning Hub
            </h1>

            {/* Tagline */}
            <p className="lh-fade-2 mb-10 text-base font-light text-blue-200/90 leading-relaxed">
              A tua plataforma inteligente de aprendizagem.<br />
              <span className="font-semibold text-cyan-300">Aprende mais. Alcança mais.</span>
            </p>

            {/* Platform badges */}
            <div className="lh-fade-3 flex flex-wrap justify-center gap-3">
              <Badge icon={BookOpen} label="Microsoft Learn" />
              <Badge icon={Brain}    label="Academia PT Digital" />
            </div>
          </div>

          {/* Bottom dots */}
          <div className="absolute bottom-6 flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={cn('h-1.5 w-1.5 rounded-full', i === 2 ? 'bg-white/60 w-4' : 'bg-white/20')} />
            ))}
          </div>
        </div>

        {/* ── RIGHT ──────────────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-12">
          <div className="lh-fade-0 w-full max-w-md">

            {/* Card */}
            <div className="rounded-3xl bg-white px-10 py-10 shadow-[0_8px_48px_rgba(0,0,0,0.09)] border border-gray-100/80">

              {/* Mobile logo */}
              <div className="mb-8 flex justify-center lg:hidden">
                <img src={logo} alt="Softinsa Learning Hub" className="h-12 w-auto object-contain" />
              </div>

              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
                  Bem‑vindo de volta 
                </h2>
                <p className="text-sm text-gray-400">
                  Inicia sessão para aceder à plataforma.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                {/* Email */}
                <div className="lh-fade-1">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="nome@softinsa.pt"
                      className={cn(
                        'lh-input w-full rounded-xl border bg-gray-50 pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200',
                        errors.email ? 'border-red-400 bg-red-50/50' : 'border-gray-200',
                      )}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="lh-fade-2">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">Palavra-passe</label>
                    <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                      Esqueceste?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className={cn(
                        'lh-input w-full rounded-xl border bg-gray-50 pl-10 pr-12 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200',
                        errors.password ? 'border-red-400 bg-red-50/50' : 'border-gray-200',
                      )}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={togglePassword}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150"
                    >
                      <span
                        className="block transition-transform duration-300"
                        style={{ transform: passwordRotated ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </span>
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
                  )}
                </div>

                {/* Server error */}
                {serverError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {serverError}
                  </div>
                )}

                {/* Submit */}
                <div className="lh-fade-3 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="lh-btn w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #1B4FD9 0%, #2563EB 100%)' }}
                  >
                    {isSubmitting
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> A entrar…</>
                      : 'Iniciar Sessão →'}
                  </button>
                </div>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 border-t border-gray-100" />
                <span className="text-xs text-gray-300 font-medium">ou</span>
                <div className="flex-1 border-t border-gray-100" />
              </div>

              {/* Register link */}
              <p className="text-center text-sm text-gray-500">
                Não tens conta?{' '}
                <Link to="/register" className="font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                  Regista‑te gratuitamente
                </Link>
              </p>
            </div>

            <p className="mt-5 text-center text-xs text-gray-400">
              Plataforma exclusiva para colaboradores Softinsa · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
