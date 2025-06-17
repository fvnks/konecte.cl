// src/app/dashboard/layout.tsx
'use client';

import React, { type ReactNode, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LayoutDashboard, UserCircle, MessageSquare, Users, Edit, LogOut as LogOutIcon, CalendarCheck, Handshake, Bot, ListTree } from 'lucide-react'; // Added ListTree
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { getTotalUnreadMessagesCountAction } from '@/actions/chatActions';
import { getPlanByIdAction } from '@/actions/planActions';
import type { Plan } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import CustomPageLoader from '@/components/ui/CustomPageLoader';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface StoredUser {
  id: string;
  name: string;
  avatarUrl?: string;
  role_id: string;
  plan_id?: string | null; 
}

const baseNavItemsDefinition = [
  { href: '/dashboard', label: 'Resumen', icon: <LayoutDashboard /> },
  { href: '/dashboard/my-listings', label: 'Mis Publicaciones', icon: <ListTree /> }, // Nueva sección
  { href: '/dashboard/messages', label: 'Mensajes', icon: <MessageSquare />, id: 'messagesLink' },
  { href: '/dashboard/crm', label: 'Mi CRM', icon: <Users /> },
  { href: '/dashboard/visits', label: 'Mis Visitas', icon: <CalendarCheck /> },
];


