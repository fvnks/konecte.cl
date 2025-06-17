// src/app/dashboard/layout.tsx
'use client';

import React, { type ReactNode, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LayoutDashboard, UserCircle, MessageSquare, Users, Edit, LogOut as LogOutIcon, CalendarCheck, Handshake, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { getTotalUnreadMessagesCountAction } from '@/actions/chatActions';
import { getPlanByIdAction } from '@/actions/planActions';
import type { Plan } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import CustomPageLoader from '@/components/ui/CustomPageLoader'; // Importar el nuevo loader

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
        console.log('[DashboardLayout DEBUG] updateSessionAndNav: isClient is false. Aborting.');
        if (isLoadingSession) setIsLoadingSession(false); 
        return;
    }
    console.log('[DashboardLayout DEBUG] updateSessionAndNav START. Pathname:', pathname);

    setIsLoadingSession(true); 
    
    let tempCurrentUser: StoredUser | null = null;
    let tempTotalUnreadCount = 0;
    let newNavItemsList = [...baseNavItemsDefinition];

    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      console.log('[DashboardLayout DEBUG] userJson found in localStorage:', userJson.substring(0, 100) + '...'); 
      try {
        const parsedUser: StoredUser = JSON.parse(userJson);
        tempCurrentUser = parsedUser; 
        console.log('[DashboardLayout DEBUG] Parsed user from localStorage:', {id: parsedUser.id, name: parsedUser.name, role_id: parsedUser.role_id, plan_id: parsedUser.plan_id});

        if (parsedUser.role_id === 'broker') {
          if (!newNavItemsList.find(item => item.href === '/dashboard/broker/open-requests')) {
            console.log('[DashboardLayout DEBUG] User IS BROKER. Adding "Canje Clientes" link.');
            newNavItemsList.push({ href: '/dashboard/broker/open-requests', label: 'Canje Clientes', icon: <Handshake /> });
          }
        } else {
            console.log(`[DashboardLayout DEBUG] User role_id ('${parsedUser.role_id}') is NOT 'broker'. Not adding "Canje Clientes".`);
        }

        if (parsedUser.plan_id) {
          console.log(`[DashboardLayout DEBUG] User has plan_id: "${parsedUser.plan_id}". Fetching plan details...`);
          try {
            const planDetails: Plan | null = await getPlanByIdAction(parsedUser.plan_id);
            console.log('[DashboardLayout DEBUG] Fetched plan details:', planDetails); 
            if (planDetails && planDetails.whatsapp_bot_enabled === true) { 
              if (!newNavItemsList.find(item => item.href === '/dashboard/whatsapp-chat')) {
                console.log('[DashboardLayout DEBUG] Plan has whatsapp_bot_enabled=true. ADDING "Chat WhatsApp" link.');
                newNavItemsList.push({ href: '/dashboard/whatsapp-chat', label: 'Chat WhatsApp', icon: <Bot /> });
              } else {
                console.log('[DashboardLayout DEBUG] "Chat WhatsApp" link ALREADY EXISTS in nav list (before this potential add).');
              }
            } else {
              console.log(`[DashboardLayout DEBUG] Plan either not found (null) or whatsapp_bot_enabled is NOT true (current value: ${planDetails?.whatsapp_bot_enabled}). "Chat WhatsApp" link NOT ADDED.`);
            }
          } catch (planError: any) {
            console.error("[DashboardLayout DEBUG] CRITICAL ERROR fetching plan details:", planError.message);
            toast({ title: "Error de Plan", description: "No se pudo verificar tu plan para el chat de WhatsApp. Contacta a soporte.", variant: "destructive" });
          }
        } else {
          console.log('[DashboardLayout DEBUG] User does NOT have a plan_id. "Chat WhatsApp" link will NOT be added.');
        }
        
        if (parsedUser.id) {
          console.log(`[DashboardLayout DEBUG] Fetching unread messages for user ID: ${parsedUser.id}`);
          const count = await getTotalUnreadMessagesCountAction(parsedUser.id);
          tempTotalUnreadCount = count;
          console.log(`[DashboardLayout DEBUG] Fetched unread messages count: ${count}`);
        } else {
          console.log('[DashboardLayout DEBUG] User has no ID. Unread count set to 0.');
        }

      } catch (e: any) {
        console.error("[DashboardLayout DEBUG] CRITICAL ERROR processing user session from localStorage:", e.message);
        localStorage.removeItem('loggedInUser');
        tempCurrentUser = null;
        tempTotalUnreadCount = 0;
        newNavItemsList = [...baseNavItemsDefinition]; 
        if (!pathname.startsWith('/auth')) {
            console.log('[DashboardLayout DEBUG] Error processing session, redirecting to /auth/signin.');
            router.push('/auth/signin');
        }
      }
    } else {
      console.log('[DashboardLayout DEBUG] No userJson found in localStorage. Redirecting if not on auth page.');
      tempCurrentUser = null;
      tempTotalUnreadCount = 0;
      newNavItemsList = [...baseNavItemsDefinition]; 
      if (!pathname.startsWith('/auth')) {
        router.push('/auth/signin');
      }
    }
    
    setCurrentUser(tempCurrentUser);
    setTotalUnreadCount(tempTotalUnreadCount);
    setNavItems(newNavItemsList);

    console.log('[DashboardLayout DEBUG] updateSessionAndNav FINISHED. Final navItems (hrefs):', newNavItemsList.map(item => item.href).join(', '));
    setIsLoadingSession(false);
    console.log('[DashboardLayout DEBUG] isLoadingSession set to false.');
  }, [isClient, pathname, router, toast]);


  useEffect(() => {
    if (isClient) {
      console.log('[DashboardLayout DEBUG] Main useEffect: isClient is true. Calling updateSessionAndNav and attaching listeners.');
      updateSessionAndNav(); 

      const handleSessionOrMessagesUpdate = (event: Event) => {
        console.log(`[DashboardLayout DEBUG] Event listener triggered: ${event.type}. Calling updateSessionAndNav.`);
        updateSessionAndNav();
      };
      
      const handleStorageEvent = (event: StorageEvent) => {
          if (event.key === 'loggedInUser') {
              console.log('[DashboardLayout DEBUG] Storage event triggered for loggedInUser. Calling updateSessionAndNav.');
              updateSessionAndNav();
          }
      };

      window.addEventListener('userSessionChanged', handleSessionOrMessagesUpdate);
      window.addEventListener('messagesUpdated', handleSessionOrMessagesUpdate);
      window.addEventListener('storage', handleStorageEvent);

      return () => {
        console.log('[DashboardLayout DEBUG] Cleaning up event listeners from main useEffect.');
        window.removeEventListener('userSessionChanged', handleSessionOrMessagesUpdate);
        window.removeEventListener('messagesUpdated', handleSessionOrMessagesUpdate);
        window.removeEventListener('storage', handleStorageEvent);
      };
    } else {
        console.log('[DashboardLayout DEBUG] Main useEffect: isClient is false.');
    }
  }, [isClient, updateSessionAndNav]);

  const handleLogout = () => {
    console.log('[DashboardLayout DEBUG] handleLogout called.');
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
    console.log('[DashboardLayout DEBUG] Logout finished, user redirected to /.');
  };

  const userName = currentUser?.name || 'Usuario';
  const userAvatarUrl = currentUser?.avatarUrl || `https://placehold.co/40x40.png?text=${userName.substring(0,1)}`;
  const userAvatarFallback = userName.substring(0,1).toUpperCase();
  
  if (isClient) {
    console.log('[DashboardLayout DEBUG] Render cycle. isLoadingSession:', isLoadingSession, 'currentUser exists:', !!currentUser, 'Nav items count:', navItems.length);
  }


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
