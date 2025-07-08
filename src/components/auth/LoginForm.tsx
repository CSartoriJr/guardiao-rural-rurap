
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { APP_ROUTES } from '@/config/routes';
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';

export default function LoginForm() {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf) {
      toast({ title: "Erro de Validação", description: "O CPF é obrigatório.", variant: "destructive" });
      return;
    }
    if (!password) {
      toast({ title: "Erro de Validação", description: "A senha é obrigatória.", variant: "destructive" });
      return;
    }
    
    // A função login espera apenas os números do CPF.
    const numericCpf = cpf.replace(/\D/g, '');
    const loggedInUser = await login(numericCpf, password); 
    if (loggedInUser) {
      toast({ title: "Login bem-sucedido", description: `Bem-vindo(a) de volta, ${loggedInUser.name}!` });
      if (loggedInUser.role === 'farmer') {
        router.push(APP_ROUTES.FARMER_DASHBOARD);
      } else if (loggedInUser.role === 'technician') {
        router.push(APP_ROUTES.TECHNICIAN_DASHBOARD);
      } else if (loggedInUser.role === 'admin') {
        router.push(APP_ROUTES.ADMIN_DASHBOARD);
      }
    } else {
      toast({
        title: 'Falha no Login',
        description: 'CPF ou senha inválidos. Por favor, tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permite apenas a entrada de números
    const value = e.target.value.replace(/\D/g, '');
    // Limita o CPF a 11 dígitos
    setCpf(value.substring(0, 11));
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          type="text" // Usar 'text' para ter controle total sobre o valor
          value={cpf}
          onChange={handleCpfChange}
          placeholder="Digite os 11 dígitos do CPF"
          maxLength={11} // Limita o input a 11 caracteres
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua senha"
            required
          />
          <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
         <p className="text-xs text-muted-foreground">Use o CPF e a senha cadastrados.</p>
      </div>
      <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={authLoading}>
        {authLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="mr-2 h-4 w-4" />
        )}
        Entrar
      </Button>
    </form>
  );
}
