
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { CacaBruxaLogo } from './Logo';
import { APP_ROUTES } from '@/config/routes';
import { LogOut, UserCircle, LayoutDashboard, PlusCircle, BarChart3 } from 'lucide-react';

export default function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push(APP_ROUTES.LOGIN);
  };

  if (!user) return null;

  const userRoleDisplay = user.role === 'farmer' ? 'Agricultor' : 'Técnico';

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href={user.role === 'farmer' ? APP_ROUTES.FARMER_DASHBOARD : APP_ROUTES.TECHNICIAN_DASHBOARD}>
          <CacaBruxaLogo />
        </Link>
        <nav className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            <UserCircle className="inline h-4 w-4 mr-1" />
            {user.name} ({userRoleDisplay})
          </span>
          {user.role === 'farmer' && (
            <Link href={APP_ROUTES.FARMER_DASHBOARD} passHref>
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Painel
              </Button>
            </Link>
          )}
           {user.role === 'farmer' && (
            <Link href={APP_ROUTES.FARMER_SUBMIT_REQUEST} passHref>
              <Button variant="ghost" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Pedido
              </Button>
            </Link>
          )}
          {user.role === 'technician' && (
             <Link href={APP_ROUTES.TECHNICIAN_DASHBOARD} passHref>
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Painel
              </Button>
            </Link>
          )}
          {user.role === 'technician' && (
            <Link href={APP_ROUTES.TECHNICIAN_ANALYTICS_PANEL}>
              <Button variant="ghost" size="sm"><BarChart3 className="mr-2 h-4 w-4" /> Análise</Button>
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout} className="text-destructive hover:bg-destructive/10 border-destructive/50 hover:border-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </nav>
      </div>
    </header>
  );
}
