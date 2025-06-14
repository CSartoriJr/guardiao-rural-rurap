
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
const saveTechnicianUser = async (userData: Pick<User, 'name' | 'cpf'>): Promise<User> => {
  console.log("Salvando novo técnico:", userData);
  await new Promise(resolve => setTimeout(resolve, 1500)); 
  
  const newTechnician: User = {
    id: `tech${Date.now()}`,
    name: userData.name,
    cpf: userData.cpf, // Changed from email
    role: 'technician',
  };
  mockUsers.push(newTechnician); // Add to the global mockUsers array
  return newTechnician;
};

// Basic CPF validation: checks if it has 11 digits after removing non-numeric characters
// For a real app, use a robust CPF validation library.
const cpfValidation = z.string().refine(cpf => {
  const numericCpf = cpf.replace(/\D/g, '');
  return numericCpf.length === 11;
}, { message: 'O CPF deve ter 11 dígitos.' });


const technicianFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  cpf: cpfValidation, // Changed from email
});

type TechnicianFormValues = z.infer<typeof technicianFormSchema>;

export default function CreateTechnicianForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user: adminUser } = useAuth(); // Admin performing the action
  const router = useRouter();

  const { control, handleSubmit, reset, setValue: setFormValue, formState: { errors } } = useForm<TechnicianFormValues>({
    resolver: zodResolver(technicianFormSchema),
    defaultValues: {
      name: '',
      cpf: '',
    },
  });

  const onSubmit: SubmitHandler<TechnicianFormValues> = async (data) => {
    if (!adminUser || adminUser.role !== 'admin') {
      toast({ title: "Acesso Negado", description: "Apenas administradores podem criar técnicos.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const normalizedNewCpf = data.cpf.replace(/\D/g, '');
      // Check if CPF already exists
      const cpfExists = mockUsers.some(user => user.cpf.replace(/\D/g, '').toLowerCase() === normalizedNewCpf.toLowerCase());
      if (cpfExists) {
        toast({
          title: 'CPF já Existe',
          description: 'Este CPF já está cadastrado.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const newTechnician = await saveTechnicianUser({ name: data.name, cpf: data.cpf }); // pass formatted CPF
      toast({
        title: 'Técnico Criado!',
        description: `O técnico ${newTechnician.name} (CPF: ${newTechnician.cpf}) foi criado com sucesso.`,
      });
      reset(); 
    } catch (error) {
      console.error("Falha ao criar técnico:", error);
      toast({ title: "Falha na Criação", description: "Não foi possível criar o técnico. Por favor, tente novamente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Basic CPF formatting as user types (optional, can be improved)
  const handleCpfInputChange = (e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (...event: any[]) => void) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 11) value = value.substring(0, 11); // Limit to 11 digits

    // Apply formatting XXX.XXX.XXX-XX
    let formattedValue = value;
    if (value.length > 9) {
      formattedValue = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}-${value.substring(9)}`;
    } else if (value.length > 6) {
      formattedValue = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6)}`;
    } else if (value.length > 3) {
      formattedValue = `${value.substring(0, 3)}.${value.substring(3)}`;
    }
    // setFormValue('cpf', formattedValue, { shouldValidate: true }); // Update RHF state
    fieldOnChange(formattedValue); // Update RHF state via controller's onChange
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
                <Label htmlFor="cpf">CPF</Label>
                <Controller
                name="cpf"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="cpf" 
                    placeholder="000.000.000-00" 
                    {...field} 
                    onChange={(e) => handleCpfInputChange(e, field.onChange)}
                    maxLength={14}
                  />
                )}
                />
                {errors.cpf && <p className="text-sm text-destructive">{errors.cpf.message}</p>}
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
