'use client';
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "A senha atual é obrigatória." }),
  password: z.string().min(6, { message: 'A nova senha deve ter pelo menos 6 caracteres.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { updateCurrentUserPassword } = useAuth();
  const { toast } = useToast();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    setIsSubmitting(true);
    try {
      await updateCurrentUserPassword(data.currentPassword, data.password);
      toast({
        title: 'Sucesso!',
        description: 'Sua senha foi alterada. Por favor, faça login novamente.',
      });
      // No need to close dialog, as the logout will unmount this page wrapper
    } catch (error: any) {
      console.error("Falha ao alterar senha:", error);
      toast({
        title: "Falha ao Alterar Senha",
        description: error.message || "Ocorreu um erro. Pode ser necessário fazer login novamente.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };
  
  React.useEffect(() => {
    if (!open) {
      reset();
      setShowCurrentPassword(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Senha</DialogTitle>
          <DialogDescription>
            Para sua segurança, por favor, confirme sua senha atual antes de definir uma nova. Você será desconectado após a alteração.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <div className="relative">
                <Controller
                  name="currentPassword"
                  control={control}
                  render={({ field }) => <Input id="currentPassword" type={showCurrentPassword ? "text" : "password"} placeholder="Digite sua senha atual" {...field} />}
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.currentPassword && <p className="text-xs text-destructive pt-1">{errors.currentPassword.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Nova Senha</Label>
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
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Repita a nova senha" {...field} />}
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive pt-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              Salvar Nova Senha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
