
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// RadioGroup no longer needed for role selection
import { useToast } from '@/hooks/use-toast';
import { APP_ROUTES } from '@/config/routes';
import { Loader2, LogIn } from 'lucide-react';

export default function LoginForm() {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf) {
      toast({ title: "Erro de Validação", description: "O CPF é obrigatório.", variant: "destructive" });
      return;
    }
    // Password validation could be added here if needed
    const user = await login(cpf, password); 
    if (user) {
      toast({ title: "Login bem-sucedido", description: `Bem-vindo(a) de volta, ${user.name}!` });
      // Redirect based on user role from the authenticated user object
      if (user.role === 'farmer') {
        router.push(APP_ROUTES.FARMER_DASHBOARD);
      } else if (user.role === 'technician') {
        router.push(APP_ROUTES.TECHNICIAN_DASHBOARD);
      } else if (user.role === 'admin') {
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

  // Basic CPF formatting as user types (optional, can be improved)
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 11) value = value.substring(0, 11); // Limit to 11 digits

    // Apply formatting XXX.XXX.XXX-XX
    if (value.length > 9) {
      value = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}-${value.substring(9)}`;
    } else if (value.length > 6) {
      value = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6)}`;
    } else if (value.length > 3) {
      value = `${value.substring(0, 3)}.${value.substring(3)}`;
    }
    setCpf(value);
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          type="text" // Changed from email
          value={cpf}
          onChange={handleCpfChange}
          placeholder="000.000.000-00"
          maxLength={14} // Max length for XXX.XXX.XXX-XX
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
         <p className="text-xs text-muted-foreground">Nota: Para demonstração, qualquer senha funciona. O CPF deve corresponder aos dados fictícios.</p>
      </div>
      {/* Role selection RadioGroup removed */}
      <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="mr-2 h-4 w-4" />
        )}
        Entrar
      </Button>
    </form>
  );
}
