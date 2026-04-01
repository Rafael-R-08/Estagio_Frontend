import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { toast } from '@/lib/toast-store';
import { trainingApi } from '@/services/api';
import type { TrainingRecord } from '@/types';

interface Props {
  courses: TrainingRecord[];
  onClose: () => void;
}

export function PendingFeedbackModal({ courses, onClose }: Props) {
  const queryClient = useQueryClient();
  const [list, setList] = useState(courses);

  const updateMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      trainingApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      setList((prev) => prev.filter((c) => c.id !== variables.id));
      toast.success('Feedback registado com sucesso!');
      if (list.length <= 1) onClose(); // if that was the last one, close modal
    },
    onError: () => toast.error('Erro ao registar feedback.'),
  });

  const handleAction = (id: string, action: 'ongoing' | 'past' | 'suggested') => {
    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: any = {};
    if (action === 'ongoing') {
      payload = { status: 'ongoing', startedAt: now };
    } else if (action === 'past') {
      payload = { status: 'completed' };
    } else if (action === 'suggested') {
      payload = { status: 'completed', completedAt: now };
    }
    updateMutation.mutate({ id, payload });
  };

  if (list.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">
            Feedback Pendente
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <p className="text-sm text-foreground/80 mb-4">
            Notámos que acedeste recentemente a estas formações. Confirma o teu estado para mantermos o teu histórico atualizado:
          </p>
          <div className="space-y-3">
            {list.map((course) => (
              <div
                key={course.id}
                className="rounded-lg border border-border bg-muted/20 p-4 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                    {course.title}
                  </h3>
                  {course.platform?.name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {course.platform.name}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0 sm:items-end w-full sm:w-auto">
                  <button
                    onClick={() => handleAction(course.id, 'ongoing')}
                    disabled={updateMutation.isPending}
                    className="w-full sm:w-auto text-left sm:text-center text-xs px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" /> Comecei a fazer
                  </button>
                  <button
                    onClick={() => handleAction(course.id, 'past')}
                    disabled={updateMutation.isPending}
                    className="w-full sm:w-auto text-left sm:text-center text-xs px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:text-emerald-400 font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Calendar className="w-3.5 h-3.5 shrink-0" /> Já tinha feito no passado
                  </button>
                  <button
                    onClick={() => handleAction(course.id, 'suggested')}
                    disabled={updateMutation.isPending}
                    className="w-full sm:w-auto text-left sm:text-center text-xs px-3 py-1.5 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 dark:text-purple-400 font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Fiz após sugestão
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
