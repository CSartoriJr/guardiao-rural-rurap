
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { CacaBruxaLogo } from './Logo';
import { APP_ROUTES } from '@/config/routes';
import { LogOut, UserCircle, LayoutDashboard, PlusCircle, BarChart3, UserPlus, Users } from 'lucide-react';

export default function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push(APP_ROUTES.LOGIN);
  };

  if (!user) return null;

  const userRoleDisplay = user.role === 'farmer' ? 'Agricultor' : user.role === 'technician' ? 'Técnico' : 'Administrador';
  
  let homeDashboardLink = APP_ROUTES.LOGIN;
  if (user.role === 'farmer') homeDashboardLink = APP_ROUTES.FARMER_DASHBOARD;
  else if (user.role === 'technician') homeDashboardLink = APP_ROUTES.TECHNICIAN_DASHBOARD;
  else if (user.role === 'admin') homeDashboardLink = APP_ROUTES.ADMIN_DASHBOARD;


  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href={homeDashboardLink}>
          <CacaBruxaLogo />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            <UserCircle className="inline h-4 w-4 mr-1" />
            {user.name} ({userRoleDisplay})
          </span>
          
          {/* Farmer Links */}
          {user.role === 'farmer' && (
            <>
              <Link href={APP_ROUTES.FARMER_DASHBOARD}>
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Painel
                </Button>
              </Link>
              <Link href={APP_ROUTES.FARMER_SUBMIT_REQUEST}>
                <Button variant="ghost" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" /> Novo Pedido
                </Button>
              </Link>
            </>
          )}

          {/* Technician Links */}
           {user.role === 'technician' && (
            <>
              <Link href={APP_ROUTES.TECHNICIAN_DASHBOARD}>
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Painel
                </Button>
              </Link>
              <Link href={APP_ROUTES.TECHNICIAN_ANALYTICS_PANEL}>
                <Button variant="ghost" size="sm"><BarChart3 className="mr-2 h-4 w-4" /> Análise</Button>
              </Link>
            </>
          )}

          {/* Admin Links */}
          {user.role === 'admin' && (
            <>
              <Link href={APP_ROUTES.ADMIN_DASHBOARD}>
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Painel Admin
                </Button>
              </Link>
              <Link href={APP_ROUTES.ADMIN_CREATE_TECHNICIAN}>
                <Button variant="ghost" size="sm">
                  <UserPlus className="mr-2 h-4 w-4" /> Criar Técnico
                </Button>
              </Link>
              <Link href={APP_ROUTES.ADMIN_MANAGE_USERS}>
                <Button variant="ghost" size="sm">
                  <Users className="mr-2 h-4 w-4" /> não consigo acessar esse menu
                </Button>
              </Link>
            </>
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

