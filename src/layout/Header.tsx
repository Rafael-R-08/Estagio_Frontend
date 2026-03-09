import { useNavigate } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

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
