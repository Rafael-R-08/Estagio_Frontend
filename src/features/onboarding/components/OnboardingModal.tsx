import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '../../../lib/axios';
import { useAuth } from '../../auth/hooks/useAuth';
import { SERVICE_LINE_LABELS, type ServiceLine } from '../../../types';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '../../../components/ui/form';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { Label } from '../../../components/ui/label';
import { Check, Plus, ChevronRight, ChevronLeft, Sparkles, Brain, Target, Cloud, Database, Briefcase, Settings, Users, UserCircle, X, ShieldCheck, Lock } from 'lucide-react';
import { cn } from '../../../lib/utils';

const formSchema = z.object({
  serviceLine: z.enum([
    'HYBRID_CLOUD',
    'DATA',
    'BUSINESS_APPLICATIONS',
    'APPLICATION_OPERATIONS',
    'SOURCING_TALENT_MANAGEMENT'
  ]),
  userFunction: z.string().min(2, 'Por favor indica a tua função'),
  experienceLevel: z.enum(['junior', 'intermedio', 'senior', 'especialista', 'lider']),
  interests: z.array(z.string()).min(1, 'Seleciona pelo menos um interesse'),
  skills: z.array(z.object({
    skillName: z.string().min(1, 'Nome da skill necessário'),
    level: z.enum(['iniciante', 'intermedio', 'experiente']),
  })).min(1, 'Adiciona pelo menos uma skill'),
});

type FormValues = z.infer<typeof formSchema>;

const COMMON_INTERESTS = [
  'Cloud Architecture', 'DevOps', 'Cybersecurity', 'Data Science',
  'Machine Learning', 'Frontend Development', 'Backend Development',
  'Project Management', 'Agile/Scrum', 'Leadership', 'UX/UI Design',
  'Python', 'JavaScript/TypeScript', 'React', 'Node.js', 'Java', 'SQL'
];

