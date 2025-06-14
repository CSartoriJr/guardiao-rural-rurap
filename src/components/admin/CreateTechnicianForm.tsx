
'use client';
import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types'; 
import { mockUsers } from '@/lib/mockData'; // To add the new user
import { Loader2, UserPlus, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/config/routes';

// Mock function to simulate saving the technician user
const saveTechnicianUser = async (userData: Pick<User, 'name' | 'email'>): Promise<User> => {
  console.log("Salvando novo técnico:", userData);
  await new Promise(resolve => setTimeout(resolve, 1500)); 
  
  const newTechnician: User = {
    id: `tech${Date.now()}`,
    name: userData.name,
    email: userData.email,
    role: 'technician',
  };
  mockUsers.push(newTechnician); // Add to the global mockUsers array
  return newTechnician;
};

const technicianFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  // Password is not part of the form as per mock auth system
});

type TechnicianFormValues = z.infer<typeof technicianFormSchema>;

export default function CreateTechnicianForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user: adminUser } = useAuth(); // Admin performing the action
  const router = useRouter();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<TechnicianFormValues>({
    resolver: zodResolver(technicianFormSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const onSubmit: SubmitHandler<TechnicianFormValues> = async (data) => {
    if (!adminUser || adminUser.role !== 'admin') {
      toast({ title: "Acesso Negado", description: "Apenas administradores podem criar técnicos.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      // Check if email already exists
      const emailExists = mockUsers.some(user => user.email.toLowerCase() === data.email.toLowerCase());
      if (emailExists) {
        toast({
          title: 'Email já Existe',
          description: 'Este endereço de email já está cadastrado.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const newTechnician = await saveTechnicianUser({ name: data.name, email: data.email });
      toast({
        title: 'Técnico Criado!',
        description: `O técnico ${newTechnician.name} (${newTechnician.email}) foi criado com sucesso.`,
      });
      reset(); // Reset form fields
      // Optionally redirect or provide a link to go back
      // router.push(APP_ROUTES.ADMIN_DASHBOARD); 
    } catch (error) {
      console.error("Falha ao criar técnico:", error);
      toast({ title: "Falha na Criação", description: "Não foi possível criar o técnico. Por favor, tente novamente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
        <Button variant="outline" onClick={() => router.back()} className="mb-6 group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Voltar ao Painel Admin
        </Button>
        <Card className="w-full shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Criar Novo Usuário Técnico</CardTitle>
            <CardDescription>Preencha os detalhes abaixo para adicionar um novo técnico ao sistema.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="name" placeholder="ex: Alice Técnica" {...field} />}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Controller
                name="email"
                control={control}
                render={({ field }) => <Input id="email" type="email" placeholder="ex: tecnico@example.com" {...field} />}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <p className="text-xs text-muted-foreground">Nota: A senha pode ser qualquer uma para fins de demonstração, pois o sistema de autenticação fictício não a valida.</p>

            </CardContent>
            <CardFooter>
            <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
                {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <UserPlus className="mr-2 h-4 w-4" />
                )}
                Criar Técnico
            </Button>
            </CardFooter>
        </form>
        </Card>
    </div>
  );
}
