import { useState } from 'react';
import { X, Plus, Target, Award, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserSkill } from '@/types';

interface SkillsSectionProps {
  label: string;
  description?: string;
  skills: UserSkill[];
  onChange: (skills: UserSkill[]) => void;
  isEditing: boolean;
}

const LEVELS = [
  { value: 'iniciante', label: 'Iniciante', icon: Zap, color: 'text-blue-500' },
  { value: 'intermedio', label: 'Intermédio', icon: Target, color: 'text-amber-500' },
  { value: 'experiente', label: 'Experiente', icon: Award, color: 'text-emerald-500' },
] as const;

export function SkillsSection({
  label,
  description,
  skills,
  onChange,
  isEditing,
}: SkillsSectionProps) {
  const [newSkillName, setNewSkillName] = useState('');

  function addSkill() {
    const name = newSkillName.trim();
    if (!name || skills.some(s => s.skillName.toLowerCase() === name.toLowerCase())) return;
    onChange([...skills, { skillName: name, level: 'intermedio' }]);
    setNewSkillName('');
  }

  function removeSkill(name: string) {
    onChange(skills.filter(s => s.skillName !== name));
  }

  function updateLevel(name: string, level: UserSkill['level']) {
    onChange(
      skills.map(s => (s.skillName === name ? { ...s, level } : s))
    );
  }

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">{label}</p>
          {description && <p className="text-[10px] text-muted-foreground/40 mt-1">{description}</p>}
        </div>
        {skills.length === 0 ? (
          <p className="text-xs text-muted-foreground/40 italic py-2 text-center">Nenhuma competência definida.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {skills.map((skill) => {
              const levelInfo = LEVELS.find(l => l.value === skill.level) || LEVELS[1];
              const Icon = levelInfo.icon;
              return (
                <div 
                  key={skill.skillName}
                  className="flex items-center gap-3 rounded-2xl border border-border/40 bg-muted/20 px-4 py-3 transition-all hover:bg-muted/30 group"
                >
                  <div className={cn("p-1.5 rounded-lg bg-background shadow-sm group-hover:scale-110 transition-transform", levelInfo.color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{skill.skillName}</p>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">{levelInfo.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1.5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground/60">{description || "Gere as tuas competências técnicas e níveis de proficiência."}</p>
      </div>

      {/* List of skills in edit mode */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {skills.map((skill) => (
          <div key={skill.skillName} className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/10 p-4 relative group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground uppercase tracking-tight">{skill.skillName}</span>
              <button
                type="button"
                onClick={() => removeSkill(skill.skillName)}
                className="rounded-full p-1 text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex gap-1 p-1 bg-background/50 rounded-xl border border-border/40">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => updateLevel(skill.skillName, l.value as any)}
                  className={cn(
                    "flex-1 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all",
                    skill.level === l.value
                      ? "bg-foreground text-background shadow-lg"
                      : "text-muted-foreground/60 hover:bg-muted/50"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add New Skill Input */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/40">
        <div className="relative flex-1">
          <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            placeholder="Ex: Spring Boot, Figma..."
            className="w-full rounded-xl border border-border/60 bg-background px-10 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
          />
        </div>
        <button
          type="button"
          onClick={addSkill}
          disabled={!newSkillName.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition hover:opacity-90 disabled:opacity-30 disabled:grayscale"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
