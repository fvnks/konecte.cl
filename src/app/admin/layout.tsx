
// src/app/admin/layout.tsx
'use client';

import React, { type ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Settings, Users, LayoutDashboard, ShieldAlert, CreditCard, ListOrdered, Brush, FileSearch, LogOut as LogOutIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/admin/appearance', label: 'Apariencia', icon: <Brush className="h-5 w-5" /> },
  { href: '/admin/settings', label: 'Google Sheets', icon: <Settings className="h-5 w-5" /> },
  { href: '/admin/users', label: 'Usuarios', icon: <Users className="h-5 w-5" /> },
  { href: '/admin/roles', label: 'Roles', icon: <ShieldAlert className="h-5 w-5" /> },
  { href: '/admin/plans', label: 'Planes', icon: <CreditCard className="h-5 w-5" /> },
  { href: '/admin/properties', label: 'Propiedades', icon: <ListOrdered className="h-5 w-5" /> },
  { href: '/admin/requests', label: 'Solicitudes', icon: <FileSearch className="h-5 w-5" /> },
];

interface StoredAdminUser {
  name: string;
  avatarUrl?: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<StoredAdminUser | null>(null);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const parsedUser: StoredAdminUser = JSON.parse(userJson);
        setAdminUser(parsedUser);
      } catch (e) {
        console.error("Error parsing admin user from localStorage for layout:", e);
        setAdminUser({ name: 'Admin' }); // Fallback
      }
    } else {
      setAdminUser({ name: 'Admin' }); // Fallback if no user in storage
    }
  }, []);

  const handleAdminLogout = () => {
    localStorage.removeItem('loggedInUser');
    toast({
      title: "Sesión Cerrada",
      description: "Has cerrado sesión del panel de administración.",
    });
    window.dispatchEvent(new Event('storage')); // Notificar a otros componentes (como Navbar)
    router.push('/');
  };

  const adminName = adminUser?.name || 'Admin PropSpot';
  const adminAvatarUrl = adminUser?.avatarUrl || `https://placehold.co/40x40.png?text=${adminName.substring(0,1)}`;
  const adminAvatarFallback = adminName.substring(0,1).toUpperCase();


  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="w-72 bg-background border-r p-5 space-y-6 hidden md:flex flex-col shadow-md">
        <div className="flex items-center gap-3 px-2 py-1">
          <Link href="/" className="flex items-center gap-3 text-primary group">
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Home className="h-7 w-7 text-primary" />
            </div>
            <span className="text-xl font-bold font-headline text-foreground group-hover:text-primary transition-colors">PropSpot Admin</span>
          </Link>
        </div>
        
        <Separator />

        <nav className="flex-grow space-y-1.5">
          {adminNavItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              asChild
              className="w-full justify-start text-base py-2.5 h-auto rounded-md hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
            >
              <Link href={item.href} className="flex items-center gap-3 px-3">
                {React.cloneElement(item.icon, { className: "h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" })}
                <span className="font-medium">{item.label}</span>
              </Link>
            </Button>
          ))}
        </nav>
        
        <Separator />
        
        <div className="mt-auto space-y-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border">
                <Avatar className="h-10 w-10">
                <AvatarImage src={adminAvatarUrl} alt={adminName} data-ai-hint="admin avatar"/>
                <AvatarFallback className="bg-primary text-primary-foreground">{adminAvatarFallback}</AvatarFallback>
                </Avatar>
                <div>
                <p className="text-sm font-semibold text-foreground">{adminName}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
                </div>
            </div>
          <Button variant="outline" onClick={handleAdminLogout} className="w-full text-base py-2.5 h-auto rounded-md border-destructive/50 text-destructive hover:bg-destructive/5 hover:text-destructive">
            <LogOutIcon className="mr-2 h-4 w-4" /> Cerrar Sesión
          </Button>
          <Button variant="outline" asChild className="w-full text-base py-2.5 h-auto rounded-md border-primary/50 text-primary hover:bg-primary/5 hover:text-primary">
            <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4 transform"/> Volver al Sitio
            </Link>
          </Button>
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col">
        <header className="bg-background border-b p-4 shadow-sm md:hidden">
            <div className="flex items-center justify-between">
                 <Link href="/admin" className="flex items-center gap-2 text-primary">
                    <LayoutDashboard className="h-6 w-6" />
                    <span className="text-lg font-bold font-headline">Admin</span>
                </Link>
                {/* Aquí podría ir un SheetTrigger para el menú móvil */}
            </div>
        </header>
        <main className="flex-grow p-6 sm:p-8 md:p-10 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
    
