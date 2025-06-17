
'use client';
import React, { useState } from 'react';
import type { User as AppUserType } from '@/types'; // Use AppUserType
import type { UserWithActivityCount } from '@/app/admin/users/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, ListChecks, MessageSquareText, Eye, EyeOff, Phone, Mail, Home, MapPin, Users as UsersIconLucide } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { amapaMunicipalities } from '@/lib/mockData'; // For municipality list
import { useToast } from '@/hooks/use-toast';
import { firebaseInitializedCorrectly, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';


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

const editUserFormSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  cpf: cpfValidation, // CPF is generally not editable after creation due to its use as a unique ID for auth
  role: z.enum(['farmer', 'technician', 'admin'], { required_error: "A função é obrigatória." }),
  // Password changes are complex client-side and typically require re-authentication or Admin SDK.
  // We'll omit direct password editing from this client-side form for simplicity and security.
  // password: z.string().optional(),
  // confirmPassword: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(), // This is the contact email, not the Firebase Auth email (which is CPF-based)
  address: z.string().optional(),
  municipality: z.string().optional(),
  familyMembers: z.coerce.number().int().nonnegative().optional(),
})
// .refine(data => { // Password confirmation logic removed as password field is removed
//   if (data.password && data.password.length > 0) {
//     if (data.password.length < 6) return false;
//     return data.password === data.confirmPassword;
//   }
//   return true;
// }, {
//   message: "As senhas não coincidem ou a nova senha é muito curta (mínimo 6 caracteres).",
//   path: ["confirmPassword"], 
// })
.superRefine((data, ctx) => {
  if (data.role === 'farmer') {
    if (!data.phone || !phoneRegex.test(data.phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Telefone inválido. Use (xx)xxxxx-xxxx ou (xx)xxxx-xxxx. Obrigatório para agricultor.',
        path: ['phone'],
      });
    }
    if (!data.email || !z.string().email().safeParse(data.email).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'E-mail de contato inválido ou obrigatório para agricultor.',
        path: ['email'],
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

export default function UserList({ users, currentAdminId, onUserUpdate, onUserDelete, getRoleDisplayName }: UserListProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithActivityCount | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserWithActivityCount | null>(null);
  // const [showPasswordInModal, setShowPasswordInModal] = useState(false); // Password fields removed
  // const [showConfirmPasswordInModal, setShowConfirmPasswordInModal] = useState(false); // Password fields removed
  const { toast } = useToast();

  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      name: '',
      cpf: '', // Will be read-only in form
      role: 'farmer',
      // password: '', // Removed
      // confirmPassword: '', // Removed
      phone: '',
      email: '',
      address: '',
      municipality: '',
      familyMembers: 0,
    }
  });
  
  const watchedRole = watch('role', editingUser?.role);

  const handleEditClick = (user: UserWithActivityCount) => {
    setEditingUser(user);
    reset({
      name: user.name,
      cpf: user.cpf, // CPF shown but not editable
      role: user.role,
      // password: '', // Removed
      // confirmPassword: '', // Removed
      phone: user.phone || '',
      email: user.email || '', // This is the contact email
      address: user.address || '',
      municipality: user.municipality || '',
      familyMembers: user.familyMembers !== undefined ? user.familyMembers : 0,
    });
    // setShowPasswordInModal(false); // Removed
    // setShowConfirmPasswordInModal(false); // Removed
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (user: UserWithActivityCount) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await onUserDelete(userToDelete.id, userToDelete.name); // This now calls deleteUserFirestoreDocument
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


  const onSubmitEdit = async (data: EditUserFormValues) => {
    if (!editingUser) return;

    // CPF check removed as it's not editable in this form.
    // Password change logic removed.

    const userDataToUpdate: Partial<AppUserType> = {
      name: data.name,
      // cpf: data.cpf, // CPF not updated from here
      role: data.role,
      // password not updated here
    };

    if (data.role === 'farmer') {
      userDataToUpdate.phone = data.phone;
      userDataToUpdate.email = data.email; // Contact email
      userDataToUpdate.address = data.address;
      userDataToUpdate.municipality = data.municipality;
      userDataToUpdate.familyMembers = data.familyMembers;
    } else {
      // Explicitly set farmer fields to undefined if role is not farmer
      userDataToUpdate.phone = undefined;
      userDataToUpdate.email = undefined;
      userDataToUpdate.address = undefined;
      userDataToUpdate.municipality = undefined;
      userDataToUpdate.familyMembers = undefined;
    }

    await onUserUpdate(editingUser.id, userDataToUpdate);
    setIsEditDialogOpen(false);
    setEditingUser(null);
  };

  const getDeleteButtonTitle = (user: UserWithActivityCount): string => {
    if (user.id === currentAdminId) {
      return "Você não pode remover seu próprio usuário.";
    }
    if (user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1) {
      return "Não é possível remover o único administrador.";
    }
    if (user.role === 'farmer' && (user.requestCount ?? 0) > 0) {
      return "Este agricultor possui pedidos e não pode ser removido.";
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
              <TableHead className="text-center">
                <div className="flex items-center justify-center">
                  <ListChecks className="inline-block mr-1 h-4 w-4" /> Pedidos / <MessageSquareText className="inline-block ml-1 mr-1 h-4 w-4" /> Respostas
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
                  {user.role === 'farmer'
                    ? (user.requestCount !== undefined ? user.requestCount : '-')
                    : user.role === 'technician'
                    ? (user.responseCount !== undefined ? user.responseCount : '-')
                    : 'N/A'}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(user)}
                    disabled={
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
                Modifique os dados do usuário abaixo. Clique em salvar quando terminar. O CPF e a senha não são editáveis aqui.
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="edit-role">
                          <SelectValue placeholder="Selecione uma função" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="farmer">Agricultor</SelectItem>
                          <SelectItem value="technician">Técnico</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.role && <p className="text-xs text-destructive pt-1">{errors.role.message}</p>}
                </div>
                
                {/* Password fields removed for client-side simplicity */}

                {watchedRole === 'farmer' && (
                  <>
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
                      <Label htmlFor="edit-email" className="flex items-center"><Mail className="mr-1.5 h-3.5 w-3.5" />E-mail de Contato</Label>
                      <Controller
                        name="email"
                        control={control}
                        render={({ field }) => <Input id="edit-email" type="email" placeholder="email@example.com" {...field} />}
                      />
                      {errors.email && <p className="text-xs text-destructive pt-1">{errors.email.message}</p>}
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
              <DialogFooter className="pt-4">
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
