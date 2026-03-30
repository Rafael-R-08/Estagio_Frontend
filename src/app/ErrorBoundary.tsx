import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Frontend Crashed:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 bg-background/50 backdrop-blur-3xl">
          <div className="rounded-full bg-destructive/10 p-6 mb-6">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            A aplicação encontrou uma falha de visualização.
          </h1>
          <p className="mb-8 max-w-lg text-muted-foreground font-medium">
            Ocorreu um erro no módulo atual. Tenta recarregar a sessão se o problema persistir.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button 
              onClick={() => window.location.reload()} 
              className="rounded-full bg-foreground text-background px-6 py-3 text-sm font-bold hover:opacity-90 transition-all shadow-xl"
            >
              Recarregar Ecrã
            </button>
            <button 
              onClick={() => window.location.href = '/'} 
              className="flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-bold text-foreground hover:bg-muted transition-all"
            >
              <Home className="h-4 w-4" />
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
