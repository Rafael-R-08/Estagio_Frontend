import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, Sparkles } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';

const AI_TIPS = [
  'Completa um curso hoje e mantém o teu streak ativo.',
  'Os teus certificados expiram? Verifica em Certificados.',
  'Usa o Assistente IA para pedir recomendações personalizadas.',
  'Adiciona skills ao teu perfil para melhores sugestões.',
  'Cursos curtos de 1h são ideais para aprendizagem diária.',
  'Pesquisa por tema e filtra por plataforma para melhores resultados.',
  'Marca formações como Prioridade para as encontrar rapidamente.',
];

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tipIndex, setTipIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setTipIndex((i) => (i + 1) % AI_TIPS.length);
        setVisible(true);
      }, 400);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* IA status + dica rotativa */}
      <div className="hidden sm:flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <Sparkles className="h-3.5 w-3.5 text-softinsa-blue" />
          <span className="text-xs font-medium text-softinsa-blue whitespace-nowrap">IA Ativa</span>
        </div>
        <span className="text-muted-foreground/40 text-xs">·</span>
        <span
          className="text-xs text-muted-foreground truncate max-w-xs transition-opacity duration-400"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {AI_TIPS[tipIndex]}
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notificações */}
        <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          {/* Badge exemplo */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-softinsa-error" />
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          title={user?.name}
        >
          {user?.name?.charAt(0).toUpperCase() ?? 'U'}
        </button>
      </div>
    </header>
  );
}
