import { Grid2X2 } from 'lucide-react';

export default function PlatformsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Plataformas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gere as plataformas de aprendizagem ativas.
        </p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card py-24 text-center">
        <Grid2X2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-1">Plataformas em construção</h3>
        <p className="text-sm text-muted-foreground">
          Toggles de plataformas e configurações de admin aparecerão aqui.
        </p>
      </div>
    </div>
  );
}
