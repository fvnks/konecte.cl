
// src/app/dashboard/layout.tsx
'use client';

import React, { type ReactNode, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LayoutDashboard, UserCircle, MessageSquare, Users, Edit, Handshake, Bot, ListTree, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getTotalUnreadMessagesCountAction } from '@/actions/chatActions';
import { getPlanByIdAction } from '@/actions/planActions';
import type { Plan, User as StoredUserTypeFull } from '@/lib/types'; // Use StoredUserTypeFull for full type
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import CustomPageLoader from '@/components/ui/CustomPageLoader';
import StyledLogoutButton from '@/components/ui/StyledLogoutButton';
import StyledUserProfileWidget from '@/components/ui/StyledUserProfileWidget';
import AnimatedLetterButton from '@/components/ui/AnimatedLetterButton';

interface DashboardLayoutProps {
  children: ReactNode;
}

// StoredUser type within the layout, possibly a subset of the full User type
interface StoredUser extends Pick<StoredUserTypeFull, 'id' | 'name' | 'avatarUrl' | 'role_id' | 'plan_id' | 'phone_number' | 'phone_verified' | 'email' | 'role_name' | 'plan_name' | 'plan_expires_at' | 'plan_is_pro_or_premium' | 'plan_allows_contact_view' | 'plan_is_premium_broker' | 'plan_automated_alerts_enabled' | 'plan_advanced_dashboard_access'> {}


