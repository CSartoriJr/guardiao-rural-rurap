'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { CacaBruxaLogo } from './Logo';
import { APP_ROUTES } from '@/config/routes';
import { LogOut, UserCircle, LayoutDashboard, BarChart3, Users, KeyRound, TractorIcon, Trash2 } from 'lucide-react';
import ChangePasswordDialog from './ChangePasswordDialog';

export default function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push(APP_ROUTES.LOGIN);
  };

  if (!user) return null;

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'farmer': return 'Agricultor';
      case 'technician': return 'Técnico';
      case 'admin': return 'Administrador';
      case 'GabineteGov': return 'Gabinete Gov.';
      case 'Diagro': return 'Diagro';
      case 'SDR': return 'SDR';
      case 'Gestão': return 'Gestão';
      default: return 'Usuário';
    }
  }
  const userRoleDisplay = getRoleDisplayName(user.role);
  
  let homeDashboardLink = APP_ROUTES.LOGIN;
  if (user.role === 'farmer') homeDashboardLink = APP_ROUTES.FARMER_DASHBOARD;
  else if (user.role === 'technician') homeDashboardLink = APP_ROUTES.TECHNICIAN_DASHBOARD;
  else if (user.role === 'admin' || user.role === 'Gestão') homeDashboardLink = APP_ROUTES.ADMIN_DASHBOARD;
  else if (['GabineteGov', 'Diagro', 'SDR'].includes(user.role)) homeDashboardLink = APP_ROUTES.TECHNICIAN_ANALYTICS_PANEL;


  return (
    <>
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href={homeDashboardLink}>
          <CacaBruxaLogo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <span className="text-sm text-muted-foreground hidden md:inline-flex items-center">
            <UserCircle className="inline h-5 w-5 mr-1" />
            {user.name} ({userRoleDisplay})
          </span>
          
          {/* Farmer Links */}
          {user.role === 'farmer' && (
            <>
              <Link href={APP_ROUTES.FARMER_DASHBOARD}>
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline">Painel</span>
                </Button>
              </Link>
            </>
          )}

          {/* Technician Links */}
           {user.role === 'technician' && (
            <>
              <Link href={APP_ROUTES.TECHNICIAN_DASHBOARD}>
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline">Painel</span>
                </Button>
              </Link>
               <Link href={APP_ROUTES.TECHNICIAN_FARMERS_LIST}>
                <Button variant="ghost" size="sm">
                  <TractorIcon className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline">Agricultores</span>
                </Button>
              </Link>
            </>
          )}

          {/* Admin & Gestão Links */}
          {(user.role === 'admin' || user.role === 'Gestão') && (
            <>
              <Link href={APP_ROUTES.ADMIN_DASHBOARD}>
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline">Painel</span>
                </Button>
              </Link>
              <Link href={APP_ROUTES.ADMIN_MANAGE_USERS}>
                <Button variant="ghost" size="sm">
                  <Users className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline">Usuários</span>
                </Button>
              </Link>
              <Link href={APP_ROUTES.TECHNICIAN_ANALYTICS_PANEL}>
                <Button variant="ghost" size="sm">
                  <BarChart3 className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline">Análise</span>
                </Button>
              </Link>
            </>
          )}

          {/* External User Links */}
          {['GabineteGov', 'Diagro', 'SDR'].includes(user.role) && (
             <>
              <Link href={APP_ROUTES.TECHNICIAN_ANALYTICS_PANEL}>
                <Button variant="ghost" size="sm">
                  <BarChart3 className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline">Painel de Análise</span>
                </Button>
              </Link>
              <Link href={APP_ROUTES.TECHNICIAN_FARMERS_LIST}>
                <Button variant="ghost" size="sm">
                  <Users className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline">Agricultores</span>
                </Button>
              </Link>
            </>
          )}

          <Button variant="ghost" size="sm" onClick={() => setIsPasswordDialogOpen(true)}>
             <KeyRound className="h-5 w-5 md:mr-2" />
             <span className="hidden md:inline">Alterar Senha</span>
          </Button>

          {user.role === 'farmer' && (
             <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" asChild>
                <Link href={APP_ROUTES.FARMER_REQUEST_DELETION}>
                  <Trash2 className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline">Excluir</span>
                </Link>
              </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleLogout} className="text-destructive hover:bg-destructive/10 border-destructive/50 hover:border-destructive">
            <LogOut className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Sair</span>
          </Button>
        </nav>
      </div>
    </header>
    <ChangePasswordDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen} />
    </>
  );
}
