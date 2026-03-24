import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '../../../lib/axios';
import { useAuth } from '../../auth/hooks/useAuth';
import { SERVICE_LINE_LABELS } from '../../../types';
import type { ServiceLine } from '../../../types';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../../../components/ui/form';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { Label } from '../../../components/ui/label';

const formSchema = z.object({
  serviceLine: z.enum([
    'HYBRID_CLOUD',
    'DATA',
    'BUSINESS_APPLICATIONS',
    'APPLICATION_OPERATIONS',
    'SOURCING_TALENT_MANAGEMENT'
  ]),
});

type FormValues = z.infer<typeof formSchema>;

export function OnboardingModal() {
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      // POST to /auth/onboarding
      const { data } = await api.post('/auth/onboarding', { serviceLine: values.serviceLine });
      
      // Update local user state directly from response 
      setUser(data);
      
      toast.success('Onboarding completed successfully!');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const serviceLines = Object.entries(SERVICE_LINE_LABELS) as [ServiceLine, string][];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center space-y-2 pb-8">
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome to Learning Hub</CardTitle>
          <CardDescription className="text-muted-foreground text-lg">
            Before we begin, please select your Service Line to personalize your experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="serviceLine"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                      >
                        {serviceLines.map(([value, label]) => (
                          <div key={value}>
                            <RadioGroupItem
                              value={value}
                              id={value}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={value}
                              className="flex flex-col items-center justify-center text-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all h-full"
                            >
                              <span className="text-sm font-semibold">{label}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="text-center font-medium" />
                  </FormItem>
                )}
              />
              <div className="flex justify-center pt-4">
                <Button type="submit" size="lg" className="w-full md:w-1/2" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Continue'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
