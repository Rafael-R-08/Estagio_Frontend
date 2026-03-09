import { Shield, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User, ExperienceLevel } from '@/types';

// ─── Avatar ───────────────────────────────────────────────────────────────────

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-md">
      {initials || <UserIcon className="h-8 w-8" />}
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'ADMIN';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        isAdmin
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      )}
    >
      {isAdmin && <Shield className="h-3 w-3" />}
      {isAdmin ? 'Admin' : 'Utilizador'}
    </span>
  );
}

// ─── Level options ────────────────────────────────────────────────────────────

const LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MID', label: 'Mid-level' },
  { value: 'SENIOR', label: 'Senior' },
];

// ─── ProfileHeader ────────────────────────────────────────────────────────────

interface Props {
  user: User;
  draftName: string;
  draftLevel: ExperienceLevel | undefined;
  onNameChange: (v: string) => void;
  onLevelChange: (v: ExperienceLevel | undefined) => void;
}

export function ProfileHeader({ user, draftName, draftLevel, onNameChange, onLevelChange }: Props) {
  return (
    <div className="flex items-start gap-5 rounded-xl border border-border bg-card p-6 shadow-sm">
      <UserAvatar name={draftName || user.name || 'U'} />

      <div className="flex-1 space-y-3">
        {/* Name + badges */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={draftName}
            onChange={(e) => onNameChange(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border-0 bg-transparent text-xl font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-muted/30 px-1 py-0.5"
            placeholder="Nome completo"
          />
          <RoleBadge role={user.role} />
        </div>

        {/* Email */}
        <p className="text-sm text-muted-foreground">{user.email}</p>

        {/* Seniority */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Nível:</span>
          <div className="flex gap-1.5">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => onLevelChange(draftLevel === l.value ? undefined : l.value)}
                className={cn(
                  'rounded-full px-3 py-0.5 text-xs font-medium transition',
                  draftLevel === l.value
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Member since */}
        {user.createdAt && (
          <p className="text-[11px] text-muted-foreground/50">
            Membro desde{' '}
            {new Date(user.createdAt).toLocaleDateString('pt-PT', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  );
}
