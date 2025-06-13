'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { APP_ROUTES } from '@/config/routes';
import { Loader2, LogIn } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Mock password, not used in mockUsers
  const [role, setRole] = useState<'farmer' | 'technician'>('farmer');
  const { login, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Erro de Validação", description: "O email é obrigatório.", variant: "destructive" });
      return;
    }
    const user = await login(email, role);
    if (user) {
      toast({ title: "Login bem-sucedido", description: `Bem-vindo(a) de volta, ${user.name}!` });
      if (user.role === 'farmer') {
        router.push(APP_ROUTES.FARMER_DASHBOARD);
      } else {
        router.push(APP_ROUTES.TECHNICIAN_DASHBOARD);
      }
    } else {
      toast({
        title: 'Falha no Login',
        description: 'Email ou função inválidos. Por favor, tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
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
         <p className="text-xs text-muted-foreground">Nota: Para demonstração, qualquer senha funciona. Email e função devem corresponder aos dados fictícios.</p>
      </div>
      <div className="space-y-2">
        <Label>Função</Label>
        <RadioGroup
          value={role}
          onValueChange={(value: 'farmer' | 'technician') => setRole(value)}
          className="flex space-x-4 pt-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="farmer" id="role-farmer" />
            <Label htmlFor="role-farmer" className="font-normal">Agricultor</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="technician" id="role-technician" />
            <Label htmlFor="role-technician" className="font-normal">Técnico</Label>
          </div>
        </RadioGroup>
      </div>
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