export function OnboardingModal() {
  const { setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [customInterest, setCustomInterest] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userFunction: '',
      interests: [],
      skills: [{ skillName: '', level: 'intermedio' }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'skills',
  });

  const handleAddCustomInterest = () => {
    if (!customInterest.trim()) return;
    const current = form.getValues('interests');
    if (!current.includes(customInterest.trim())) {
      form.setValue('interests', [...current, customInterest.trim()]);
    }
    setCustomInterest('');
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (step === 1) fieldsToValidate = ['serviceLine', 'userFunction', 'experienceLevel'];
    if (step === 2) fieldsToValidate = ['interests'];
    if (step === 3) fieldsToValidate = ['skills'];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const onSubmit = async (values: FormValues) => {
    // Bloqueio rigoroso: Só submete se o estado atual for REALMENTE o passo 4
    if (step < 4) {
      console.log('Tentativa de submissão bloqueada: ainda no passo', step);
      return;
    }

    try {
      setIsLoading(true);

      // Mapear os dados para o formato exato esperado pelo Backend (DTO atualizado)
      const mappedPayload = {
        ...values,
        skills: values.skills.map(skill => ({
          skillName: skill.skillName,
          level: skill.level
        }))
      };

      const { data } = await api.post('/auth/onboarding', mappedPayload);
      setUser(data);
      toast.success('Onboarding completed! Your personalized hub is ready.');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Erro ao guardar dados. Tenta novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const serviceLines = Object.entries(SERVICE_LINE_LABELS) as [ServiceLine, string][];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl shadow-2xl border-border/40 bg-card/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center mb-2">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={cn(
                    "h-1.5 w-8 rounded-full transition-all duration-500",
                    step >= s ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight flex items-center justify-center gap-3">
            {step === 1 && <Sparkles className="h-8 w-8 text-primary" />}
            {step === 2 && <Brain className="h-8 w-8 text-violet-500" />}
            {step === 3 && <Target className="h-8 w-8 text-emerald-500" />}
            {step === 4 && <ShieldCheck className="h-8 w-8 text-blue-500" />}
            {step === 1 && "Definir o teu Perfil"}
            {step === 2 && "Os teus Interesses"}
            {step === 3 && "As tuas Skills"}
            {step === 4 && "Transparência e IA"}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-lg">
            {step === 1 && "Personaliza a tua experiência com base na tua área e nível."}
            {step === 2 && "Que áreas tens curiosidade em explorar na Softinsa?"}
            {step === 3 && "Identifica as tuas competências principais."}
            {step === 4 && "Como potenciar a tua jornada de aprendizagem."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* STEP 1: Basic Profile */}
              {step === 1 && (
                <div className="space-y-8 animate-in slide-in-from-right-2 duration-500">

                  {/* Part 1: Service Line (Compact Horizontal Cards) */}
                  <FormField
                    control={form.control}
                    name="serviceLine"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Service Line Softinsa</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
                          >
                            {serviceLines.map(([value, label]) => {
                              const SL_ICONS: Record<string, any> = {
                                HYBRID_CLOUD: Cloud,
                                DATA: Database,
                                BUSINESS_APPLICATIONS: Briefcase,
                                APPLICATION_OPERATIONS: Settings,
                                SOURCING_TALENT_MANAGEMENT: Users
                              };
                              const Icon = SL_ICONS[value] || Target;
                              return (
                                <div key={value}>
                                  <RadioGroupItem value={value} id={value} className="peer sr-only" />
                                  <Label
                                    htmlFor={value}
                                    className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 p-2.5 transition-all hover:bg-muted/20 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/[0.03] peer-data-[state=checked]:text-primary cursor-pointer hover:border-border/80 group"
                                  >
                                    <div className="p-2 rounded-lg bg-muted/10 group-peer-data-[state=checked]:bg-primary/10 shrink-0">
                                      <Icon className={cn(
                                        "h-4 w-4 transition-transform group-hover:scale-110",
                                        field.value === value ? "text-primary" : "text-muted-foreground"
                                      )} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-tight truncate">{label}</span>
                                  </Label>
                                </div>
                              );
                            })}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Part 2: Role / Function */}
                    <FormField
                      control={form.control}
                      name="userFunction"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Função / Cargo</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                              <input
                                {...field}
                                placeholder="Software Engineer..."
                                className="flex h-11 w-full rounded-xl border border-border/60 bg-background/50 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-bold placeholder:font-medium placeholder:opacity-30"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Part 3: Experience Level */}
                    <FormField
                      control={form.control}
                      name="experienceLevel"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Nível</FormLabel>
                          <FormControl>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 bg-muted/20 p-1.5 rounded-[1.25rem] border border-border/40">
                              {(['junior', 'intermedio', 'senior', 'especialista', 'lider'] as const).map((lvl) => (
                                <button
                                  key={lvl}
                                  type="button"
                                  onClick={() => field.onChange(lvl)}
                                  className={cn(
                                    "h-10 rounded-xl text-[9px] font-black uppercase transition-all",
                                    field.value === lvl
                                      ? "bg-background text-primary shadow-sm ring-1 ring-border/20 border-border/10"
                                      : "text-muted-foreground hover:bg-muted/30"
                                  )}
                                >
                                  {lvl === 'intermedio' ? 'Intermédio' :
                                    lvl === 'senior' ? 'Sénior' :
                                      lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                                </button>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Interests */}
              {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="flex flex-col gap-4">
                    {/* Add Custom Interest Input */}
                    <div className="relative group">
                      <Plus className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-violet-500" />
                      <input
                        type="text"
                        value={customInterest}
                        onChange={(e) => setCustomInterest(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomInterest();
                          }
                        }}
                        placeholder="Adiciona outro interesse (ex: Blockchain, Go, UX...)"
                        className="flex h-12 w-full rounded-2xl border-2 border-border/40 bg-background/30 pl-11 pr-24 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/5 transition-all font-bold placeholder:font-medium placeholder:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomInterest}
                        disabled={!customInterest.trim()}
                        className="absolute right-2 top-2 h-8 px-4 rounded-xl bg-violet-600 text-white text-[10px] font-black uppercase tracking-wider disabled:opacity-0 transition-all hover:bg-violet-700 shadow-lg shadow-violet-500/20 active:scale-95"
                      >
                        Adicionar
                      </button>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Sugestões Populares</p>
                      <FormField
                        control={form.control}
                        name="interests"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex flex-wrap gap-2 min-h-[100px] content-start">
                                {/* Selected Interests (including custom ones) */}
                                {field.value.map((interest) => {
                                  return (
                                    <button
                                      key={interest}
                                      type="button"
                                      onClick={() => field.onChange(field.value.filter(i => i !== interest))}
                                      className="group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 border-2 border-violet-600 text-white shadow-lg shadow-violet-500/10 transition-all active:scale-95 hover:bg-violet-700"
                                    >
                                      {interest}
                                      <X className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                  );
                                })}

                                {/* Unselected Preset Interests */}
                                {COMMON_INTERESTS.filter(i => !field.value.includes(i)).map((interest) => (
                                  <button
                                    key={interest}
                                    type="button"
                                    onClick={() => field.onChange([...field.value, interest])}
                                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all border border-border/60 text-muted-foreground hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50/50"
                                  >
                                    {interest}
                                  </button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Skills */}
              {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-3">
                    {fields.map((f, index) => (
                      <div key={f.id} className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-border/40 bg-card/40 p-4 transition-all hover:bg-muted/10 group relative">
                        {/* Skill Name */}
                        <div className="flex-1 w-full">
                          <FormField
                            control={form.control}
                            name={`skills.${index}.skillName` as const}
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Especialidade / Competência</FormLabel>
                                <FormControl>
                                  <input
                                    {...field}
                                    placeholder="Ex: React, Project Mgmt..."
                                    className="flex h-11 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-bold placeholder:font-medium placeholder:opacity-30"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Proficiency Level */}
                        <div className="w-full sm:w-64">
                          <FormField
                            control={form.control}
                            name={`skills.${index}.level` as const}
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <div className="flex items-center justify-between ml-1">
                                  <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">O teu Nível</FormLabel>
                                </div>
                                <FormControl>
                                  <div className="flex gap-1 p-1 bg-muted/20 border border-border/30 rounded-xl h-[44px]">
                                    {(['iniciante', 'intermedio', 'experiente'] as const).map((lv) => (
                                      <button
                                        key={lv}
                                        type="button"
                                        onClick={() => field.onChange(lv)}
                                        className={cn(
                                          "flex-1 rounded-lg text-[9px] font-black uppercase transition-all tracking-tight",
                                          field.value === lv
                                            ? "bg-background text-primary shadow-sm shadow-foreground/5"
                                            : "text-muted-foreground/60 hover:bg-muted/30"
                                        )}
                                      >
                                        {lv === 'iniciante' && 'Iniciante'}
                                        {lv === 'intermedio' && 'Intermédio'}
                                        {lv === 'experiente' && 'Experiente'}
                                      </button>
                                    ))}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Delete Skill */}
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-1.5 rounded-full text-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0 sm:absolute sm:-right-2 sm:top-1/2 sm:-translate-y-1/2 opacity-0 group-hover:opacity-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl border-dashed border-2 hover:bg-muted/10 border-border/60 font-bold text-xs py-5 transition-all active:scale-95"
                    onClick={() => append({ skillName: '', level: 'intermedio' })}
                  >
                    <Plus className="h-4 w-4 mr-2 text-primary" />
                    Adicionar outra competência
                  </Button>
                </div>
              )}

              {/* STEP 4: Privacy & AI */}
              {step === 4 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Compromisso de Transparência</p>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/30 transition-all hover:bg-muted/5 group">
                          <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                            <Brain className="h-5 w-5" />
                          </div>
                          <div className="space-y-0.5 pr-4">
                            <p className="text-[11px] font-black uppercase tracking-tight text-foreground">O Teu Co-piloto de IA</p>
                            <p className="text-[11px] leading-relaxed text-muted-foreground/80">
                              Os teus dados de perfil são utilizados exclusivamente para gerar recomendações personalizadas.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/30 transition-all hover:bg-muted/5 group">
                          <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                            <Lock className="h-5 w-5" />
                          </div>
                          <div className="space-y-0.5 pr-4">
                            <p className="text-[11px] font-black uppercase tracking-tight text-foreground">Visibilidade e Carreira</p>
                            <p className="text-[11px] leading-relaxed text-muted-foreground/80">
                              Os responsáveis de Service Line acompanham o teu progresso para identificar oportunidades de formação.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Consentimento e Utilização</p>
                      <div className="p-6 rounded-2xl bg-muted/20 border-2 border-dashed border-border/40 text-[11px] leading-relaxed text-muted-foreground/90 font-medium relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                          <ShieldCheck className="h-16 w-16" />
                        </div>
                        "Ao finalizar, confirmas a tua ciência sobre a utilização destes dados pela plataforma para otimizar e apoiar a tua evolução profissional na Softinsa."
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/40">
                {step > 1 ? (
                  <Button type="button" variant="ghost" className="rounded-xl px-6 text-xs font-bold" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>
                ) : (
                  <div /> /* spacer */
                )}

                {step < 4 ? (
                  <Button
                    key="next-button"
                    type="button"
                    className="rounded-xl px-8 bg-blue-600 text-white hover:bg-blue-700 transition-all active:scale-95 text-xs font-bold"
                    onClick={nextStep}
                  >
                    Seguinte
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    key="submit-button"
                    type="submit"
                    className="rounded-xl px-10 bg-primary font-bold shadow-lg shadow-primary/10 transition-all active:scale-95 text-xs"
                    disabled={isLoading}
                  >
                    {isLoading ? 'A Guardar...' : 'Finalizar'}
                    {!isLoading && <Check className="h-4 w-4 ml-2" />}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
