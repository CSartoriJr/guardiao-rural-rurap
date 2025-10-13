'use client';
import React, { useState } from 'react';
import type { User as AppUserType, RegistrationStatus } from '@/types'; // Use AppUserType
import type { UserWithActivityCount } from '@/app/admin/users/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil, Trash2, ListChecks, MessageSquareText, Eye, EyeOff, Phone, Mail, Home, MapPin, Users as UsersIconLucide, FileText, KeyRound, Loader2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { amapaMunicipalities, organizationalUnits } from '@/lib/mockData'; // For municipality list
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { firebaseInitializedCorrectly, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { MultiSelect } from '../ui/multi-select';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';


interface UserListProps {
  users: UserWithActivityCount[];
  currentAdminId: string;
  onUserUpdate: (userId: string, updatedData: Partial<AppUserType>) => Promise<void>;
  onUserDelete: (userId: string, userName: string) => Promise<void>;
  getRoleDisplayName: (role: AppUserType['role']) => string;
}

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

const editUserFormSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  cpf: cpfValidation,
  role: z.enum(['farmer', 'technician', 'admin', 'GabineteGov', 'Diagro', 'SDR'], { required_error: "A função é obrigatória." }),
  registrationStatus: z.enum(['Pendente', 'Confirmado', 'Inapto']).optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: 'E-mail inválido.' }).optional().or(z.literal('')),
  address: z.string().optional(),
  organizationalUnit: z.string().optional(),
  municipality: z.string().optional(),
  familyMembers: z.coerce.number().int().nonnegative().optional(),
  assignedMunicipalities: z.array(z.string()).optional(),
  caf: cafValidation.optional(),
})
.superRefine((data, ctx) => {
  if (data.role === 'farmer') {
    if (!data.phone || !phoneRegex.test(data.phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Telefone inválido. Use (xx)xxxxx-xxxx ou (xx)xxxx-xxxx. Obrigatório para agricultor.',
        path: ['phone'],
      });
    }
    if (!data.address || data.address.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Endereço deve ter pelo menos 5 caracteres para agricultor.',
        path: ['address'],
      });
    }
    if (!data.municipality) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Município é obrigatório para agricultor.',
        path: ['municipality'],
      });
    }
     if (!data.organizationalUnit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unidade Organizacional é obrigatória para agricultor.',
        path: ['organizationalUnit'],
      });
    }
    if (data.familyMembers === undefined || data.familyMembers < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nº de componentes familiares deve ser zero ou mais para agricultor.',
        path: ['familyMembers'],
      });
    }
  }
});

type EditUserFormValues = z.infer<typeof editUserFormSchema>;

