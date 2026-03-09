import { Shield } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestão de utilizadores, plataformas e analytics.
        </p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card py-24 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-1">Backoffice em construção</h3>
        <p className="text-sm text-muted-foreground">
          Tabelas de utilizadores, configuração de plataformas e dashboards de analytics aparecerão aqui.
        </p>
      </div>
    </div>
  );
}
