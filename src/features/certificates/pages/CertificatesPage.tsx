import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Award, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { certificatesApi, trainingApi } from '@/services/api';
import { toList } from '@/lib/api';
import type { Certificate } from '@/types';

import { CertificateCard, CertificateCardSkeleton } from '../components/CertificateCard';
import { UploadModal } from '../components/UploadModal';
import { CertificateDetailModal } from '../components/CertificateDetailModal';

// ─── Status helper ────────────────────────────────────────────────────────────

function getCertStatus(cert: Certificate, now: number) {
  if (!cert.expirationDate) return 'active' as const;
  const diff = new Date(cert.expirationDate).getTime() - now;
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < 0) return 'expired' as const;
  if (days <= 30) return 'expiring' as const;
  return 'active' as const;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasSearch, onUpload }: { hasSearch: boolean; onUpload: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        {hasSearch
          ? <Search className="h-8 w-8 text-muted-foreground/40" />
          : <Award className="h-8 w-8 text-muted-foreground/40" />}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {hasSearch ? t('certificates.empty.noResultsTitle') : t('certificates.empty.noCertsTitle')}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {hasSearch
            ? t('certificates.empty.noResultsDesc')
            : t('certificates.empty.noCertsDesc')}
        </p>
      </div>
      {!hasSearch && (
        <button
          onClick={onUpload}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          {t('certificates.uploadBtn')}
        </button>
      )}
    </div>
  );
}

// ─── CertificatesPage ─────────────────────────────────────────────────────────

export default function CertificatesPage() {
  const { t } = useTranslation();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState<Certificate | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');

  // ── Data ────────────────────────────────────────────────────────────────
  const { data: certs = [], isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => certificatesApi.getAll().then((r) => toList(r.data)),
    staleTime: 1000 * 60 * 2,
  });

  const { data: trainings = [] } = useQuery({
    queryKey: ['trainings', 'all'],
    queryFn: () => trainingApi.getAll().then((r) => toList(r.data)),
    staleTime: 1000 * 60 * 2,
  });

  // ── Client-side filter ──────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/purity
  const now = useMemo(() => Date.now(), []);

  const filtered = certs.filter((c) => {
    const matchSearch =
      !search ||
      (c.courseName ?? c.training?.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.provider ?? '').toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === 'all' || getCertStatus(c, now) === statusFilter;

    return matchSearch && matchStatus;
  });

  // ── Counts for filter pills ──────────────────────────────────────────────
  const counts = {
    all:      certs.length,
    active:   certs.filter((c) => getCertStatus(c, now) === 'active').length,
    expiring: certs.filter((c) => getCertStatus(c, now) === 'expiring').length,
    expired:  certs.filter((c) => getCertStatus(c, now) === 'expired').length,
  };

  const FILTERS: { id: typeof statusFilter; label: string }[] = [
    { id: 'all',      label: t('certificates.filters.all') },
    { id: 'active',   label: t('certificates.filters.active') },
    { id: 'expiring', label: t('certificates.filters.expiring') },
    { id: 'expired',  label: t('certificates.filters.expired') },
  ];

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">{t('certificates.title')}</h1>
          <p className="mt-1 text-base text-muted-foreground">
            {t('certificates.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="shrink-0 flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background shadow-2xl transition active:scale-95"
        >
          <Plus className="h-4 w-4" />
          {t('certificates.uploadBtn')}
        </button>
      </div>

      {/* ── Search + filter bar ── */}
      {certs.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('certificates.search')}
              className="h-12 w-full rounded-full border border-border/60 bg-muted/40 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-4 focus:ring-foreground/10"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-2">
            {FILTERS.map((f) => {
              const isActive = statusFilter === f.id;
              const count = counts[f.id];
              if (f.id !== 'all' && count === 0) return null;
              return (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                    isActive
                      ? 'bg-foreground text-background shadow-xl'
                      : 'bg-background/40 border border-border/60 text-muted-foreground hover:bg-background/80'
                  }`}
                >
                  {f.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                    isActive ? 'bg-background text-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Result count ── */}
      {!isLoading && certs.length > 0 && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {t('certificates.count', { count: filtered.length })}
          {statusFilter !== 'all' || search ? ` ${t('certificates.filtered')}` : ''}
        </p>
      )}

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <CertificateCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          hasSearch={!!(search || statusFilter !== 'all')}
          onUpload={() => setUploadOpen(true)}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CertificateCard key={c.id} cert={c} onClick={() => setSelected(c)} />
          ))}
        </div>
      )}

      {/* ── Upload Modal ── */}
      {uploadOpen && (
        <UploadModal
          trainings={trainings}
          onClose={() => setUploadOpen(false)}
          onSuccess={() => setUploadOpen(false)}
        />
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <CertificateDetailModal
          cert={selected}
          onClose={() => setSelected(null)}
          onReplace={() => {
            setSelected(null);
            setUploadOpen(true);
          }}
        />
      )}
    </div>
  );
}
