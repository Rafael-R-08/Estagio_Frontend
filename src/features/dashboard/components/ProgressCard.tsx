import { ExternalLink, Clock, Star, BookOpen, FileText, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrainingRecord, TrainingStatus } from '@/types';
import { trainingApi } from '@/services/api';
import { toast } from 'sonner';
import { useState } from 'react';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TrainingStatus, { label: string; className: string }> = {
  ongoing: { label: 'Em progresso', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  completed: { label: 'Concluído', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  priority: { label: 'Prioritário', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  later: { label: 'Guardado', className: 'bg-muted text-muted-foreground' },
  accessed: { label: 'Acedido', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};


// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ProgressCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex justify-between">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="h-3 w-1/3 rounded bg-muted" />
      <div className="h-2 w-full rounded-full bg-muted" />
      <div className="flex justify-between">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-7 w-24 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface ProgressCardProps {
  record: TrainingRecord;
  variant?: 'progress' | 'saved' | 'completed';
  onUpdate?: () => void;
}

export function ProgressCard({ record, variant = 'progress', onUpdate }: ProgressCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const status = STATUS_CONFIG[record.status] ?? STATUS_CONFIG.later;
  const platform = record.platform?.name ?? 'Plataforma desconhecida';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await trainingApi.uploadDocument(record.id, file);
      toast.success('Documento carregado com sucesso!');
      onUpdate?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao carregar documento.');
    } finally {
      setIsUploading(false);
    }
  };

  const dateLabel = (() => {
    if (variant === 'completed' && record.completedAt) {
      return `Concluído em ${new Date(record.completedAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}`;
    }
    if (record.startedAt) {
      return `Iniciado em ${new Date(record.startedAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}`;
    }
    if (record.createdAt) {
      return `Guardado em ${new Date(record.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}`;
    }
    return null;
  })();

  return (
    <div className="group flex flex-col gap-4 rounded-[2rem] border border-border/60 bg-background/40 backdrop-blur-md p-6 transition-all duration-300 hover:shadow-lg hover:shadow-foreground/5 hover:border-border hover:-translate-y-0.5">
      {/* Title + badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-semibold text-foreground leading-snug line-clamp-2"
            title={record.title}
          >
            {record.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
            <BookOpen className="h-3 w-3 shrink-0" />
            <span className="truncate">{platform}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.05em] border border-border/40', status.className)}>
            {status.label}
          </span>
          {variant === 'saved' && record.priorityOrder !== undefined && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full border border-amber-200/50">
              Prio: {record.priorityOrder}
            </span>
          )}
        </div>
      </div>

      {/* Ongoing details */}
      {variant === 'progress' && (() => {
        const level = record.progressLevel?.toLowerCase();
        const stages = [
          { id: 'inicio', label: 'Início' },
          { id: 'meio', label: 'Meio' },
          { id: 'finalizar', label: 'Finalizar' },
        ];
        const percentage =
          level === 'início' || level === 'inicio' ? 25 :
          level === 'meio' ? 55 :
          level === 'finalizar' ? 90 : 0;
        const activeLabel =
          level === 'início' || level === 'inicio' ? 'Início' :
          level === 'meio' ? 'Meio' :
          level === 'finalizar' ? 'Finalizar' : 'Não iniciado';

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-semibold text-muted-foreground uppercase tracking-tight">Progresso</span>
              <span className="font-bold text-primary">{activeLabel}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex gap-1">
              {stages.map((s) => (
                <span
                  key={s.id}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[10px] font-bold',
                    record.progressLevel === s.id || record.progressLevel?.toLowerCase() === s.label.toLowerCase()
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted/50 text-muted-foreground'
                  )}
                >
                  {s.label}
                </span>
              ))}
            </div>
            {record.notes && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 italic">"{record.notes}"</p>
            )}
          </div>
        );
      })()}

      {/* Completed details */}
      {variant === 'completed' && (
        <div className="space-y-3 border-t border-border/20 pt-3">
          <div className="flex items-center gap-4">
            {record.rating && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Rating</span>
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-2.5 w-2.5", i < record.rating! ? "fill-current" : "text-muted")} />
                  ))}
                </div>
              </div>
            )}
            {record.relevance && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Relevância</span>
                <div className="flex items-center gap-0.5 text-blue-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-2.5 w-2.5", i < record.relevance! ? "fill-current" : "text-muted")} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {record.documents && record.documents.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Documentos</span>
              <div className="flex flex-wrap gap-1.5">
                {record.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-[10px] text-foreground hover:bg-muted transition-colors"
                  >
                    <FileText className="h-3 w-3 text-primary/60" />
                    <span className="max-w-[100px] truncate">{doc.fileName}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/10 mt-auto">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
          {dateLabel && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 opacity-60" />
              {dateLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {variant === 'progress' && (
            <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              <Upload className={cn("h-3.5 w-3.5", isUploading && "animate-bounce")} />
            </label>
          )}
          <a
            href={record.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            {variant === 'progress' ? 'Continuar' : 'Ver curso'}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
