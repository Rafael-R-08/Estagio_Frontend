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
import { Check, Plus, Trash2, ChevronRight, ChevronLeft, Sparkles, Brain, Target } from 'lucide-react';
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
  experienceLevel: z.enum(['junior', 'mid', 'senior', 'lead']),
  interests: z.array(z.string()).min(1, 'Seleciona pelo menos um interesse'),
  skills: z.array(z.object({
    skillName: z.string().min(1, 'Nome da skill necessário'),
    yearsOfExperience: z.number().min(0, 'Indica os anos de experiência'),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userFunction: '',
      interests: [],
      skills: [{ skillName: '', yearsOfExperience: 1, level: 'intermediate' }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'skills',
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (step === 1) fieldsToValidate = ['serviceLine', 'userFunction', 'experienceLevel'];
    if (step === 2) fieldsToValidate = ['interests'];
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      const { data } = await api.post('/auth/onboarding', values);
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
              {[1, 2, 3].map((s) => (
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
            {step === 1 && "Definir o teu Perfil"}
            {step === 2 && "Os teus Interesses"}
            {step === 3 && "As tuas Skills"}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-lg">
            {step === 1 && "Diz-nos qual a tua função e Service Line atual."}
            {step === 2 && "Que áreas tens curiosidade em explorar na Softinsa?"}
            {step === 3 && "Identifica as tuas competências principais e o teu nível."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* STEP 1: Basic Profile */}
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="userFunction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Função / Cargo</FormLabel>
                          <FormControl>
                            <input
                              {...field}
                              placeholder="Ex: Software Engineer"
                              className="flex h-12 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="experienceLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Nível de Experiência</FormLabel>
                          <FormControl>
                            <select
                              value={field.value}
                              onChange={field.onChange}
                              className="flex h-12 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium cursor-pointer"
                            >
                              <option value="">Seleciona...</option>
                              <option value="junior">Junior</option>
                              <option value="mid">Intermediate (Mid)</option>
                              <option value="senior">Senior</option>
                              <option value="lead">Lead / Principal</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="serviceLine"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel className="font-bold">Service Line</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                          >
                            {serviceLines.map(([value, label]) => (
                              <div key={value}>
                                <RadioGroupItem value={value} id={value} className="peer sr-only" />
                                <Label
                                  htmlFor={value}
                                  className="flex h-full items-center justify-center rounded-2xl border-2 border-muted bg-card/50 p-4 text-center text-[11px] font-black uppercase tracking-wider text-muted-foreground transition-all hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary cursor-pointer hover:border-border"
                                >
                                  {label}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* STEP 2: Interests */}
              {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <FormField
                    control={form.control}
                    name="interests"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {COMMON_INTERESTS.map((interest) => {
                              const isSelected = field.value.includes(interest);
                              return (
                                <button
                                  key={interest}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      field.onChange(field.value.filter(i => i !== interest));
                                    } else {
                                      field.onChange([...field.value, interest]);
                                    }
                                  }}
                                  className={cn(
                                    "px-4 py-2 rounded-full text-xs font-bold transition-all border-2 active:scale-95",
                                    isSelected 
                                      ? "bg-violet-500 border-violet-500 text-white shadow-lg shadow-violet-500/20" 
                                      : "border-border/60 text-muted-foreground hover:border-violet-400 hover:text-violet-500"
                                  )}
                                >
                                  {interest}
                                </button>
                              );
                            })}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* STEP 3: Skills */}
              {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-4">
                    {fields.map((f, index) => (
                      <div key={f.id} className="flex flex-col sm:flex-row items-center gap-4 rounded-3xl border border-border/40 bg-muted/20 p-5 group transition-all hover:border-primary/20">
                        <div className="flex-1 w-full">
                          <FormField
                            control={form.control}
                            name={`skills.${index}.skillName` as const}
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Especialidade / Skill</FormLabel>
                                <FormControl>
                                  <input
                                    {...field}
                                    placeholder="Ex: React, Kubernetes, Project Mgmt..."
                                    className="flex h-11 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="w-24 shrink-0">
                          <FormField
                            control={form.control}
                            name={`skills.${index}.yearsOfExperience` as const}
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Anos</FormLabel>
                                <FormControl>
                                  <input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    className="flex h-11 w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-center"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="w-full sm:w-48">
                          <FormField
                            control={form.control}
                            name={`skills.${index}.level` as const}
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <div className="flex items-center justify-between ml-1">
                                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Proficiência</FormLabel>
                                  <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
                                    {field.value === 'beginner' && "Beginner"}
                                    {field.value === 'intermediate' && "Intermediate"}
                                    {field.value === 'advanced' && "Advanced / Expert"}
                                  </span>
                                </div>
                                <FormControl>
                                  <div className="flex gap-2">
                                    {(['beginner', 'intermediate', 'advanced'] as const).map((lv) => (
                                      <button
                                        key={lv}
                                        type="button"
                                        onClick={() => field.onChange(lv)}
                                        className={cn(
                                          "flex-1 h-8 rounded-lg text-[9px] font-black uppercase transition-all border",
                                          field.value === lv
                                            ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20 scale-105"
                                            : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                                        )}
                                      >
                                        {lv === 'beginner' && 'Begg'}
                                        {lv === 'intermediate' && 'Inter'}
                                        {lv === 'advanced' && 'Adv'}
                                      </button>
                                    ))}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="mt-4 sm:mt-5 p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-2xl border-dashed border-2 hover:bg-muted/50 border-border/80 group py-4"
                    onClick={() => append({ skillName: '', yearsOfExperience: 1, level: 'intermediate' })}
                  >
                    <Plus className="h-4 w-4 mr-2 text-primary group-hover:scale-125 transition-transform" />
                    Adicionar outra competência
                  </Button>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/40">
                {step > 1 ? (
                  <Button type="button" variant="ghost" className="rounded-full px-6" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>
                ) : (
                  <div /> /* spacer */
                )}
                
                {step < 3 ? (
                  <Button 
                    type="button" 
                    className="rounded-full px-8 bg-foreground text-background hover:opacity-90 shadow-xl" 
                    onClick={nextStep}
                  >
                    Seguinte
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="rounded-full px-10 bg-primary shadow-xl shadow-primary/20 font-black tracking-wide" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'A Guardar...' : 'Finalizar Modulo'}
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