const passwordFormSchema = z.object({
  password: z.string().min(6, { message: "A nova senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});


type PasswordFormValues = z.infer<typeof passwordFormSchema>;


const RegistrationStatusBadge = ({ status }: { status?: RegistrationStatus }) => {
    if (!status) return null;
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    if (status === 'Confirmado') variant = 'default';
    if (status === 'Pendente') variant = 'secondary';
    if (status === 'Inapto') variant = 'destructive';

    return <Badge variant={variant} className="ml-2">{status}</Badge>;
}

export default function UserList({ users, currentAdminId, onUserUpdate, onUserDelete, getRoleDisplayName }: UserListProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithActivityCount | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserWithActivityCount | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const { toast } = useToast();
  const { user: currentAdmin } = useAuth(); // Get current admin user details from useAuth

  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      name: '',
      cpf: '',
      role: 'farmer',
      registrationStatus: 'Pendente',
      phone: '',
      email: '',
      address: '',
      organizationalUnit: '',
      municipality: '',
      familyMembers: 0,
      assignedMunicipalities: [],
      caf: '',
    }
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const watchedRole = watch('role', editingUser?.role);
  const organizationalUnitOptions = organizationalUnits.map(m => ({ value: m, label: m }));
  const organizationalUnitOptionsList = organizationalUnits.map(u => ({ value: u, label: u }));
  const filteredMunicipalities = amapaMunicipalities.filter(m => !["Água Branca do Cajarí", "Pacuí", "Bailique", "Maruanum"].includes(m));


  const handleEditClick = (user: UserWithActivityCount) => {
    setEditingUser(user);
    reset({
      name: user.name,
      cpf: user.cpf,
      role: user.role,
      registrationStatus: user.registrationStatus || 'Pendente',
      phone: user.phone || '',
      email: user.email || '',
      address: user.address || '',
      organizationalUnit: user.organizationalUnit || '',
      municipality: user.municipality || '',
      familyMembers: user.familyMembers !== undefined ? user.familyMembers : 0,
      assignedMunicipalities: user.assignedMunicipalities || [],
      caf: user.caf || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (user: UserWithActivityCount) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await onUserDelete(userToDelete.id, userToDelete.name);
      setUserToDelete(null);
    }
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
    let digits = e.target.value.replace(/\D/g, '');
    if (digits.length > 17) {
      digits = digits.substring(0, 17);
    }

    if (digits.length === 0) {
      fieldOnChange('');
      return;
    }
    
    let formatted = `AP`;
    if (digits.length > 0) formatted += digits.substring(0, 6);
    if (digits.length > 6) formatted += `.${digits.substring(6, 8)}`;
    if (digits.length > 8) formatted += `.${digits.substring(8, 17)}`;
    if (digits.length === 17) formatted += `CAF`;
    
    e.target.value = formatted;
    fieldOnChange(digits.length === 17 ? formatted : digits);
  };

  const onSubmitEdit = async (data: EditUserFormValues) => {
    if (!editingUser) return;
    
    if (editingUser.id === 'Cp9ZO2xfwCVRfuCXFhKpetUVJFz1' && data.role !== 'admin') {
      toast({
        title: "Operação Não Permitida",
        description: "A função do Administrador Master não pode ser alterada.",
        variant: "destructive",
      });
      return;
    }

    const userDataToUpdate: Partial<AppUserType> = {
      name: data.name,
      role: data.role,
      email: data.email || undefined,
    };

    if (data.role === 'farmer') {
      userDataToUpdate.phone = data.phone;
      userDataToUpdate.address = data.address;
      userDataToUpdate.organizationalUnit = data.organizationalUnit;
      userDataToUpdate.municipality = data.municipality;
      userDataToUpdate.familyMembers = data.familyMembers;
      userDataToUpdate.caf = data.caf;
      userDataToUpdate.registrationStatus = data.registrationStatus;
      userDataToUpdate.assignedMunicipalities = undefined;
    } else if (data.role === 'technician') {
        userDataToUpdate.assignedMunicipalities = data.assignedMunicipalities;
        userDataToUpdate.phone = undefined;
        userDataToUpdate.address = undefined;
        userDataToUpdate.organizationalUnit = undefined;
        userDataToUpdate.municipality = undefined;
        userDataToUpdate.familyMembers = undefined;
        userDataToUpdate.caf = undefined;
        userDataToUpdate.registrationStatus = undefined;
    } else { // Admin or External Users
      userDataToUpdate.phone = undefined;
      userDataToUpdate.address = undefined;
      userDataToUpdate.organizationalUnit = undefined;
      userDataToUpdate.municipality = undefined;
      userDataToUpdate.familyMembers = undefined;
      userDataToUpdate.assignedMunicipalities = undefined;
      userDataToUpdate.caf = undefined;
      userDataToUpdate.registrationStatus = undefined;
    }

    await onUserUpdate(editingUser.id, userDataToUpdate);
    setIsEditDialogOpen(false);
    setEditingUser(null);
  };

  const handlePasswordReset = async (data: PasswordFormValues) => {
    if (!editingUser) {
        toast({ title: "Erro", description: "Usuário alvo não está selecionado.", variant: "destructive" });
        return;
    }
    setIsUpdatingPassword(true);
    // This is now a placeholder as the backend cannot execute this securely.
    toast({
        title: "Função Desabilitada",
        description: "A alteração de senha por um administrador não está disponível neste ambiente. Use o console do Firebase.",
        variant: "destructive",
    });
    setIsUpdatingPassword(false);
    setIsPasswordDialogOpen(false);
    passwordForm.reset();
  };

  const getDeleteButtonTitle = (user: UserWithActivityCount): string => {
    if (user.id === 'Cp9ZO2xfwCVRfuCXFhKpetUVJFz1') {
      return "O Administrador Master não pode ser removido.";
    }
    if (user.id === currentAdminId) {
      return "Você não pode remover seu próprio usuário.";
    }
    if (user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1) {
      return "Não é possível remover o único administrador.";
    }
    if (user.role === 'farmer' && (user.requestCount ?? 0) > 0) {
      return "Este agricultor possui Solicitações e não pode ser removido.";
    }
    if (user.role === 'technician' && (user.responseCount ?? 0) > 0) {
      return "Este técnico possui respostas e não pode ser removido.";
    }
    return "Remover documento do usuário (Auth user não será afetado)";
  };


  return (
    <>
      <Card className="shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF (Login)</TableHead>
              <TableHead>Função</TableHead>
              <TableHead className="text-center">Status do Cadastro</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <ListChecks className="inline-block h-4 w-4" /> Solicitações
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <MessageSquareText className="inline-block h-4 w-4" /> Respostas
                </div>
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.cpf}</TableCell>
                <TableCell>{getRoleDisplayName(user.role)}</TableCell>
                <TableCell className="text-center">
                  {user.role === 'farmer' ? <RegistrationStatusBadge status={user.registrationStatus} /> : 'N/A'}
                </TableCell>
                <TableCell className="text-center">
                  {user.role === 'farmer' || user.role === 'technician'
                    ? (user.requestCount !== undefined ? user.requestCount : '-')
                    : 'N/A'}
                </TableCell>
                 <TableCell className="text-center">
                  {user.role === 'technician'
                    ? (user.responseCount !== undefined ? user.responseCount : '-')
                    : 'N/A'}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {!(user.id === 'Cp9ZO2xfwCVRfuCXFhKpetUVJFz1' && currentAdminId !== user.id) && (
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(user)}
                    disabled={
                      user.id === 'Cp9ZO2xfwCVRfuCXFhKpetUVJFz1' ||
                      user.id === currentAdminId ||
                      (user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1) ||
                      (user.role === 'farmer' && (user.requestCount ?? 0) > 0) ||
                      (user.role === 'technician' && (user.responseCount ?? 0) > 0)
                    }
                    title={getDeleteButtonTitle(user)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Remover
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {editingUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {setIsEditDialogOpen(open); if(!open) setEditingUser(null);}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuário: {editingUser.name}</DialogTitle>
              <DialogDescription>
                Modifique os dados do usuário.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmitEdit)}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-name">Nome Completo</Label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => <Input id="edit-name" {...field} />}
                  />
                  {errors.name && <p className="text-xs text-destructive pt-1">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-cpf">CPF (Não editável)</Label>
                  <Controller
                    name="cpf"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="edit-cpf"
                        {...field}
                        readOnly
                        className="bg-muted/50"
                      />
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-role">Função</Label>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={editingUser?.id === 'Cp9ZO2xfwCVRfuCXFhKpetUVJFz1'}
                      >
                        <SelectTrigger id="edit-role">
                          <SelectValue placeholder="Selecione uma função" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="farmer">Agricultor</SelectItem>
                          <SelectItem value="technician">Técnico</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="GabineteGov">Gabinete Gov.</SelectItem>
                          <SelectItem value="Diagro">Diagro</SelectItem>
                          <SelectItem value="SDR">SDR</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.role && <p className="text-xs text-destructive pt-1">{errors.role.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-email" className="flex items-center"><Mail className="mr-1.5 h-3.5 w-3.5" />E-mail (Opcional)</Label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => <Input id="edit-email" type="email" placeholder="email@example.com" {...field} />}
                  />
                  {errors.email && <p className="text-xs text-destructive pt-1">{errors.email.message}</p>}
                </div>
                
                {watchedRole === 'technician' && (
                  <div className="space-y-1">
                    <Label htmlFor="edit-assignedMunicipalities">Municípios Atribuídos</Label>
                     <p className="text-xs text-muted-foreground">O técnico só verá as solicitações dos municípios selecionados. Se nenhum for selecionado, ele verá todos.</p>
                    <Controller
                      name="assignedMunicipalities"
                      control={control}
                      render={({ field }) => (
                        <MultiSelect
                          options={organizationalUnitOptions}
                          selected={field.value || []}
                          onChange={field.onChange}
                          className="w-full"
                          placeholder="Selecione os municípios..."
                        />
                      )}
                    />
                    {errors.assignedMunicipalities && <p className="text-xs text-destructive pt-1">{errors.assignedMunicipalities.message}</p>}
                  </div>
                )}


                {watchedRole === 'farmer' && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="edit-registrationStatus">Status do Cadastro</Label>
                       <Controller
                        name="registrationStatus"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="edit-registrationStatus">
                              <SelectValue placeholder="Selecione um status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pendente">Pendente</SelectItem>
                              <SelectItem value="Confirmado">Confirmado</SelectItem>
                              <SelectItem value="Inapto">Inapto</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-caf" className="flex items-center"><FileText className="mr-1.5 h-3.5 w-3.5" />CAF (Opcional)</Label>
                      <Controller
                        name="caf"
                        control={control}
                        render={({ field }) => <Input id="edit-caf" placeholder="APxxxxxx.xx.xxxxxxxxxCAF" {...field} onChange={(e) => handleCafInputChange(e, field.onChange)} />}
                      />
                      {errors.caf && <p className="text-xs text-destructive pt-1">{errors.caf.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-phone" className="flex items-center"><Phone className="mr-1.5 h-3.5 w-3.5" />Telefone</Label>
                      <Controller
                        name="phone"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="edit-phone"
                            placeholder="(xx) xxxxx-xxxx"
                            {...field}
                            onChange={(e) => handlePhoneInputChange(e, field.onChange)}
                            maxLength={15}
                          />
                        )}
                      />
                      {errors.phone && <p className="text-xs text-destructive pt-1">{errors.phone.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-address" className="flex items-center"><Home className="mr-1.5 h-3.5 w-3.5" />Endereço</Label>
                      <Controller
                        name="address"
                        control={control}
                        render={({ field }) => <Input id="edit-address" placeholder="Rua, Número, Bairro..." {...field} />}
                      />
                      {errors.address && <p className="text-xs text-destructive pt-1">{errors.address.message}</p>}
                    </div>
                     <div className="space-y-1">
                      <Label htmlFor="edit-municipality" className="flex items-center"><MapPin className="mr-1.5 h-3.5 w-3.5" />Município</Label>
                      <Controller
                        name="municipality"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="edit-municipality">
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
                    <div className="space-y-1">
                      <Label htmlFor="edit-organizationalUnit" className="flex items-center"><MapPin className="mr-1.5 h-3.5 w-3.5" />Unidade Organizacional</Label>
                      <Controller
                        name="organizationalUnit"
                        control={control}
                        render={({ field }) => (
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger id="organizationalUnit">
                                <SelectValue placeholder="Selecione uma unidade" />
                                </SelectTrigger>
                                <SelectContent>
                                {organizationalUnitOptionsList.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        )}
                      />
                      {errors.organizationalUnit && <p className="text-xs text-destructive pt-1">{errors.organizationalUnit.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-familyMembers" className="flex items-center"><UsersIconLucide className="mr-1.5 h-3.5 w-3.5" />Nº de Componentes Familiares</Label>
                      <Controller
                        name="familyMembers"
                        control={control}
                        render={({ field }) => <Input id="edit-familyMembers" type="number" min="0" placeholder="Ex: 4" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />}
                      />
                      {errors.familyMembers && <p className="text-xs text-destructive pt-1">{errors.familyMembers.message}</p>}
                    </div>
                  </>
                )}
              </div>
              <DialogFooter className="pt-4 items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button type="button" variant="secondary" onClick={() => setIsPasswordDialogOpen(true)} disabled>
                            <KeyRound className="mr-2 h-4 w-4" /> Alterar Senha
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Esta função requer um backend seguro com a SDK Admin.<br/> Use o console do Firebase para alterar senhas.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex-grow"></div>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

       {editingUser && (
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Alterar Senha para {editingUser.name}</DialogTitle>
                    <DialogDescription>
                        Esta funcionalidade não está disponível. Use o console do Firebase para redefinir a senha.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordReset)}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1">
                            <Label htmlFor="password">Nova Senha</Label>
                            <Controller
                                name="password"
                                control={passwordForm.control}
                                render={({ field }) => (
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Mínimo 6 caracteres"
                                        {...field}
                                        disabled
                                    />
                                )}
                            />
                            {passwordForm.formState.errors.password && <p className="text-xs text-destructive pt-1">{passwordForm.formState.errors.password.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                            <Controller
                                name="confirmPassword"
                                control={passwordForm.control}
                                render={({ field }) => (
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Repita a nova senha"
                                        {...field}
                                        disabled
                                    />
                                )}
                            />
                            {passwordForm.formState.errors.confirmPassword && <p className="text-xs text-destructive pt-1">{passwordForm.formState.errors.confirmPassword.message}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={true}>
                            <KeyRound className="mr-2 h-4" />
                            Confirmar Alteração
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      )}

      {userToDelete && (
         <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover o documento do usuário "{userToDelete.name}" (CPF: {userToDelete.cpf}) do Firestore? Esta ação não pode ser desfeita e o usuário Firebase Auth correspondente não será removido por esta ação.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Remover Documento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className || ''}`}
      {...props}
    />
  )
);
Card.displayName = "Card";
