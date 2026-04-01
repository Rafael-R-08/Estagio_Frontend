import { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  CheckCircle2, 
  Star, 
  Trophy,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrainingRecord } from '@/types';

interface CompletionModalProps {
  training: TrainingRecord;
  onClose: () => void;
  onConfirm: (rating: number, relevance: number) => void;
  isSubmitting?: boolean;
}

function StarRating({ 
  value, 
  onChange, 
  label, 
  icon: Icon 
}: { 
  value: number; 
  onChange: (v: number) => void; 
  label: string;
  icon: any;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-foreground font-bold italic">
        <Icon className="h-4 w-4 text-primary" />
        <h4 className="text-sm">{label}</h4>
      </div>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className="transition-all duration-200 active:scale-90"
          >
            <Star 
              className={cn(
                "h-8 w-8 transition-colors",
                active >= n 
                  ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" 
                  : "text-muted-foreground/20"
              )}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-xs font-black text-amber-500 tabular-nums bg-amber-500/10 px-2 py-1 rounded-lg">
            {value}/5
          </span>
        )}
      </div>
    </div>
  );
}

export function CompletionModal({ training, onClose, onConfirm, isSubmitting }: CompletionModalProps) {
  const [rating, setRating] = useState(0);
  const [relevance, setRelevance] = useState(0);

  const canConfirm = rating > 0 && relevance > 0;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-6">
      <div 
        className="w-full max-w-md bg-card border border-border shadow-2xl rounded-[2rem] flex flex-col animate-in fade-in zoom-in duration-200"
      >
        {/* Header with celebration icon */}
        <div className="relative px-8 pt-10 pb-6 text-center border-b border-border/40 bg-muted/10 rounded-t-[2rem]">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 h-16 w-16 bg-primary rounded-xl shadow-xl shadow-primary/20 flex items-center justify-center text-primary-foreground transform rotate-6 hover:rotate-0 transition-transform duration-500">
            <Trophy className="h-8 w-8" />
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="mt-4 space-y-1">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Parabéns pela Conclusão!</h2>
            <p className="font-bold text-xl text-foreground tracking-tight leading-tight">{training.title}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          <p className="text-xs text-muted-foreground leading-relaxed font-medium text-center px-4">
            Antes de guardarmos esta conquista, por favor avalia o curso para ajudar a IA a recomendar melhores conteúdos.
          </p>

          <div className="space-y-8">
            <StarRating 
              label="Avaliação Geral" 
              value={rating} 
              onChange={setRating} 
              icon={Star} 
            />
            
            <StarRating 
              label="Relevância para a tua função" 
              value={relevance} 
              onChange={setRelevance} 
              icon={Target} 
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-border/40 bg-muted/5 flex flex-col gap-3 rounded-b-[2rem]">
          <button 
            disabled={!canConfirm || isSubmitting}
            onClick={() => onConfirm(rating, relevance)}
            className={cn(
              "w-full py-4 rounded-xl text-[13px] font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2",
              canConfirm && !isSubmitting
                ? "bg-primary text-primary-foreground shadow-primary/20 hover:opacity-90" 
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <span className="animate-pulse">A Guardar Conquista...</span>
            ) : (
              <>
                Confirmar Conclusão
                <CheckCircle2 className="h-4 w-4" />
              </>
            )}
          </button>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
