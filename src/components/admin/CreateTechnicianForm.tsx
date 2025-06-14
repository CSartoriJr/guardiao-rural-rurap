
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
import { mockUsers, addMockUser } from '@/lib/mockData'; // Import addMockUser
import { Loader2, UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/config/routes';

// This function now uses addMockUser from mockData.ts
const saveTechnicianUser = async (userData: Pick<User, 'name' | 'cpf' | 'password'>): Promise<User> => {
  console.log("Salvando novo técnico:", { name: userData.name, cpf: userData.cpf });
  await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay
  
  const newTechnician: User = {
    id: `tech${Date.now()}`,
    name: userData.name,
    cpf: userData.cpf,
    password: userData.password,
    role: 'technician',
  };
  return addMockUser(newTechnician); // Use the new function to add and persist
};

const cpfValidation = z.string().refine(cpf => {
  const numericCpf = cpf.replace(/\D/g, '');
  return numericCpf.length === 11;
}, { message: 'O CPF deve ter 11 dígitos.' });


const technicianFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  cpf: cpfValidation,
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type TechnicianFormValues = z.infer<typeof technicianFormSchema>;

export default function CreateTechnicianForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const { user: adminUser } = useAuth();
  const router = useRouter();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<TechnicianFormValues>({
    resolver: zodResolver(technicianFormSchema),
    defaultValues: {
      name: '',
      cpf: '',
      password: '',
      confirmPassword: '',
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
      // Check against the current mockUsers array which is loaded from localStorage
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

      const newTechnician = await saveTechnicianUser({ name: data.name, cpf: data.cpf, password: data.password });
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
  
  const handleCpfInputChange = (e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (...event: any[]) => void) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);

    let formattedValue = value;
    if (value.length > 9) {
      formattedValue = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}-${value.substring(9)}`;
    } else if (value.length > 6) {
      formattedValue = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6)}`;
    } else if (value.length > 3) {
      formattedValue = `${value.substring(0, 3)}.${value.substring(3)}`;
    }
    fieldOnChange(formattedValue);
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

            <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                    <Controller
                    name="password"
                    control={control}
                    render={({ field }) => <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" {...field} />}
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                 <div className="relative">
                    <Controller
                    name="confirmPassword"
                    control={control}
                    render={({ field }) => <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Repita a senha" {...field} />}
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>

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
