import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, Check, X, BookOpen, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { softinsaLearningApi } from '@/services/api';
import type { SoftinsaLearningContent, CourseLevel } from '@/types';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS = ['IT', 'HR', 'Marketing', 'Sales', 'Finance', 'Operations', 'General'];
const LEVELS: { value: CourseLevel; label: string }[] = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermédio' },
  { value: 'advanced', label: 'Avançado' },
];

const EMPTY_FORM: Partial<SoftinsaLearningContent> = {
  title: '',
  description: '',
  url: '',
  department: 'IT',
  isMandatory: false,
  skills: [],
  level: 'beginner',
  durationHours: 1,
  hasCertificate: false,
};

// ─── Toggle switch ────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-softinsa-blue/50',
        checked ? 'bg-softinsa-blue' : 'bg-slate-200 dark:bg-slate-600',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}

// ─── Modal Formulario ─────────────────────────────────────────────────────────

function ContentModal({
  open,
  content,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  content: SoftinsaLearningContent | null;
  onClose: () => void;
  onSave: (data: Partial<SoftinsaLearningContent>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<SoftinsaLearningContent>>(() => content || EMPTY_FORM);
  const [skillInput, setSkillInput] = useState('');

  const isEditing = content !== null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title?.trim() || !form.url?.trim() || !form.department?.trim()) {
      toast.error('Título, URL e Departamento são obrigatórios.');
      return;
    }
    onSave(form);
  }

  function handleAddSkill(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !form.skills?.includes(val)) {
        setForm((f) => ({ ...f, skills: [...(f.skills || []), val] }));
        setSkillInput('');
      }
    }
  }

  function removeSkill(skill: string) {
    setForm((f) => ({ ...f, skills: f.skills?.filter((s) => s !== skill) }));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-border bg-card shadow-xl max-h-[90vh]">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-base font-semibold text-foreground">
            {isEditing ? 'Editar Conteúdo' : 'Novo Conteúdo'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="overflow-y-auto px-6 py-5 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Título *</label>
              <input
                type="text"
                value={form.title || ''}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex. Integração Softinsa 2024"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">URL *</label>
              <input
                type="url"
                value={form.url || ''}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://intranet.softinsa..."
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descrição</label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Descrição breve do conteúdo..."
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Departamento *</label>
                <select
                  value={form.department || 'IT'}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nível</label>
                <select
                  value={form.level || 'beginner'}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as CourseLevel }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
                >
                  {LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duração (horas)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={form.durationHours || ''}
                onChange={(e) => setForm((f) => ({ ...f, durationHours: parseFloat(e.target.value) }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Skills (Pressiona Enter)</label>
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder="Ex. React, Cibersegurança..."
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
              />
              {form.skills && form.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.skills.map((skill) => (
                    <span key={skill} className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-foreground">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Obrigatório</p>
                <p className="text-xs text-muted-foreground">Recomendado com prioridade</p>
              </div>
              <ToggleSwitch checked={!!form.isMandatory} onChange={(v) => setForm((f) => ({ ...f, isMandatory: v }))} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Tem Certificado</p>
                <p className="text-xs text-muted-foreground">Emite certificado na conclusão</p>
              </div>
              <ToggleSwitch checked={!!form.hasCertificate} onChange={(v) => setForm((f) => ({ ...f, hasCertificate: v }))} />
            </div>

          </div>

          <div className="shrink-0 flex gap-3 border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-softinsa-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-softinsa-blue/90 disabled:opacity-60 transition-colors"
            >
              {saving ? 'A Guardar...' : isEditing ? 'Guardar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ open, title, onConfirm, onCancel }: { open: boolean; title: string; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h3 className="text-base font-semibold text-foreground">Eliminar "{title}"?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta ação é irreversível. O conteúdo será removido do catálogo.
        </p>
        <div className="mt-5 flex gap-3 justify-end">
          <button onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SoftinsaLearningTab() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SoftinsaLearningContent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SoftinsaLearningContent | null>(null);

  const { data: contents = [], isLoading } = useQuery({
    queryKey: ['admin', 'softinsa-learning'],
    queryFn: async () => {
      const res = await softinsaLearningApi.getAll();
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => softinsaLearningApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'softinsa-learning'] });
      toast.success('Conteúdo criado.');
      setModalOpen(false);
    },
    onError: () => toast.error('Erro ao criar conteúdo.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => softinsaLearningApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'softinsa-learning'] });
      toast.success('Conteúdo atualizado.');
      setEditing(null);
      setModalOpen(false);
    },
    onError: () => toast.error('Erro ao atualizar conteúdo.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => softinsaLearningApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'softinsa-learning'] });
      toast.success('Conteúdo eliminado.');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Erro ao eliminar conteúdo.'),
  });

  function handleSave(data: Partial<SoftinsaLearningContent>) {
    // Cast para garantirmos que obedece ao Dto. Backend valida os required objects.
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  const filtered = contents.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.department.toLowerCase().includes(search.toLowerCase())
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Back & Toolbar */}
      <div className="flex flex-col gap-4">
        <div>
          <button
            onClick={() => navigate('?tab=platforms')}
            className="flex w-fit items-center gap-1.5 rounded-lg pr-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar a Plataformas
          </button>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
            />
          </div>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-xl bg-softinsa-blue px-4 py-2 text-sm font-medium text-white hover:bg-softinsa-blue/90 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Adicionar conteúdo
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Título</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dep.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nível</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Obrigatório</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Nenhum conteúdo encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-softinsa-blue/10 text-softinsa-blue">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-foreground line-clamp-1" title={c.title}>{c.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-muted px-2 py-1 text-xs font-medium text-foreground">
                        {c.department}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
                      {LEVELS.find((l) => l.value === c.level)?.label || c.level || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.isMandatory
                        ? <Check className="h-4 w-4 text-green-500" />
                        : <X className="h-4 w-4 text-muted-foreground/40" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setEditing(c); setModalOpen(true); }}
                          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/40 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length > 0 && (
          <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            {filtered.length} conteúdo{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Modals */}
      <ContentModal
        open={modalOpen}
        content={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        saving={isSaving}
      />

      <DeleteConfirm
        open={deleteTarget !== null}
        title={deleteTarget?.title ?? ''}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
