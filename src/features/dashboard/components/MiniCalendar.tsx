import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isToday,
  getDay,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, X, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { calendarApi } from '@/services/api';
import type { CalendarEvent } from '@/types';

// ─── Weekday labels (Monday-first) ───────────────────────────────────────────

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// ─── Component ────────────────────────────────────────────────────────────────

export function MiniCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd'),
  );
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [showForm, setShowForm] = useState(false);

  const qc = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => calendarApi.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (dto: Parameters<typeof calendarApi.create>[0]) => calendarApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar-events'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => calendarApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar-events'] }),
  });

  // Days in current month
  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

  // Leading empty cells so the grid starts on Monday
  const leadingBlanks = (getDay(startOfMonth(currentMonth)) + 6) % 7;

  // Group events by date (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const dateKey = ev.eventDate.slice(0, 10);
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(ev);
    }
    return map;
  }, [events]);

  const datesWithEvents = useMemo(() => new Set(eventsByDate.keys()), [eventsByDate]);
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];

  const handleDateSelect = (iso: string) => {
    setSelectedDate(iso);
    setShowForm(false);
    setNewTitle('');
    setNewTime('09:00');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    // Combine selected date + time into ISO datetime
    const eventDate = new Date(`${selectedDate}T${newTime}:00`);
    createMutation.mutate({ title: newTitle.trim(), eventDate: eventDate.toISOString() });
    setNewTitle('');
    setNewTime('09:00');
    setShowForm(false);
  };

  return (
    <div className="rounded-[2.5rem] border border-border/40 bg-card/40 backdrop-blur-xl p-6 shadow-xl shadow-foreground/5 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 shrink-0">
          <CalendarDays className="h-4 w-4" />
        </div>
        <div className="space-y-0.5 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Lembretes
          </p>
          <p className="text-sm font-bold text-foreground leading-none">Calendário</p>
        </div>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />}
      </div>

      {/* ── Month navigation ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="p-1.5 rounded-xl hover:bg-muted/50 transition-colors"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs font-bold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: pt })}
        </span>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="p-1.5 rounded-xl hover:bg-muted/50 transition-colors"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Weekday headers ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-7 text-center mb-1">
        {WEEKDAYS.map((d) => (
          <span key={d} className="text-[9px] font-bold uppercase text-muted-foreground/50">
            {d[0]}
          </span>
        ))}
      </div>

      {/* ── Day grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const iso = format(day, 'yyyy-MM-dd');
          const hasEvent = datesWithEvents.has(iso);
          const isSelected = iso === selectedDate;
          const today = isToday(day);

          return (
            <button
              key={iso}
              onClick={() => handleDateSelect(iso)}
              className={cn(
                'relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium transition-all',
                isSelected && !today && 'bg-blue-600 text-white',
                today && !isSelected && 'ring-1 ring-primary text-primary font-bold',
                today && isSelected && 'bg-primary text-white',
                !isSelected && !today && 'hover:bg-muted/50 text-foreground/70',
              )}
            >
              {format(day, 'd')}
              {hasEvent && (
                <span
                  className={cn(
                    'absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full',
                    isSelected ? 'bg-background' : 'bg-primary',
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Day detail ───────────────────────────────────────────────────── */}
      <div className="border-t border-border/40 mt-4 pt-4 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
          {format(parseISO(selectedDate), "d 'de' MMMM", { locale: pt })}
        </p>

        {/* Events list */}
        {selectedEvents.length === 0 && !showForm ? (
          <p className="text-[11px] text-muted-foreground/40 text-center py-1">
            Sem lembretes para este dia
          </p>
        ) : (
          <ul className="space-y-1.5">
            {selectedEvents.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center gap-2 rounded-xl bg-muted/20 border border-border/30 px-3 py-2"
              >
                <span className="text-[10px] font-bold text-muted-foreground w-10 shrink-0 tabular-nums">
                  {format(parseISO(ev.eventDate), 'HH:mm')}
                </span>
                <span className="text-xs text-foreground flex-1 truncate">{ev.title}</span>
                <button
                  onClick={() => removeMutation.mutate(ev.id)}
                  disabled={removeMutation.isPending}
                  className="text-muted-foreground/30 hover:text-destructive transition-colors shrink-0 disabled:opacity-30"
                  aria-label="Remover lembrete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Collapsible add form */}
        {showForm ? (
          <form
            onSubmit={handleAdd}
            className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título do lembrete…"
              maxLength={80}
              className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
            />
            <div className="flex gap-2">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex-1 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
              />
              <button
                type="button"
                onClick={() => { setShowForm(false); setNewTitle(''); setNewTime('09:00'); }}
                className="p-2 rounded-xl border border-border/60 text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors"
                aria-label="Cancelar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim() || createMutation.isPending}
                className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="h-3.5 w-3.5" />
                Guardar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/60 py-2 text-[11px] font-medium text-muted-foreground/50 hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo lembrete
          </button>
        )}
      </div>
    </div>
  );
}
