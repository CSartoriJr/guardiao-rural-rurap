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
import { Loader2, UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/config/routes';
import { firebaseInitializedCorrectly, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { createExternalUser } from '@/ai/flows/create-external-user';

const cpfValidation = z.string().refine(cpf => {
  const numericCpf = cpf.replace(/\D/g, '');
  return numericCpf.length === 11;
}, { message: 'O CPF deve ter 11 dígitos.' });


const externalUserFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  cpf: cpfValidation,
  email: z.string().email({ message: 'E-mail inválido. Será usado para recuperação de senha.' }),
  role: z.enum(['GabineteGov', 'Diagro', 'SDR', 'Gestão'], { required_error: "A função é obrigatória." }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type ExternalUserFormValues = z.infer<typeof externalUserFormSchema>;

export default function CreateExternalUserForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const { user: adminUser } = useAuth();
  const router = useRouter();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ExternalUserFormValues>({
    resolver: zodResolver(externalUserFormSchema),
    defaultValues: {
      name: '',
      cpf: '',
      email: '',
      role: 'GabineteGov',
      password: '',
      confirmPassword: '',
    },
  });
  
  const onSubmit: SubmitHandler<ExternalUserFormValues> = async (data) => {
    if (!adminUser) {
      toast({ title: "Erro", description: "Apenas administradores podem criar usuários.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      if (firebaseInitializedCorrectly && db) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("cpf", "==", data.cpf));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          toast({
            title: 'CPF já Existe',
            description: 'Este CPF já está cadastrado no sistema.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      } else {
         throw new Error("Firebase não inicializado para verificar CPF.");
      }

      const { confirmPassword, ...userData } = data;
      
      const result = await createExternalUser(userData);
      
      if (result.success && result.user) {
        toast({
          title: 'Usuário Externo Criado!',
          description: `O usuário ${result.user.name} foi criado com sucesso.`,
        });
        reset();
      } else {
        throw new Error(result.message || "Falha ao criar usuário externo no servidor.");
      }
    } catch (error: any) {
      console.error("Falha ao criar usuário externo:", error);
      toast({ title: "Falha na Criação", description: error.message || "Ocorreu um erro.", variant: "destructive" });
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
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Voltar para Gerenciar Usuários
        </Button>
        <Card className="w-full shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Criar Novo Usuário Externo</CardTitle>
            <CardDescription>Preencha os detalhes para um usuário de visualização (Gabinete, Diagro, SDR, Gestão).</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="name" placeholder="Nome do novo usuário" {...field} />}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="cpf">CPF (usado para login)</Label>
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
                <Label htmlFor="email">E-mail (para recuperação de senha)</Label>
                <Controller
                name="email"
                control={control}
                render={({ field }) => <Input id="email" type="email" placeholder="usuario@example.com" {...field} />}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Perfil de Acesso</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GabineteGov">Gabinete Gov.</SelectItem>
                      <SelectItem value="Diagro">Diagro</SelectItem>
                      <SelectItem value="SDR">SDR</SelectItem>
                      <SelectItem value="Gestão">Gestão</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
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
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <UserPlus className="mr-2 h-4 w-4" />
                )}
                Criar Usuário Externo
            </Button>
            </CardFooter>
        </form>
        </Card>
    </div>
  );
}
