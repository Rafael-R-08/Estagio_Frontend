import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar, Check, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

// Schema Zod
const formSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
});

type FormData = z.infer<typeof formSchema>;

export default function Test() {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  // React Hook Form + Zod
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  // React Query
  const { data, isLoading } = useQuery({
    queryKey: ['test'],
    queryFn: async () => {
      setTestResults(prev => ({ ...prev, reactQuery: true }));
      return { message: 'React Query funcionando!' };
    },
  });

  const onSubmit = (formData: FormData) => {
  console.log('Form válido:', formData);
  setTestResults(prev => ({ ...prev, form: true, zod: true }));
};


  // Date-fns
  const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm:ss');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">🧪 Teste de Instalação</CardTitle>
            <CardDescription>
              Verificando todas as bibliotecas do LearningHub
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Versões */}
        <Card>
          <CardHeader>
            <CardTitle>📦 Versões Instaladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              <Badge variant="outline">✅ React 19.2</Badge>
              <Badge variant="outline">✅ TypeScript 5.9</Badge>
              <Badge variant="outline">✅ Vite 7.3</Badge>
              <Badge variant="outline">✅ TailwindCSS 3.4</Badge>
              <Badge variant="outline">✅ shadcn/ui</Badge>
              <Badge variant="outline">✅ React Query 5.90</Badge>
              <Badge variant="outline">✅ React Router 7.13</Badge>
              <Badge variant="outline">✅ Axios 1.13</Badge>
              <Badge variant="outline">✅ Zod 4.3</Badge>
              <Badge variant="outline">✅ React Hook Form 7.71</Badge>
              <Badge variant="outline">✅ Date-fns 4.1</Badge>
              <Badge variant="outline">✅ Lucide Icons 0.575</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Testes Funcionais */}
        <Card>
          <CardHeader>
            <CardTitle>⚡ Testes Funcionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* TailwindCSS + shadcn/ui */}
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>TailwindCSS + shadcn/ui</span>
              <Badge className="bg-green-500">Funcionando</Badge>
            </div>

            {/* Lucide Icons */}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span>Lucide Icons</span>
              <Badge className="bg-green-500">Funcionando</Badge>
            </div>

            {/* Date-fns */}
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>Date-fns: {currentDate}</span>
              <Badge className="bg-green-500">Funcionando</Badge>
            </div>

            {/* React Query */}
            <div className="flex items-center gap-3">
              {isLoading ? (
                <X className="h-5 w-5 text-yellow-500" />
              ) : (
                <Check className="h-5 w-5 text-green-500" />
              )}
              <span>React Query: {data?.message || 'Carregando...'}</span>
              {testResults.reactQuery && (
                <Badge className="bg-green-500">Funcionando</Badge>
              )}
            </div>

            {/* React Hook Form + Zod */}
            <div className="flex items-center gap-3">
              {testResults.form ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-gray-400" />
              )}
              <span>React Hook Form + Zod</span>
              {testResults.form && testResults.zod && (
                <Badge className="bg-green-500">Funcionando</Badge>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Formulário de Teste */}
        <Card>
          <CardHeader>
            <CardTitle>📝 Teste: React Hook Form + Zod</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  {...register('name')}
                  placeholder="Nome (min 3 caracteres)"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="Email"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>
              <Button type="submit">Testar Validação</Button>
            </form>
          </CardContent>
        </Card>

        {/* PWA */}
        <Card>
          <CardHeader>
            <CardTitle>📱 PWA (Progressive Web App)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              PWA configurado! Para testar:
            </p>
            <ol className="list-decimal list-inside text-sm text-slate-600 mt-2 space-y-1">
              <li>Rode <code className="bg-slate-200 px-1 rounded">npm run build</code></li>
              <li>Rode <code className="bg-slate-200 px-1 rounded">npm run preview</code></li>
              <li>Abra o DevTools → Application → Service Workers</li>
            </ol>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
