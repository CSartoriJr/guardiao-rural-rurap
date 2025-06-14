
'use client';
import React, { useState } from 'react';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, ListChecks } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { mockUsers } from '@/lib/mockData'; // For CPF validation

// User type for this component, possibly with requestCount
type UserListItem = User & { requestCount?: number };

interface UserListProps {
  users: UserListItem[];
  currentAdminId: string;
  onUserUpdate: (userId: string, updatedData: Partial<User>) => Promise<void>;
  onUserDelete: (userId: string, userName: string) => Promise<void>;
  getRoleDisplayName: (role: User['role']) => string;
}

const cpfValidation = z.string().refine(cpf => {
  const numericCpf = cpf.replace(/\D/g, '');
  return numericCpf.length === 11;
}, { message: 'O CPF deve ter 11 dígitos.' });

const editUserFormSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  cpf: cpfValidation,
  role: z.enum(['farmer', 'technician', 'admin'], { required_error: "A função é obrigatória." }),
});

type EditUserFormValues = z.infer<typeof editUserFormSchema>;

export default function UserList({ users, currentAdminId, onUserUpdate, onUserDelete, getRoleDisplayName }: UserListProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);

  const { control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
  });

  const handleEditClick = (user: UserListItem) => {
    setEditingUser(user);
    reset({
      name: user.name,
      cpf: user.cpf,
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (user: UserListItem) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await onUserDelete(userToDelete.id, userToDelete.name);
      setUserToDelete(null); 
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

  const onSubmitEdit = async (data: EditUserFormValues) => {
    if (!editingUser) return;

    const normalizedNewCpf = data.cpf.replace(/\D/g, '');
    if (normalizedNewCpf !== editingUser.cpf.replace(/\D/g, '')) {
      const cpfExists = mockUsers.some(
        u => u.id !== editingUser.id && u.cpf.replace(/\D/g, '').toLowerCase() === normalizedNewCpf.toLowerCase()
      );
      if (cpfExists) {
        // This should ideally use toast, but alert is simpler for now in this component.
        alert('Este CPF já está cadastrado para outro usuário.'); 
        return;
      }
    }
    
    await onUserUpdate(editingUser.id, {
      name: data.name,
      cpf: data.cpf,
      role: data.role,
    });
    setIsEditDialogOpen(false);
    setEditingUser(null);
  };

  return (
    <>
      <Card className="shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Função</TableHead>
              <TableHead className="text-center">
                <ListChecks className="inline-block mr-1 h-4 w-4" /> Nº Pedidos
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
                  {user.role === 'farmer' ? (user.requestCount !== undefined ? user.requestCount : '-') : 'N/A'}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteClick(user)}
                    disabled={user.id === currentAdminId || (user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1)}
                    title={user.id === currentAdminId ? "Você não pode remover seu próprio usuário." : (user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1) ? "Não é possível remover o único administrador." : "Remover usuário"}
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Usuário: {editingUser.name}</DialogTitle>
              <DialogDescription>
                Modifique os dados do usuário abaixo. Clique em salvar quando terminar.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmitEdit)}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome Completo</Label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => <Input id="edit-name" {...field} />}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cpf">CPF</Label>
                  <Controller
                    name="cpf"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="edit-cpf" 
                        {...field} 
                        onChange={(e) => handleCpfInputChange(e, field.onChange)}
                        maxLength={14}
                      />
                    )}
                  />
                  {errors.cpf && <p className="text-sm text-destructive">{errors.cpf.message}</p>}
                </div>
                <div className="space-y-2">
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
                  {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
                </div>
              </div>
              <DialogFooter>
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
                Tem certeza que deseja remover o usuário "{userToDelete.name}" (CPF: {userToDelete.cpf})? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

// Dummy Card component if it's not globally available in this context
// Usually, it would be imported from "@/components/ui/card"
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