const baseNavItemsDefinition = [
  { href: '/dashboard', label: 'Resumen', icon: <LayoutDashboard /> },
  { href: '/dashboard/my-listings', label: 'Mis Publicaciones', icon: <ListTree /> },
  { href: '/dashboard/messages', label: 'Mensajes', icon: <MessageSquare />, id: 'messagesLink' },
  { href: '/dashboard/crm', label: 'Mi CRM', icon: <Users /> },
  { href: '/dashboard/visits', label: 'Mis Visitas', icon: <Edit /> },
  { href: '/ai-matching', label: 'Búsqueda con IA', icon: <Sparkles /> },
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
    let newNavItemsList = [...baseNavItemsDefinition];

    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const parsedUser: StoredUser = JSON.parse(userJson);
        tempCurrentUser = parsedUser;

        if (parsedUser.id) {
          tempTotalUnreadCount = await getTotalUnreadMessagesCountAction(parsedUser.id);
        }

        // Check for phone verification
        if (parsedUser.id && !parsedUser.phone_verified) {
            toast({
                title: "Verificación Requerida",
                description: "Debes verificar tu número de teléfono para continuar.",
                variant: "warning",
                duration: 7000,
            });
            const phoneEnding = parsedUser.phone_number ? parsedUser.phone_number.slice(-4) : '';
            router.push(`/auth/verify-phone?userId=${parsedUser.id}&phoneEnding=${phoneEnding}`);
            setIsLoadingSession(false); // Stop further processing if redirecting
            return; // Exit early
        }


        // Broker "Canje Clientes" link
        const brokerItem = { href: '/dashboard/broker/open-requests', label: 'Canje Clientes', icon: <Handshake /> };
        const hasBrokerItem = newNavItemsList.some(item => item.href === brokerItem.href);
        if (parsedUser.role_id === 'broker' && !hasBrokerItem) {
          const myListingIndex = newNavItemsList.findIndex(item => item.href === '/dashboard/my-listings');
          if (myListingIndex !== -1) {
            newNavItemsList.splice(myListingIndex + 1, 0, brokerItem);
          } else {
             const messagesIndex = newNavItemsList.findIndex(item => item.href === '/dashboard/messages');
             if (messagesIndex !== -1) {
                newNavItemsList.splice(messagesIndex, 0, brokerItem);
             } else {
                newNavItemsList.push(brokerItem); 
             }
          }
        }

        // WhatsApp Chat link based on plan_automated_alerts_enabled
        const chatWhatsAppItem = { href: '/dashboard/whatsapp-chat', label: 'Chat WhatsApp', icon: <Bot /> };
        let hasWhatsAppItem = newNavItemsList.some(item => item.href === chatWhatsAppItem.href);
        
        let userHasWhatsAppPermission = parsedUser.plan_automated_alerts_enabled === true;
        
        if (parsedUser.plan_automated_alerts_enabled === undefined && parsedUser.plan_id && parsedUser.phone_number) {
          try {
            const planDetails: Plan | null = await getPlanByIdAction(parsedUser.plan_id);
            if (planDetails && planDetails.automated_alerts_enabled === true) { 
              userHasWhatsAppPermission = true;
            }
          } catch (err) {
            console.error("[DashboardLayout] Error checking plan permission for WhatsApp (fallback):", err);
          }
        }
        
        if (userHasWhatsAppPermission && !hasWhatsAppItem) {
            const visitsIndex = newNavItemsList.findIndex(item => item.href === '/dashboard/visits');
            if (visitsIndex !== -1) {
                 newNavItemsList.splice(visitsIndex + 1, 0, chatWhatsAppItem);
            } else {
                 newNavItemsList.push(chatWhatsAppItem);
            }
        } else if (!userHasWhatsAppPermission && hasWhatsAppItem) {
            newNavItemsList = newNavItemsList.filter(item => item.href !== chatWhatsAppItem.href);
        }

      } catch (error) {
        console.error("[DashboardLayout] Error processing user session:", error);
        localStorage.removeItem('loggedInUser');
        tempCurrentUser = null;
        tempTotalUnreadCount = 0;
      }
    } else {
        tempCurrentUser = null;
        tempTotalUnreadCount = 0;
        toast({
            title: "Acceso Requerido",
            description: "Debes iniciar sesión para acceder a tu panel.",
            variant: "destructive"
        });
        router.push('/auth/signin');
    }

    setNavItems(newNavItemsList);
    setCurrentUser(tempCurrentUser);
    setTotalUnreadCount(tempTotalUnreadCount);
    setIsLoadingSession(false);
  }, [isClient, router, toast]); 

  useEffect(() => {
    if (isClient) {
      updateSessionAndNav(); 

      const handleSessionChange = () => updateSessionAndNav();
      const handleMessagesUpdate = () => updateSessionAndNav(); 

      window.addEventListener('userSessionChanged', handleSessionChange);
      window.addEventListener('messagesUpdated', handleMessagesUpdate);
      
      return () => {
        window.removeEventListener('userSessionChanged', handleSessionChange);
        window.removeEventListener('messagesUpdated', handleMessagesUpdate);
      };
    }
  }, [isClient, updateSessionAndNav]);


  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setCurrentUser(null);
    setTotalUnreadCount(0);
    toast({
      title: "Sesión Cerrada",
      description: "Has cerrado sesión de tu panel.",
    });
    window.dispatchEvent(new CustomEvent('userSessionChanged')); 
    router.push('/');
  };

  const userName = currentUser?.name || "Usuario";

  if (isLoadingSession && isClient) {
    return (
       <div className="flex min-h-screen flex-col bg-muted/40">
            <aside className="w-72 bg-background border-r p-5 space-y-6 hidden md:flex flex-col shadow-md">
                <div className="flex items-center gap-3 px-2 py-1">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-7 w-40 rounded-md" />
                </div>
                <Separator/>
                <div className="flex-grow space-y-1.5">
                    {baseNavItemsDefinition.map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-md"/>)}
                </div>
                <Separator/>
                <div className="mt-auto space-y-4">
                    <Skeleton className="h-[50px] w-full rounded-lg"/>
                    <Skeleton className="h-10 w-full rounded-md"/>
                    <Skeleton className="h-10 w-full rounded-md"/>
                </div>
            </aside>
            <div className="flex-1 flex flex-col">
                <header className="bg-background border-b p-4 shadow-sm md:hidden">
                    <div className="flex items-center justify-between"> <Skeleton className="h-7 w-28 rounded-md" /></div>
                </header>
                <main className="flex-1 flex flex-col items-center justify-center bg-muted/30">
                    <CustomPageLoader />
                    <p className="mt-4 text-muted-foreground">Cargando tu panel...</p>
                </main>
            </div>
        </div>
    );
  }

  if (!currentUser && isClient) { // If loading is done but no user (e.g., redirected to signin)
      return (
       <div className="flex flex-col items-center justify-center min-h-screen">
         <CustomPageLoader />
         <p className="mt-4 text-muted-foreground">Verificando sesión...</p>
          {/* Button removed because redirection should happen */}
       </div>
    );
  }
  
  const showUnreadBadge = isClient && currentUser && totalUnreadCount > 0;

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="w-72 bg-background border-r p-5 space-y-6 hidden md:flex flex-col shadow-md">
        <div className="flex items-center gap-3 px-2 py-1">
          <Link href="/" className="flex items-center gap-3 text-primary group">
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Home className="h-7 w-7 text-primary" />
            </div>
            <span className="text-xl font-bold font-headline text-foreground group-hover:text-primary transition-colors">konecte</span>
          </Link>
        </div>
        
        <Separator />

        <nav className="flex-grow space-y-1.5">
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              asChild
              className={`w-full justify-start text-base py-2.5 h-auto rounded-md hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary ${
                pathname === item.href ? 'bg-primary/10 text-primary font-semibold' : ''
              }`}
            >
              <Link href={item.href} className="flex items-center justify-between gap-3 px-3">
                <span className="flex items-center gap-3">
                    {React.cloneElement(item.icon, { className: `h-5 w-5 ${pathname === item.href ? 'text-primary' : 'text-muted-foreground group-hover:text-primary transition-colors'}` })}
                    <span>{item.label}</span>
                </span>
                 {item.id === 'messagesLink' && showUnreadBadge && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Badge>
                )}
              </Link>
            </Button>
          ))}
        </nav>
        
        <Separator />
        
        <div className="mt-auto space-y-4">
            {currentUser && (
                <StyledUserProfileWidget userName={userName} userRole={currentUser.role_id} />
            )}
          <StyledLogoutButton onClick={handleLogout} />
          <AnimatedLetterButton href="/profile" text="MI PERFIL" />
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col">
        <header className="bg-background border-b p-4 shadow-sm md:hidden">
            <div className="flex items-center justify-between">
                 <Link href="/dashboard" className="flex items-center gap-2 text-primary">
                    <LayoutDashboard className="h-6 w-6" />
                    <span className="text-lg font-bold font-headline">Panel</span>
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
