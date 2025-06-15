
// src/app/dashboard/layout.tsx
'use client';

import React, { type ReactNode, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LayoutDashboard, UserCircle, MessageSquare, Users, Edit, LogOut as LogOutIcon, CalendarCheck, Handshake, Bot } from 'lucide-react'; // Added Bot icon
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { getTotalUnreadMessagesCountAction } from '@/actions/chatActions';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface StoredUser {
  id: string;
  name: string;
  avatarUrl?: string;
  role_id: string;
  plan_id?: string | null; // Añadir plan_id
  plan?: { // Asumimos que el objeto plan podría tener esta info
    whatsapp_bot_enabled?: boolean;
  };
}

// Helper function to check if WhatsApp Bot is enabled for the user's plan
async function checkWhatsAppBotAccess(userId: string): Promise<boolean> {
  // En una implementación real, esto verificaría el plan del usuario en la BD.
  // Por ahora, simulamos que si el usuario tiene un plan, tiene acceso.
  // Esto debería ser reemplazado con una lógica real que consulte `plan.whatsapp_bot_enabled`.
  //
  // Esta función se vuelve más compleja ya que el plan se obtiene del localStorage
  // y el permiso `whatsapp_bot_enabled` está en la BD.
  // Para este prototipo, haremos una simplificación o requeriremos que el plan del usuario
  // ya tenga esta información en el objeto guardado en localStorage.
  //
  // Simplificación: El objeto StoredUser debe tener esta info, o consultamos la BD.
  // Aquí lo haremos de forma más simple: si tiene un plan_id, se asume que tiene acceso (placeholder).
  // En una implementación robusta, `src/actions/userActions.ts` o `authActions.ts`
  // al loguear, debería adjuntar las capacidades del plan al objeto User que se guarda.

  const userJson = localStorage.getItem('loggedInUser');
  if(userJson) {
    try {
      const userWithPlanDetails = JSON.parse(userJson) as StoredUser & { plan?: { whatsapp_bot_enabled?: boolean }};
      // Simulación: Si el plan del usuario incluye 'whatsapp_bot_enabled: true'
      // Esta lógica es una simulación. En producción, el plan completo se cargaría desde la BD.
      // O, el objeto 'loggedInUser' guardado en localStorage incluiría esta propiedad del plan.
      // Para este ejemplo, vamos a asumir que si el usuario tiene un plan_id, tiene acceso.
      // Esto es una simplificación para este ejercicio.
      // Una mejor forma sería:
      // if (userWithPlanDetails.plan_id) {
      //   const plan = await getPlanByIdAction(userWithPlanDetails.plan_id);
      //   return !!plan?.whatsapp_bot_enabled;
      // }
      // Pero eso es una llamada async dentro de un hook de layout.
      // Simplificando: si `plan.whatsapp_bot_enabled` está en el objeto del localStorage, usarlo.
      if (userWithPlanDetails?.plan?.whatsapp_bot_enabled) {
        return true;
      }
      // Como fallback, si no está en localStorage y tiene plan_id, podría devolverse false o hacer una llamada.
      // Por simplicidad del ejemplo, si no está explícitamente, no se muestra.
    } catch (e) {
      return false;
    }
  }
  return false; 
}


export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [currentNavItems, setCurrentNavItems] = useState<any[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(true);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const updateSessionState = useCallback(async () => {
    if (!isClient) return;

    setIsLoadingSession(true);
    const userJson = localStorage.getItem('loggedInUser');
    let finalNavItems = [
      { href: '/dashboard', label: 'Resumen', icon: <LayoutDashboard /> },
      { href: '/dashboard/messages', label: 'Mensajes', icon: <MessageSquare />, id: 'messagesLink' },
      { href: '/dashboard/crm', label: 'Mi CRM', icon: <Users /> },
      { href: '/dashboard/visits', label: 'Mis Visitas', icon: <CalendarCheck /> },
    ];

    if (userJson) {
      try {
        const parsedUser: StoredUser = JSON.parse(userJson);
        setCurrentUser(parsedUser);

        if (parsedUser.role_id === 'broker') {
          finalNavItems.push({ href: '/dashboard/broker/open-requests', label: 'Canje Clientes', icon: <Handshake /> });
        }
        
        // Comprobar acceso al bot de WhatsApp y añadirlo si es necesario
        // Esta es una simplificación, idealmente la información del plan estaría en parsedUser.
        // O se haría una llamada al backend para obtener las características del plan del usuario.
        // Para el prototipo, si el plan_id existe, asumimos que tiene acceso.
        if (parsedUser.plan_id && parsedUser.plan?.whatsapp_bot_enabled) { // Asumiendo que el plan del usuario tiene la info
            finalNavItems.push({ href: '/dashboard/whatsapp-chat', label: 'Chat WhatsApp', icon: <Bot /> });
        }

        if (parsedUser.id) {
          const count = await getTotalUnreadMessagesCountAction(parsedUser.id);
          setTotalUnreadCount(count);
        } else {
           setTotalUnreadCount(0);
        }
      } catch (e) {
        console.error("Error processing user session:", e);
        localStorage.removeItem('loggedInUser');
        setCurrentUser(null);
        setTotalUnreadCount(0);
        if (!pathname.startsWith('/auth')) router.push('/auth/signin');
      }
    } else {
      setCurrentUser(null);
      setTotalUnreadCount(0);
      if (!pathname.startsWith('/auth')) router.push('/auth/signin');
    }
    setCurrentNavItems(finalNavItems);
    setIsLoadingSession(false);
  }, [isClient, pathname, router]);


  useEffect(() => {
    updateSessionState();

    const handleSessionOrMessagesUpdate = () => {
      updateSessionState();
    };

    window.addEventListener('userSessionChanged', handleSessionOrMessagesUpdate);
    window.addEventListener('messagesUpdated', handleSessionOrMessagesUpdate);
    
    const handleNativeStorageEvent = (event: StorageEvent) => {
        if (event.key === 'loggedInUser') {
            updateSessionState();
        }
    };
    window.addEventListener('storage', handleNativeStorageEvent);


    return () => {
      window.removeEventListener('userSessionChanged', handleSessionOrMessagesUpdate);
      window.removeEventListener('messagesUpdated', handleSessionOrMessagesUpdate);
      window.removeEventListener('storage', handleNativeStorageEvent);
    };
  }, [updateSessionState]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setCurrentUser(null); 
    setTotalUnreadCount(0);
    setCurrentNavItems([ // Reset nav items on logout (sin items de broker o whatsapp)
        { href: '/dashboard', label: 'Resumen', icon: <LayoutDashboard /> },
        { href: '/dashboard/messages', label: 'Mensajes', icon: <MessageSquare />, id: 'messagesLink' },
        { href: '/dashboard/crm', label: 'Mi CRM', icon: <Users /> },
        { href: '/dashboard/visits', label: 'Mis Visitas', icon: <CalendarCheck /> },
    ]);
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
                    {[...Array(currentNavItems.length || 5)].map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-md"/>)}
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
                <main className="flex-grow p-4 sm:p-6 md:p-8 bg-muted/30 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Cargando panel...</p>
                </main>
            </div>
        </div>
     );
  }
  
  if (!currentUser && isClient && !pathname.startsWith('/auth')) {
    return (
       <div className="flex items-center justify-center min-h-screen">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
         <p className="ml-2">Verificando sesión...</p>
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
