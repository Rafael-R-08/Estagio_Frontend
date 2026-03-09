import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Download,
  Trash2,
  Upload,
  FileText,
  Save,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { toast } from '@/lib/toast-store';
import { certificatesApi } from '@/services/api';
import { cn } from '@/lib/utils';
import type { Certificate, UpdateCertificateDto } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPdf(url: string) {
  return url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf');
}

function fmtDateInput(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

// ─── CertificateDetailModal ───────────────────────────────────────────────────

interface Props {
  cert: Certificate;
  onClose: () => void;
  onReplace: () => void;
}

export function CertificateDetailModal({ cert, onClose, onReplace }: Props) {
  const queryClient = useQueryClient();

  const [meta, setMeta] = useState<UpdateCertificateDto>({
    courseName:     cert.courseName,
    provider:       cert.provider,
    completionDate: cert.completionDate,
    expirationDate: cert.expirationDate,
    durationHours:  cert.durationHours,
  });
  const [dirty, setDirty] = useState(false);

  function setField<K extends keyof UpdateCertificateDto>(k: K, v: UpdateCertificateDto[K]) {
    setMeta((m: UpdateCertificateDto) => ({ ...m, [k]: v }));
    setDirty(true);
  }

  // ── Update metadata ──────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: () => certificatesApi.update(cert.id, meta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('Metadados actualizados.');
      setDirty(false);
    },
    onError: () => toast.error('Erro ao guardar alterações.'),
  });

  // ── Re-extract with AI ───────────────────────────────────────────────
  const reextractMutation = useMutation({
    mutationFn: () => certificatesApi.reextract(cert.id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      const data = res.data;
      setMeta({
        courseName:     data.courseName,
        provider:       data.provider,
        completionDate: data.completionDate,
        expirationDate: data.expirationDate,
        durationHours:  data.durationHours,
      });
      toast.success('Metadados re-extraídos com IA.');
      setDirty(false);
    },
    onError: () => toast.error('Erro ao re-extrair metadados.'),
  });

  // ── Delete ────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () => certificatesApi.delete(cert.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('Certificado eliminado.');
      onClose();
    },
    onError: () => toast.error('Erro ao eliminar certificado.'),
  });

  const isLoading = updateMutation.isPending || reextractMutation.isPending || deleteMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Detalhe do Certificado</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto p-5 md:flex-row md:max-h-[80vh]">
          {/* ── Left: thumbnail + actions ── */}
          <div className="flex flex-col gap-3 md:w-56 md:shrink-0">
            {/* Preview */}
            <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
              {isPdf(cert.fileUrl) ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2">
                  <FileText className="h-12 w-12 text-red-400" />
                  <span className="text-xs text-muted-foreground">PDF</span>
                </div>
              ) : (
                <img
                  src={cert.fileUrl}
                  alt="Certificado"
                  className="h-40 w-full object-contain"
                />
              )}
            </div>

            {/* Action buttons */}
            <a
              href={cert.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Descarregar
            </a>
            <a
              href={cert.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir
            </a>
            <button
              onClick={onReplace}
              className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <Upload className="h-4 w-4" />
              Substituir
            </button>
            <button
              onClick={() => reextractMutation.mutate()}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
            >
              <Sparkles className={cn('h-4 w-4 text-primary/70', reextractMutation.isPending && 'animate-pulse')} />
              Re-extrair IA
            </button>
            <button
              onClick={() => {
                if (confirm('Eliminar este certificado? Esta acção não pode ser revertida.')) {
                  deleteMutation.mutate();
                }
              }}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-lg border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          </div>

          {/* ── Right: metadata ── */}
          <div className="flex-1 space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Formação</p>
              <p className="text-sm text-foreground">{cert.training?.title ?? '—'}</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Metadados</p>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Nome do curso</label>
                <input
                  type="text"
                  value={meta.courseName ?? ''}
                  onChange={(e) => setField('courseName', e.target.value || undefined)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Plataforma / Emissor</label>
                <input
                  type="text"
                  value={meta.provider ?? ''}
                  onChange={(e) => setField('provider', e.target.value || undefined)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Data de conclusão</label>
                  <input
                    type="date"
                    value={fmtDateInput(meta.completionDate)}
                    onChange={(e) => setField('completionDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Data de expiração</label>
                  <input
                    type="date"
                    value={fmtDateInput(meta.expirationDate)}
                    onChange={(e) => setField('expirationDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Horas de formação</label>
                <input
                  type="number"
                  min="0"
                  value={meta.durationHours ?? ''}
                  onChange={(e) => setField('durationHours', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Save footer */}
            {dirty && (
              <div className="sticky bottom-0 flex justify-end border-t border-border bg-card pt-3">
                <button
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? 'A guardar…' : 'Guardar alterações'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
