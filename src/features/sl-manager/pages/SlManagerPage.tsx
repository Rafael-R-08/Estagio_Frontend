import { Link } from 'react-router-dom';
import { useSlManagerUsers } from '../hooks/useSlManagerUsers';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Users, BookOpen, Award } from 'lucide-react';

export default function SlManagerPage() {
  const { data: users, isLoading, error, refetch } = useSlManagerUsers();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !users) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center text-destructive gap-4">
        <p>Error loading team members. Please try again later.</p>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl leading-tight">A minha Equipa</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Gere o progresso e certificações dos membros da tua Service Line.
        </p>
      </div>

      <div className="rounded-[2.5rem] border border-border/60 bg-card/40 shadow-2xl backdrop-blur-2xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border/60 p-6 bg-card/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-[0.8rem] bg-foreground text-background shadow-lg">
            <Users className="h-5 w-5" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Membros da Service Line</h2>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Colega</TableHead>
                <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Função / Nível</TableHead>
                <TableHead className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Formações</TableHead>
                <TableHead className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Certificados</TableHead>
                <TableHead className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center font-medium text-muted-foreground">
                    Ainda não existem membros na tua equipa.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className="border-border/40 hover:bg-background/40 transition-colors group">
                    <TableCell className="px-6 py-5">
                      <div className="font-black text-foreground group-hover:text-primary transition-colors">{u.name}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{u.email}</div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="text-xs font-bold text-foreground/80">{u.role}</span>
                        {u.experienceLevel && (
                          <span className="rounded-full bg-foreground/5 dark:bg-foreground/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                            {u.experienceLevel}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 font-black text-foreground">
                        <BookOpen className="h-4 w-4 text-muted-foreground/60" />
                        {u.completedTrainingsCount}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 font-black text-foreground">
                        <Award className="h-4 w-4 text-amber-500 shadow-sm" />
                        {u.certificatesCount}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right">
                      <Button variant="ghost" size="sm" asChild className="rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-foreground hover:text-background transition-all">
                        <Link to={`/sl-manager/users/${u.id}`}>Detalhes</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
