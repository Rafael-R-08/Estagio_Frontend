import { useParams, Link } from 'react-router-dom';
import { useSlManagerUserProgress } from '../hooks/useSlManagerUserProgress';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, BookOpen, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTranslation } from 'react-i18next';

export default function SlManagerUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: timeline, isLoading, error } = useSlManagerUserProgress(id!);
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !timeline) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center gap-4 text-destructive">
        <p>Error loading colleague's learning progress.</p>
        <Button variant="outline" asChild>
          <Link to="/sl-manager">Back to My Team</Link>
        </Button>
      </div>
    );
  }

  const completed = timeline?.filter((t: any) => t.status === 'completed') || [];
  const ongoing = timeline?.filter((t: any) => t.status === 'ongoing') || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 border border-border/60 bg-background/60 backdrop-blur-xl hover:bg-foreground hover:text-background transition-all">
          <Link to="/sl-manager">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl leading-tight">
            {t('slManager.colleagueDetails', 'Detalhes de Progresso')}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Timeline detalhada de aprendizagem e conquistas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-[2.5rem] border border-border/60 bg-background/60 p-8 shadow-2xl backdrop-blur-2xl transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-emerald-500 text-white shadow-lg">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Concluído</p>
              <p className="text-4xl font-black tracking-tighter text-foreground">{completed.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[2.5rem] border border-border/60 bg-background/60 p-8 shadow-2xl backdrop-blur-2xl transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-blue-500 text-white shadow-lg">
              <BookOpen className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Em Curso</p>
              <p className="text-4xl font-black tracking-tighter text-foreground">{ongoing.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-border/60 bg-background/60 shadow-2xl backdrop-blur-2xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border/60 p-6 bg-background/40">
          <div className="flex h-10 w-10 items-center justify-center rounded-[0.8rem] bg-foreground text-background shadow-lg">
            <Calendar className="h-5 w-5" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Timeline de Formações</h2>
        </div>
        
        <div className="p-8">
          {timeline.length === 0 ? (
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 py-10">
              Sem registos de aprendizagem encontrados.
            </p>
          ) : (
            <div className="space-y-6">
              {timeline.map((item: any) => (
                <div key={item.id} className="group relative flex flex-col gap-4 rounded-[2rem] border border-border/40 bg-background/40 p-6 transition-all hover:bg-background/80 hover:shadow-xl active:scale-[0.99]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-lg font-black tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">{item.title}</h3>
                      <div className="flex items-center flex-wrap gap-2 mt-2">
                        {item.platform?.name && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{item.platform.name}</span>
                        )}
                        <span className={cn(
                          'rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm',
                          item.status === 'completed' ? 'bg-emerald-500 text-white' : 
                          item.status === 'ongoing' ? 'bg-blue-500 text-white' : 
                          'bg-background/40 border border-border/60 text-muted-foreground'
                        )}>
                          {item.status === 'completed' ? 'Concluído' : item.status === 'ongoing' ? 'Em Curso' : item.status}
                        </span>
                      </div>
                    </div>
                    <a href={item.url} target="_blank" rel="noreferrer" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background/40 border border-border/60 text-muted-foreground hover:bg-foreground hover:text-background transition-all">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                    {(item.startedAt || item.completedAt) && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {item.startedAt && new Date(item.startedAt).toLocaleDateString()}
                          {item.startedAt && item.completedAt ? ' — ' : ''}
                          {item.completedAt && new Date(item.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {item.durationHours && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>{item.durationHours} Horas</span>
                      </div>
                    )}
                    {item.rating && (
                      <div className="flex items-center gap-2 text-amber-500">
                        <span className="text-lg leading-none">★</span>
                        <span>{item.rating} / 5</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
