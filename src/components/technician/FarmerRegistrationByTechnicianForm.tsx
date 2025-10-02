
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
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types';
import { amapaMunicipalities, organizationalUnits } from '@/lib/mockData';
import { Loader2, UserPlus, Phone, Mail, Home, MapPin, Users as UsersIcon, FileText, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/config/routes';
import { firebaseInitializedCorrectly, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const cpfValidation = z.string().refine(cpf => {
  const numericCpf = cpf.replace(/\D/g, '');
  return numericCpf.length === 11;
}, { message: 'O CPF deve ter 11 dígitos.' });

const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;

const cafValidation = z.string().refine(val => {
    if (val === '') return true; // Optional field
    const match = val.match(/^AP(\d{6})\.(\d{2})\.(\d{9})CAF$/);
    return !!match;
}, { message: 'Formato de CAF inválido.' });

const farmerRegistrationFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  cpf: cpfValidation,
  phone: z.string().regex(phoneRegex, { message: 'Telefone inválido. Use (xx)xxxxx-xxxx ou (xx)xxxx-xxxx' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  caf: cafValidation.optional(),
  address: z.string().min(5, { message: 'O endereço deve ter pelo menos 5 caracteres.' }),
  organizationalUnit: z.string().min(1, { message: 'A Unidade Organizacional é obrigatória.' }),
  municipality: z.string().min(1, { message: 'Selecione um município.' }),
  familyMembers: z.coerce.number().int().nonnegative({ message: 'O número de componentes familiares deve ser zero ou mais.' }),
});

type FarmerRegistrationFormValues = z.infer<typeof farmerRegistrationFormSchema>;

export default function FarmerRegistrationByTechnicianForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user: technicianUser, registerFarmerByTechnician } = useAuth();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FarmerRegistrationFormValues>({
    resolver: zodResolver(farmerRegistrationFormSchema),
    defaultValues: {
      name: '',
      cpf: '',
      phone: '',
      email: '',
      caf: '',
      address: '',
      organizationalUnit: '',
      municipality: '',
      familyMembers: 0,
    },
  });

  const onSubmit: SubmitHandler<FarmerRegistrationFormValues> = async (data) => {
    if (!technicianUser || !registerFarmerByTechnician) {
        toast({ title: "Erro", description: "Você precisa estar logado como técnico para cadastrar um agricultor.", variant: "destructive" });
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
        
      const initialPassword = data.cpf.replace(/\D/g, '');

      const registrationData = {
        ...data,
        passwordInput: initialPassword,
      };

      const newUser = await registerFarmerByTechnician(registrationData, technicianUser);

      if (newUser) {
        toast({
          title: 'Cadastro Realizado!',
          description: `O agricultor ${newUser.name} foi cadastrado com sucesso. A senha inicial é o CPF (apenas números).`,
        });
        reset();
        router.push(APP_ROUTES.TECHNICIAN_REGISTER_FARMER_SUCCESS);
      }
    } catch (error: any) {
      console.error("Falha ao cadastrar agricultor:", error);
      toast({ title: "Falha no Cadastro", description: error.message || "Ocorreu um erro desconhecido.", variant: "destructive" });
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
    if (value.length > 11) value = value.substring(0, 11); 

    let formattedValue = '';
    if (value.length === 0) {
        formattedValue = '';
    } else if (value.length <= 2) {
        formattedValue = `(${value}`;
    } else if (value.length <= 6) { 
        formattedValue = `(${value.substring(0, 2)}) ${value.substring(2)}`;
    } else if (value.length <= 10) { 
        formattedValue = `(${value.substring(0, 2)}) ${value.substring(2, 6)}-${value.substring(6)}`;
    } else { 
        formattedValue = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
    }
    fieldOnChange(formattedValue);
  };

   const handleCafInputChange = (e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (...event: any[]) => void) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 17) {
      value = value.substring(0, 17);
    }
  
    if (value.length === 0) {
      fieldOnChange('');
      return;
    }
    
    let formatted = 'AP';
    if (value.length > 0) formatted += value.substring(0, 6);
    if (value.length > 6) formatted += `.${value.substring(6, 8)}`;
    if (value.length > 8) formatted += `.${value.substring(8, 17)}`;
    if (value.length === 17) formatted += 'CAF';
  
    e.target.value = formatted;
    fieldOnChange(formatted);
  };
  
  const filteredMunicipalities = amapaMunicipalities.filter(m => !["Água Branca do Cajarí", "Pacuí", "Bailique", "Maruanum"].includes(m));

  return (
    <>
    <div className="max-w-2xl mx-auto">
        <Button variant="outline" onClick={() => router.back()} className="mb-6 group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Voltar
        </Button>
        <Card className="w-full shadow-xl">
        <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Cadastrar Novo Agricultor</CardTitle>
            <CardDescription>Preencha os dados do agricultor. A senha inicial será o CPF (apenas números).</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
            <div className="space-y-1">
                <Label htmlFor="name">Nome Completo do Agricultor</Label>
                <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="name" placeholder="Nome completo do agricultor" {...field} />}
                />
                {errors.name && <p className="text-xs text-destructive pt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                <Label htmlFor="cpf">CPF (será o login do agricultor)</Label>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                <Label htmlFor="email" className="flex items-center"><Mail className="mr-1.5 h-3.5 w-3.5" />E-mail (para contato)</Label>
                <Controller
                    name="email"
                    control={control}
                    render={({ field }) => <Input id="email" type="email" placeholder="email.agricultor@exemplo.com" {...field} />}
                />
                {errors.email && <p className="text-xs text-destructive pt-1">{errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                <Label htmlFor="caf" className="flex items-center"><FileText className="mr-1.5 h-3.5 w-3.5" />CAF (Opcional)</Label>
                <Controller
                    name="caf"
                    control={control}
                    render={({ field }) => (
                    <Input
                        id="caf"
                        placeholder="Apenas números..."
                        {...field}
                        onChange={(e) => handleCafInputChange(e, field.onChange)}
                    />
                    )}
                />
                {errors.caf && <p className="text-xs text-destructive pt-1">{errors.caf.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                <Label htmlFor="address" className="flex items-center"><Home className="mr-1.5 h-3.5 w-3.5" />Endereço Completo</Label>
                <Controller
                    name="address"
                    control={control}
                    render={({ field }) => <Input id="address" placeholder="Rua, Número, Bairro, etc." {...field} />}
                />
                {errors.address && <p className="text-xs text-destructive pt-1">{errors.address.message}</p>}
                </div>
                <div className="space-y-1">
                    <Label htmlFor="municipality" className="flex items-center"><MapPin className="mr-1.5 h-3.5 w-3.5" />Município</Label>
                    <Controller
                        name="municipality"
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="municipality">
                            <SelectValue placeholder="Selecione um município" />
                            </SelectTrigger>
                            <SelectContent>
                            {filteredMunicipalities.sort((a,b) => a.localeCompare(b)).map(muni => (
                                <SelectItem key={muni} value={muni}>{muni}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        )}
                    />
                    {errors.municipality && <p className="text-xs text-destructive pt-1">{errors.municipality.message}</p>}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="organizationalUnit">Unidade Organizacional</Label>
                    <Controller
                        name="organizationalUnit"
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="organizationalUnit">
                            <SelectValue placeholder="Selecione uma unidade" />
                            </SelectTrigger>
                            <SelectContent>
                            {organizationalUnits.map(unit => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        )}
                    />
                    {errors.organizationalUnit && <p className="text-xs text-destructive pt-1">{errors.organizationalUnit.message}</p>}
                </div>
                <div className="space-y-1">
                <Label htmlFor="familyMembers" className="flex items-center"><UsersIcon className="mr-1.5 h-3.5 w-3.5" />Nº de Componentes Familiares</Label>
                <Controller
                    name="familyMembers"
                    control={control}
                    render={({ field }) => <Input id="familyMembers" type="number" min="0" placeholder="Ex: 4" {...field} />}
                />
                {errors.familyMembers && <p className="text-xs text-destructive pt-1">{errors.familyMembers.message}</p>}
                </div>
            </div>
            
             <p className="text-xs text-muted-foreground pt-4">
                Você está cadastrando este agricultor como <strong>{technicianUser?.name}</strong>. Esta informação será registrada.
            </p>


            </CardContent>
            <CardFooter>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
                {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <UserPlus className="mr-2 h-4 w-4" />
                )}
                Cadastrar Agricultor
            </Button>
            </CardFooter>
        </form>
        </Card>
    </div>
    </>
  );
}
