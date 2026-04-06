import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { storage } from '../../../lib/storage';
import OnboardingModal from '../components/OnboardingModal';
import logoIcon from '../../../assets/logo2.icon.png';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

interface LoginCardProps {
  onSuccess?: () => void;
  className?: string;
}

export default function LoginCard({ onSuccess, className }: LoginCardProps) {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);

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
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.replace('/dashboard');
        }
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
    setShowPassword((v) => !v);
  };

  return (
    <>
      <OnboardingModal open={showOnboarding} />
      
      <div 
        className={cn(
          "w-full max-w-[420px] bg-background lg:bg-background/80 lg:backdrop-blur-2xl border border-border/60 rounded-[2.5rem] p-8 md:px-12 md:py-10 shadow-2xl shadow-foreground/5 animate-in fade-in slide-in-from-bottom-6 duration-1000",
          className
        )}
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking the card
      >
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src={logoIcon} alt="Softinsa Learning Hub" className="h-14 w-14 object-contain" />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Entrar no <span className="text-blue-600 dark:text-blue-400">LearningHub</span>.
          </h1>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Email */}
            <div className="space-y-2">
              <label className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60" htmlFor="email">Utilizador</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="teu.nome@softinsa.pt"
                  className={cn(
                    'h-12 w-full rounded-full border border-border/80 bg-background lg:bg-transparent pl-11 pr-4 text-sm outline-none transition-all focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-600/10',
                    errors.email && 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                  )}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="px-4 text-[11px] font-medium text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-4">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60" htmlFor="password">Senha</label>
                <Link 
                  to="/forgot-password" 
                  className="text-[10px] font-semibold text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  Esqueceste a palavra-passe?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn(
                    'h-12 w-full rounded-full border border-border/80 bg-background lg:bg-transparent pl-11 pr-12 text-sm outline-none transition-all focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-600/10',
                    errors.password && 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:text-foreground transition-all duration-150"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="px-4 text-[11px] font-medium text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs font-medium text-red-500 text-center animate-in zoom-in-95 duration-300">
                {serverError}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full flex items-center justify-center gap-2 rounded-full bg-blue-600 text-white text-sm font-semibold transition-all hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Entrar na plataforma'
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative py-2.5">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-border/40"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black">
                <span className="bg-background px-4 text-muted-foreground/30">ou</span>
              </div>
            </div>

            {/* Microsoft Login Button */}
            <button
              type="button"
              className="h-12 w-full flex items-center justify-center gap-3 rounded-full border border-border/80 bg-background lg:bg-transparent text-foreground text-sm font-semibold transition-all hover:bg-muted/30 active:scale-[0.98]"
            >
              <svg viewBox="0 0 21 21" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fbb00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a1f1"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffbb00"/>
              </svg>
              <span>Entrar com Microsoft</span>
            </button>
          </form>

          <div className="pt-4 border-t border-border/50 text-center">
            <p className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground uppercase opacity-30">
              Usa as tuas credenciais internas Softinsa
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