export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [navItems, setNavItems] = useState<any[]>(() => [...baseNavItemsDefinition]);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const updateSessionAndNav = useCallback(async () => {
    if (!isClient) {
        if (isLoadingSession) setIsLoadingSession(false); 
        return;
    }

    setIsLoadingSession(true); 
    
    let tempCurrentUser: StoredUser | null = null;
    let tempTotalUnreadCount = 0;
    let newNavItemsList = [...baseNavItemsDefinition]; // Reiniciar con la base

    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const parsedUser: StoredUser = JSON.parse(userJson);
        tempCurrentUser = parsedUser; 

        // Lógica para añadir "Canje Clientes" si es broker
        const brokerItem = { href: '/dashboard/broker/open-requests', label: 'Canje Clientes', icon: <Handshake /> };
        const hasBrokerItem = newNavItemsList.some(item => item.href === brokerItem.href);
        if (parsedUser.role_id === 'broker' && !hasBrokerItem) {
            // Insertar después de "Mis Publicaciones" y antes de "Mensajes" si existe "Mis Publicaciones"
            const myListingIndex = newNavItemsList.findIndex(item => item.href === '/dashboard/my-listings');
            if (myListingIndex !== -1) {
                 newNavItemsList.splice(myListingIndex + 1, 0, brokerItem);
            } else { // Si "Mis Publicaciones" no existe, añadir al final antes de los items de perfil
                newNavItemsList.splice(newNavItemsList.length - 2, 0, brokerItem);
            }
        }

        // Lógica para añadir "Chat WhatsApp" si el plan lo permite
        const chatWhatsAppItem = { href: '/dashboard/whatsapp-chat', label: 'Chat WhatsApp', icon: <Bot /> };
        const hasWhatsAppItem = newNavItemsList.some(item => item.href === chatWhatsAppItem.href);

        if (parsedUser.plan_id && !hasWhatsAppItem) {
          try {
            const planDetails: Plan | null = await getPlanByIdAction(parsedUser.plan_id);
            if (planDetails && planDetails.whatsapp_bot_enabled === true) {
                // Intentar insertar después de "Canje Clientes" o "Mensajes"
                let insertAtIndex = newNavItemsList.findIndex(item => item.href === brokerItem.href);
                if (insertAtIndex === -1) insertAtIndex = newNavItemsList.findIndex(item => item.href === '/dashboard/messages');
                
                if (insertAtIndex !== -1) {
                    newNavItemsList.splice(insertAtIndex + 1, 0, chatWhatsAppItem);
                } else { // Si ninguno de los anteriores existe, añadir después de "Mis Visitas"
                     insertAtIndex = newNavItemsList.findIndex(item => item.href === '/dashboard/visits');
                     if (insertAtIndex !== -1) {
                        newNavItemsList.splice(insertAtIndex + 1, 0, chatWhatsAppItem);
                     } else { // Como último recurso, antes de Perfil
                         newNavItemsList.splice(newNavItemsList.length - 1, 0, chatWhatsAppItem);
                     }
                }
            }
          } catch (planError: any) {
            console.error("[DashboardLayout DEBUG] CRITICAL ERROR fetching plan details:", planError.message);
            toast({ title: "Error de Plan", description: "No se pudo verificar tu plan para el chat de WhatsApp. Contacta a soporte.", variant: "destructive" });
          }
        }
        
        if (parsedUser.id) {
          const count = await getTotalUnreadMessagesCountAction(parsedUser.id);
          tempTotalUnreadCount = count;
        }

      } catch (e: any) {
        localStorage.removeItem('loggedInUser');
        tempCurrentUser = null;
        newNavItemsList = [...baseNavItemsDefinition]; 
        if (!pathname.startsWith('/auth')) {
            router.push('/auth/signin');
        }
      }
    } else {
      tempCurrentUser = null;
      newNavItemsList = [...baseNavItemsDefinition]; 
      if (!pathname.startsWith('/auth')) {
        router.push('/auth/signin');
      }
    }
    
    setCurrentUser(tempCurrentUser);
    setTotalUnreadCount(tempTotalUnreadCount);
    setNavItems(newNavItemsList);
    setIsLoadingSession(false);
  }, [isClient, pathname, router, toast]);


  useEffect(() => {
    if (isClient) {
      updateSessionAndNav(); 

      const handleSessionOrMessagesUpdate = (event: Event) => {
        updateSessionAndNav();
      };
      
      const handleStorageEvent = (event: StorageEvent) => {
          if (event.key === 'loggedInUser') {
              updateSessionAndNav();
          }
      };

      window.addEventListener('userSessionChanged', handleSessionOrMessagesUpdate);
      window.addEventListener('messagesUpdated', handleSessionOrMessagesUpdate);
      window.addEventListener('storage', handleStorageEvent);

      return () => {
        window.removeEventListener('userSessionChanged', handleSessionOrMessagesUpdate);
        window.removeEventListener('messagesUpdated', handleSessionOrMessagesUpdate);
        window.removeEventListener('storage', handleStorageEvent);
      };
    }
  }, [isClient, updateSessionAndNav]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setCurrentUser(null);
    setTotalUnreadCount(0);
    setNavItems([...baseNavItemsDefinition]);
    toast({
      title: "Sesión Cerrada",
      description: "Has cerrado sesión de tu panel.",
    });
    window.dispatchEvent(new CustomEvent('userSessionChanged'));
    router.push('/');
  };

  const userName = currentUser?.name || 'Usuario';
  const userAvatarUrl = currentUser?.avatarUrl || `https://placehold.co/40x40.png?text=${userName.substring(0,1)}`;
  const userAvatarFallback = userName.substring(0,1).toUpperCase();
  
  if (isLoadingSession && isClient) {
     return (
        <div className="flex min-h-screen flex-col bg-muted/40">
            <aside className="w-64 bg-background border-r p-5 space-y-6 hidden md:flex flex-col shadow-sm">
                <div className="flex items-center gap-3 px-2 py-1">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-7 w-32 rounded-md" />
                </div>
                <Separator/>
                <div className="flex-grow space-y-1.5">
                    {[...Array(baseNavItemsDefinition.length + 2)].map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-md"/>)}
                </div>
                <Separator/>
                <div className="mt-auto space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border">
                        <Skeleton className="h-9 w-9 rounded-full"/>
                        <div className="space-y-1.5"><Skeleton className="h-3 w-20 rounded"/><Skeleton className="h-3 w-16 rounded"/></div>
                    </div>
                    <Skeleton className="h-9 w-full rounded-md"/>
                </div>
            </aside>
            <div className="flex-1 flex flex-col">
                <header className="bg-background border-b p-4 shadow-sm md:hidden">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-7 w-24 rounded-md" />
                    </div>
                </header>
                <main className="flex-grow p-4 sm:p-6 md:p-8 bg-muted/30 flex flex-col items-center justify-center">
                    <CustomPageLoader />
                    <p className="mt-4 text-muted-foreground">Cargando panel...</p>
                </main>
            </div>
        </div>
     );
  }
  
  if (!currentUser && isClient && !pathname.startsWith('/auth')) {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen">
         <CustomPageLoader />
         <p className="mt-4 text-muted-foreground">Verificando sesión...</p>
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
            <span className="text-lg font-bold font-headline text-foreground group-hover:text-primary transition-colors">konecte</span>
          </Link>
        </div>
        
        <Separator />

        <nav className="flex-grow space-y-1">
          {navItems.map((item) => (
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
