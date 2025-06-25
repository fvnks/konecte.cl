// src/app/admin/layout.tsx
'use client';

import React, { type ReactNode, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Settings, Users, LayoutDashboard, ShieldAlert, CreditCard, ListOrdered, Brush, FileSearch, Newspaper, BarChart3, CalendarClock, MailWarning, MessageSquare, Bot, Sparkles, FileText, Bug } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingScreen from '@/components/layout/LoadingScreen'; // Import the new loading screen
import { Badge } from '@/components/ui/badge';
import { getUnreadContactSubmissionsCountAction } from '@/actions/contactFormActions';
import StyledLogoutButton from '@/components/ui/StyledLogoutButton';
import StyledUserProfileWidget from '@/components/ui/StyledUserProfileWidget';
import AnimatedLetterButton from '@/components/ui/AnimatedLetterButton';

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNavItems: {
  href: string;
  label: string;
  icon: React.ReactElement;
  id?: string;
  isSubItem?: boolean;
}[] = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/admin/stats', label: 'Estadísticas', icon: <BarChart3 className="h-5 w-5" /> },
  { href: '/ai-matching', label: 'Coincidencias con IA', icon: <Sparkles className="h-5 w-5" /> },
  { href: '/admin/appearance', label: 'Apariencia', icon: <Brush className="h-5 w-5" /> },
  { href: '/admin/content', label: 'Contenido del Sitio', icon: <Newspaper className="h-5 w-5" /> },
  { href: '/admin/contact-submissions', label: 'Mensajes de Contacto', icon: <MailWarning className="h-5 w-5" />, id: 'contactSubmissionsLink' },
  { href: '/admin/whatsapp-viewer', label: 'Visor Chat WhatsApp', icon: <MessageSquare className="h-5 w-5" /> }, 
  { href: '/admin/settings', label: 'Análisis WhatsBot', icon: <Bot className="h-5 w-5" /> }, 
  { href: '/admin/users', label: 'Usuarios', icon: <Users className="h-5 w-5" /> },
  { href: '/admin/roles', label: 'Roles', icon: <ShieldAlert className="h-5 w-5" /> },
  { href: '/admin/plans', label: 'Planes', icon: <CreditCard className="h-5 w-5" /> },
  { href: '/admin/properties', label: 'Propiedades', icon: <ListOrdered className="h-5 w-5" /> },
  { href: '/admin/requests', label: 'Solicitudes', icon: <FileSearch className="h-5 w-5" /> },
  { href: '/admin/visits', label: 'Gestión de Visitas', icon: <CalendarClock className="h-5 w-5" /> },
  { href: '/admin/visits/schedule', label: 'Agendar Visita', icon: <span className="w-5 h-5" />, isSubItem: true },
  { href: '/admin/bug-reports', label: 'Reportes de Fallas', icon: <Bug className="h-5 w-5" /> },
];

interface StoredAdminUser {
  id: string;
  name: string;
  avatarUrl?: string; 
  role_id: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<StoredAdminUser | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [unreadContactSubmissions, setUnreadContactSubmissions] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchUnreadCounts = useCallback(async () => {
    if (isClient) {
      try {
        const count = await getUnreadContactSubmissionsCountAction(); 
        setUnreadContactSubmissions(count);
      } catch (error) {
        console.error("Failed to fetch unread contact submissions count", error);
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      setIsLoadingSession(true);
      fetchUnreadCounts(); 

      const userJson = localStorage.getItem('loggedInUser');
      if (userJson) {
        try {
          const parsedUser: StoredAdminUser = JSON.parse(userJson);
          if (parsedUser.role_id === 'admin') {
            setAdminUser(parsedUser);
          } else {
            toast({ title: "Acceso Denegado", description: "No tienes permisos de administrador.", variant: "destructive" });
            router.push('/');
            setAdminUser(null);
          }
        } catch (e) {
          console.error("Error parsing admin user from localStorage for layout:", e);
          toast({ title: "Error de Sesión", description: "Por favor, inicia sesión de nuevo.", variant: "destructive" });
          localStorage.removeItem('loggedInUser');
          router.push('/auth/signin');
          setAdminUser(null);
        }
      } else {
        toast({ title: "Acceso Requerido", description: "Debes iniciar sesión como administrador.", variant: "destructive" });
        router.push('/auth/signin');
        setAdminUser(null);
      }
      
      setIsLoadingSession(false);
    }
  }, [isClient, router, toast, fetchUnreadCounts]);
  
  useEffect(() => {
    if (isClient) {
        const handleContactSubmissionsUpdate = () => {
            fetchUnreadCounts();
        };
        window.addEventListener('contactSubmissionsUpdated', handleContactSubmissionsUpdate);
        return () => {
            window.removeEventListener('contactSubmissionsUpdated', handleContactSubmissionsUpdate);
        };
    }
  }, [isClient, fetchUnreadCounts]);

  const handleAdminLogout = () => {
    localStorage.removeItem('loggedInUser');
    setAdminUser(null);
    toast({
      title: "Sesión Cerrada",
      description: "Has cerrado sesión del panel de administración.",
    });
    window.dispatchEvent(new CustomEvent('userSessionChanged'));
    router.push('/');
  };

  const adminName = adminUser?.name || 'Admin';

  if (isLoadingSession && isClient) {
    return <LoadingScreen />;
  }

  if (!adminUser && isClient) {
      return <LoadingScreen />; // Show loader while redirecting
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="w-72 bg-background border-r p-5 space-y-6 hidden md:flex flex-col shadow-md">
        <div className="flex items-center gap-3 px-2 py-1">
          <Link href="/" className="flex items-center gap-3 text-primary group">
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Home className="h-7 w-7 text-primary" />
            </div>
            <span className="text-xl font-bold font-headline text-foreground group-hover:text-primary transition-colors">konecte Admin</span>
          </Link>
        </div>
        
        <Separator />

        <nav className="flex-grow space-y-1.5">
          {adminNavItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              asChild
              className={`w-full justify-start text-base py-2.5 h-auto rounded-md hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary ${item.isSubItem ? 'pl-8' : ''}`}
            >
              <Link href={item.href} className="flex items-center justify-between gap-3 px-3">
                <span className="flex items-center gap-3">
                    {React.cloneElement(item.icon, { className: "h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" })}
                    <span className="font-medium">{item.label}</span>
                </span>
                {item.id === 'contactSubmissionsLink' && unreadContactSubmissions > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                    {unreadContactSubmissions > 99 ? '99+' : unreadContactSubmissions}
                  </Badge>
                )}
              </Link>
            </Button>
          ))}
        </nav>
        
        <Separator />
        
        <div className="mt-auto space-y-4">
            {adminUser && (
                <StyledUserProfileWidget userName={adminName} userRole="Administrador" />
            )}
          <StyledLogoutButton onClick={handleAdminLogout} />
          <Button variant="outline" asChild className="w-full text-base py-2.5 h-auto rounded-md border-primary/50 text-primary hover:bg-primary/5 hover:text-primary">
            <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4 transform"/> Ir al Sitio
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
            </div>
        </header>
        <main className="flex-1 flex flex-col bg-muted/30 p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
