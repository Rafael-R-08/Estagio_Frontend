import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Reminder {
  id: string;
  date: string;  // YYYY-MM-DD
  time: string;  // HH:MM
  title: string;
  notified: boolean;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const REMINDERS_KEY = 'lh_reminders';

function loadReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    return raw ? (JSON.parse(raw) as Reminder[]) : [];
  } catch {
    return [];
  }
}

function persistReminders(reminders: Reminder[]): void {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>(loadReminders);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  );

  // Persist whenever reminders change
  useEffect(() => {
    persistReminders(reminders);
  }, [reminders]);

  // Check for due reminders on mount and every minute
  useEffect(() => {
    const check = () => {
      if (notifPermission !== 'granted') return;
      const now = new Date();
      setReminders((prev) =>
        prev.map((r) => {
          if (r.notified) return r;
          const due = new Date(`${r.date}T${r.time}`);
          if (due <= now) {
            new Notification('LearningHub — Lembrete', {
              body: r.title,
              icon: '/icons/icon-192x192.png',
            });
            return { ...r, notified: true };
          }
          return r;
        }),
      );
    };

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [notifPermission]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }, []);

  const addReminder = useCallback((date: string, time: string, title: string) => {
    const reminder: Reminder = {
      id: crypto.randomUUID(),
      date,
      time,
      title,
      notified: false,
    };
    setReminders((prev) => [...prev, reminder]);
  }, []);

  const removeReminder = useCallback((id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const getRemindersForDate = useCallback(
    (date: string) => reminders.filter((r) => r.date === date),
    [reminders],
  );

  const datesWithReminders = new Set(reminders.map((r) => r.date));

  return {
    reminders,
    notifPermission,
    requestPermission,
    addReminder,
    removeReminder,
    getRemindersForDate,
    datesWithReminders,
  };
}
