
// src/app/dashboard/layout.tsx
'use client';

import React, { type ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LayoutDashboard, UserCircle, MessageSquare, Users, Edit, LogOut as LogOutIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { getTotalUnreadMessagesCountAction } from '@/actions/chatActions';
import { Badge } from '@/components/ui/badge';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface StoredUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

const dashboardNavItems = [
  { href: '/dashboard', label: 'Resumen', icon: <LayoutDashboard /> },
  { href: '/dashboard/messages', label: 'Mensajes', icon: <MessageSquare />, id: 'messagesLink' },
  { href: '/dashboard/crm', label: 'Mi CRM', icon: <Users /> },
  { href: '/profile', label: 'Mi Perfil', icon: <UserCircle /> },
  // { href: '/dashboard/properties', label: 'Mis Propiedades', icon: <Edit /> }, // Placeholder
  // { href: '/dashboard/requests', label: 'Mis Solicitudes', icon: <Search /> }, // Placeholder
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const parsedUser: StoredUser = JSON.parse(userJson);
        setCurrentUser(parsedUser);
      } catch (e) {
        console.error("Error parsing user from localStorage for layout:", e);
        setCurrentUser(null); 
      }
    } else {
      // No user in storage, redirect to signin if not already there.
      // This check might be too aggressive if some dashboard pages are public.
      // For now, assuming all dashboard pages require login.
      if (!pathname.startsWith('/auth')) { // Avoid redirect loop
        router.push('/auth/signin');
      }
    }
  }, [router, pathname]);

  useEffect(() => {
    async function fetchUnreadCount() {
      if (currentUser?.id) {
        const count = await getTotalUnreadMessagesCountAction(currentUser.id);
        setTotalUnreadCount(count);
      }
    }
    if (isClient) {
        fetchUnreadCount();
        // Optionally, set up an interval to poll for new messages
        // const intervalId = setInterval(fetchUnreadCount, 30000); // every 30 seconds
        // return () => clearInterval(intervalId);
    }
  }, [currentUser, isClient, pathname]); // Re-fetch if pathname changes (e.g., after marking as read)

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    toast({
      title: "Sesión Cerrada",
      description: "Has cerrado sesión de tu panel.",
    });
    window.dispatchEvent(new Event('storage')); // Notificar a otros componentes
    router.push('/');
  };

  const userName = currentUser?.name || 'Usuario';
  const userAvatarUrl = currentUser?.avatarUrl || `https://placehold.co/40x40.png?text=${userName.substring(0,1)}`;
  const userAvatarFallback = userName.substring(0,1).toUpperCase();

  if (!isClient || (!currentUser && !pathname.startsWith('/auth'))) {
     // Still loading or redirecting, show minimal or loading UI
     return <div className="flex min-h-screen justify-center items-center"><p>Cargando...</p></div>;
  }
  
  // If currentUser is null and we are on a non-auth page, means redirection should happen.
  // This prevents rendering the layout before redirect takes effect.
  if (!currentUser && !pathname.startsWith('/auth')) {
    return null; 
  }


  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="w-64 bg-background border-r p-5 space-y-6 hidden md:flex flex-col shadow-sm">
        <div className="flex items-center gap-3 px-2 py-1">
          <Link href="/" className="flex items-center gap-3 text-primary group">
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Home className="h-6 w-6 text-primary" />
            </div>
            <span className="text-lg font-bold font-headline text-foreground group-hover:text-primary transition-colors">PropSpot</span>
          </Link>
        </div>
        
        <Separator />

        <nav className="flex-grow space-y-1">
          {dashboardNavItems.map((item) => (
            <Button
              key={item.label}
              variant={pathname === item.href ? "secondary" : "ghost"}
              asChild
              className="w-full justify-start text-sm py-2.5 h-auto rounded-md hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
            >
              <Link href={item.href} className="flex items-center gap-3 px-3">
                {React.cloneElement(item.icon, { className: "h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" })}
                <span className="font-medium flex-1">{item.label}</span>
                {item.id === 'messagesLink' && totalUnreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Badge>
                )}
              </Link>
            </Button>
          ))}
        </nav>
        
        <Separator />
        
        <div className="mt-auto space-y-3">
            {currentUser && (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border">
                    <Avatar className="h-9 w-9">
                    <AvatarImage src={userAvatarUrl} alt={userName} data-ai-hint="usuario perfil"/>
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">{userAvatarFallback}</AvatarFallback>
                    </Avatar>
                    <div>
                    <p className="text-xs font-semibold text-foreground">{userName}</p>
                    <p className="text-xs text-muted-foreground">Usuario</p>
                    </div>
                </div>
            )}
          <Button variant="outline" onClick={handleLogout} className="w-full text-sm py-2.5 h-auto rounded-md border-destructive/50 text-destructive hover:bg-destructive/5 hover:text-destructive">
            <LogOutIcon className="mr-2 h-4 w-4" /> Cerrar Sesión
          </Button>
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col">
        <header className="bg-background border-b p-4 shadow-sm md:hidden">
            <div className="flex items-center justify-between">
                 <Link href="/dashboard" className="flex items-center gap-2 text-primary">
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="text-md font-bold font-headline">Mi Panel</span>
                </Link>
                {/* Aquí podría ir un SheetTrigger para el menú móvil del dashboard */}
            </div>
        </header>
        <main className="flex-grow p-4 sm:p-6 md:p-8 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
