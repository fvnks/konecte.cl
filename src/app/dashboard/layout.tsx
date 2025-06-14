
// src/app/dashboard/layout.tsx
'use client';

import React, { type ReactNode, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LayoutDashboard, UserCircle, MessageSquare, Users, Edit, LogOut as LogOutIcon, CalendarCheck, Handshake } from 'lucide-react';
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
  role_id: string;
}

const baseNavItems = [
  { href: '/dashboard', label: 'Resumen', icon: <LayoutDashboard /> },
  { href: '/dashboard/messages', label: 'Mensajes', icon: <MessageSquare />, id: 'messagesLink' },
  { href: '/dashboard/crm', label: 'Mi CRM', icon: <Users /> },
  { href: '/dashboard/visits', label: 'Mis Visitas', icon: <CalendarCheck /> },
];

const brokerNavItems = [
  { href: '/dashboard/broker/open-requests', label: 'Canje Clientes', icon: <Handshake /> }
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [currentNavItems, setCurrentNavItems] = useState(baseNavItems);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect to set currentUser based on localStorage and handle redirection
  useEffect(() => {
    if (isClient) {
      const userJson = localStorage.getItem('loggedInUser');
      if (userJson) {
        try {
          const parsedUser: StoredUser = JSON.parse(userJson);
          setCurrentUser(parsedUser);
        } catch (e) {
          console.error("Error parsing user from localStorage for layout:", e);
          setCurrentUser(null);
          localStorage.removeItem('loggedInUser'); // Clean up corrupted data
           if (!pathname.startsWith('/auth')) { // Only redirect if not on auth pages
            router.push('/auth/signin');
          }
        }
      } else {
        setCurrentUser(null);
        if (!pathname.startsWith('/auth')) { // Only redirect if not on auth pages
          router.push('/auth/signin');
        }
      }
    }
  }, [isClient, pathname, router]);

  // Effect to set currentNavItems based on currentUser
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role_id === 'broker') {
        setCurrentNavItems([...baseNavItems, ...brokerNavItems]);
      } else {
        setCurrentNavItems(baseNavItems);
      }
    } else {
      // If no user, default to baseNavItems or an empty array if dashboard is strictly for logged-in
      setCurrentNavItems(baseNavItems); 
    }
  }, [currentUser]);


  const fetchUnreadCountCallback = useCallback(async () => {
    if (currentUser?.id) {
      try {
        const count = await getTotalUnreadMessagesCountAction(currentUser.id);
        setTotalUnreadCount(count);
      } catch (error) {
        console.error("Error fetching unread messages count:", error);
        setTotalUnreadCount(0); // Reset on error
      }
    } else {
      setTotalUnreadCount(0); // No user, no unread messages
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (isClient && currentUser) { // Fetch only if client and user is determined
        fetchUnreadCountCallback();
        const handleMessagesUpdated = () => fetchUnreadCountCallback();
        window.addEventListener('messagesUpdated', handleMessagesUpdated);
        return () => {
            window.removeEventListener('messagesUpdated', handleMessagesUpdated);
        };
    } else if (isClient && !currentUser) {
        setTotalUnreadCount(0); // Ensure count is zero if no user
    }
  }, [currentUser, isClient, fetchUnreadCountCallback]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setCurrentUser(null); // Clear user state immediately
    setTotalUnreadCount(0); // Reset unread count
    toast({
      title: "Sesión Cerrada",
      description: "Has cerrado sesión de tu panel.",
    });
    window.dispatchEvent(new Event('storage'));
    router.push('/');
  };

  const userName = currentUser?.name || 'Usuario';
  const userAvatarUrl = currentUser?.avatarUrl || `https://placehold.co/40x40.png?text=${userName.substring(0,1)}`;
  const userAvatarFallback = userName.substring(0,1).toUpperCase();

  // Show a generic loader if not client-side yet or if user data is still being processed
  if (!isClient || (!currentUser && !pathname.startsWith('/auth'))) {
     return (
        <div className="flex min-h-screen flex-col bg-muted/40">
            <aside className="w-64 bg-background border-r p-5 space-y-6 hidden md:flex flex-col shadow-sm">
                {/* Skeleton for sidebar header */}
                <div className="flex items-center gap-3 px-2 py-1">
                    <div className="p-2 bg-primary/10 rounded-lg"><Home className="h-6 w-6 text-primary" /></div>
                    <span className="text-lg font-bold font-headline text-foreground">PropSpot</span>
                </div>
                <Separator/>
                {/* Skeleton for nav items */}
                <div className="flex-grow space-y-1">
                    {[...Array(5)].map((_, i) => <div key={i} className="h-9 w-full bg-muted rounded-md animate-pulse"/>)}
                </div>
                <Separator/>
                {/* Skeleton for user info & logout */}
                <div className="mt-auto space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border">
                        <div className="h-9 w-9 rounded-full bg-muted animate-pulse"/>
                        <div className="space-y-1"><div className="h-3 w-20 bg-muted rounded animate-pulse"/><div className="h-3 w-16 bg-muted rounded animate-pulse"/></div>
                    </div>
                    <div className="h-9 w-full bg-muted rounded-md animate-pulse"/>
                </div>
            </aside>
            <div className="flex-1 flex flex-col">
                <header className="bg-background border-b p-4 shadow-sm md:hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary"><LayoutDashboard className="h-5 w-5" /><span className="text-md font-bold font-headline">Mi Panel</span></div>
                    </div>
                </header>
                <main className="flex-grow p-4 sm:p-6 md:p-8 bg-muted/30 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Cargando panel...</p>
                </main>
            </div>
        </div>
     );
  }
  
  // If currentUser is null AND we are NOT on an auth page, it means redirection should have happened or is about to.
  // This state might be briefly visible, or if redirection fails.
  if (!currentUser && !pathname.startsWith('/auth')) {
    return (
       <div className="flex items-center justify-center min-h-screen">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
         <p className="ml-2">Redirigiendo...</p>
       </div>
    );
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
          {currentNavItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              asChild
              className="w-full justify-start text-sm py-2.5 h-auto rounded-md hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
            >
              <Link href={item.href} className="flex items-center gap-3 px-3">
                {React.cloneElement(item.icon as React.ReactElement, { className: "h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" })}
                <span className="font-medium flex-1">{item.label}</span>
                {item.id === 'messagesLink' && totalUnreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Badge>
                )}
              </Link>
            </Button>
          ))}
           <Separator className="my-2"/>
             <Button
              variant={pathname === "/profile" ? "secondary" : "ghost"}
              asChild
              className="w-full justify-start text-sm py-2.5 h-auto rounded-md hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
            >
              <Link href="/profile" className="flex items-center gap-3 px-3">
                 <UserCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-medium flex-1">Mi Perfil</span>
              </Link>
            </Button>
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
            </div>
        </header>
        <main className="flex-grow p-4 sm:p-6 md:p-8 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
