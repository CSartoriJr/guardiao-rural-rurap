
'use client';
import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types';
import { mockUsers, addMockUser, amapaMunicipalities } from '@/lib/mockData';
import { Loader2, UserPlus, Eye, EyeOff, Phone, Mail, Home, MapPin, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/config/routes';

const cpfValidation = z.string().refine(cpf => {
  const numericCpf = cpf.replace(/\D/g, '');
  return numericCpf.length === 11;
}, { message: 'O CPF deve ter 11 dígitos.' });

const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;

const farmerRegistrationFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  cpf: cpfValidation,
  phone: z.string().regex(phoneRegex, { message: 'Telefone inválido. Use (xx)xxxxx-xxxx ou (xx)xxxx-xxxx' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  address: z.string().min(5, { message: 'O endereço deve ter pelo menos 5 caracteres.' }),
  municipality: z.string().min(1, { message: 'Selecione um município.' }),
  familyMembers: z.coerce.number().int().nonnegative({ message: 'O número de componentes familiares deve ser zero ou mais.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type FarmerRegistrationFormValues = z.infer<typeof farmerRegistrationFormSchema>;

export default function FarmerRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FarmerRegistrationFormValues>({
    resolver: zodResolver(farmerRegistrationFormSchema),
    defaultValues: {
      name: '',
      cpf: '',
      phone: '',
      email: '',
      address: '',
      municipality: '',
      familyMembers: 0,
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit: SubmitHandler<FarmerRegistrationFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const normalizedNewCpf = data.cpf.replace(/\D/g, '');
      const cpfExists = mockUsers.some(user => user.cpf.replace(/\D/g, '').toLowerCase() === normalizedNewCpf.toLowerCase());
      if (cpfExists) {
        toast({
          title: 'CPF já Existe',
          description: 'Este CPF já está cadastrado. Tente fazer login.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const newFarmer: User = {
        id: `farmer${Date.now()}`, 
        name: data.name,
        cpf: data.cpf,
        phone: data.phone,
        email: data.email,
        address: data.address,
        municipality: data.municipality,
        familyMembers: data.familyMembers,
        password: data.password,
        role: 'farmer',
      };

      addMockUser(newFarmer); 

      toast({
        title: 'Cadastro Realizado!',
        description: `Bem-vindo(a), ${newFarmer.name}! Seu cadastro foi realizado com sucesso. Faça login para continuar.`,
      });
      reset();
      router.push(APP_ROUTES.LOGIN); 
    } catch (error) {
      console.error("Falha ao cadastrar agricultor:", error);
      toast({ title: "Falha no Cadastro", description: "Não foi possível realizar seu cadastro. Por favor, tente novamente.", variant: "destructive" });
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

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (...event: any[]) => void) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11); // Limit to 11 digits for (xx)xxxx-xxxx or (xx)xxxxx-xxxx

    let formattedValue = '';
    if (value.length === 0) {
        formattedValue = '';
    } else if (value.length <= 2) {
        formattedValue = `(${value}`;
    } else if (value.length <= 6) { // (xx)xxxx
        formattedValue = `(${value.substring(0, 2)}) ${value.substring(2)}`;
    } else if (value.length <= 10) { // (xx)xxxx-xxxx
        formattedValue = `(${value.substring(0, 2)}) ${value.substring(2, 6)}-${value.substring(6)}`;
    } else { // (xx)xxxxx-xxxx
        formattedValue = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
    }
    fieldOnChange(formattedValue);
  };


  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline">Cadastrar como Agricultor</CardTitle>
        <CardDescription>Preencha seus dados para criar uma nova conta.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Nome Completo</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input id="name" placeholder="Seu nome completo" {...field} />}
            />
            {errors.name && <p className="text-xs text-destructive pt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
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
              {errors.cpf && <p className="text-xs text-destructive pt-1">{errors.cpf.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="flex items-center"><Phone className="mr-1.5 h-3.5 w-3.5" />Telefone</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="phone" 
                    placeholder="(xx) xxxxx-xxxx" 
                    {...field}
                    onChange={(e) => handlePhoneInputChange(e, field.onChange)}
                    maxLength={15} 
                  />
                )}
              />
              {errors.phone && <p className="text-xs text-destructive pt-1">{errors.phone.message}</p>}
            </div>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="email" className="flex items-center"><Mail className="mr-1.5 h-3.5 w-3.5" />E-mail</Label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => <Input id="email" type="email" placeholder="seuemail@exemplo.com" {...field} />}
            />
            {errors.email && <p className="text-xs text-destructive pt-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="address" className="flex items-center"><Home className="mr-1.5 h-3.5 w-3.5" />Endereço Completo</Label>
            <Controller
              name="address"
              control={control}
              render={({ field }) => <Input id="address" placeholder="Rua, Número, Bairro, Complemento..." {...field} />}
            />
            {errors.address && <p className="text-xs text-destructive pt-1">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="municipality" className="flex items-center"><MapPin className="mr-1.5 h-3.5 w-3.5" />Município</Label>
              <Controller
                name="municipality"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="municipality">
                      <SelectValue placeholder="Selecione seu município" />
                    </SelectTrigger>
                    <SelectContent>
                      {amapaMunicipalities.map(muni => (
                        <SelectItem key={muni} value={muni}>{muni}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.municipality && <p className="text-xs text-destructive pt-1">{errors.municipality.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="familyMembers" className="flex items-center"><Users className="mr-1.5 h-3.5 w-3.5" />Nº de Componentes Familiares</Label>
              <Controller
                name="familyMembers"
                control={control}
                render={({ field }) => <Input id="familyMembers" type="number" min="0" placeholder="Ex: 4" {...field} />}
              />
              {errors.familyMembers && <p className="text-xs text-destructive pt-1">{errors.familyMembers.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
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
              {errors.password && <p className="text-xs text-destructive pt-1">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
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
              {errors.confirmPassword && <p className="text-xs text-destructive pt-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Cadastrar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
