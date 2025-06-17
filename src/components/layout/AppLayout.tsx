// src/components/layout/AppLayout.tsx
'use client';

import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import FloatingAssistantButton from './FloatingAssistantButton'; // Importar el nuevo componente

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const rawPathname = usePathname(); 
  const pathname = typeof rawPathname === 'string' ? rawPathname : "";

  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAuthRoute = pathname.startsWith('/auth');
  
  // Navbar se muestra si NO es admin Y NO es dashboard. (Sí en Auth)
  const showNavbar = !isAdminRoute && !isDashboardRoute;
  // Footer se muestra si NO es admin Y NO es dashboard Y NO es auth.
  const showFooter = !isAdminRoute && !isDashboardRoute && !isAuthRoute;
  // El asistente flotante sigue la lógica del Navbar
  const showFloatingAssistant = showNavbar; 
  
  // Rutas que manejan su propio padding o no lo necesitan (admin, dashboard)
  const routeHasSpecificPadding = isAdminRoute || isDashboardRoute;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {showNavbar && <Navbar />}

      <main
        className={cn(
          "flex-grow animate-fade-in", // animate-fade-in aplicado a todas las main
          !routeHasSpecificPadding // Si NO es una ruta con padding específico (admin/dashboard)
            ? "container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12" // Aplicar padding estándar
            : "" // Admin/dashboard manejan su propio padding interno o no lo necesitan de AppLayout
        )}
      >
        {children}
      </main>

      {showFooter && <Footer />}
      {showFloatingAssistant && <FloatingAssistantButton />}
    </div>
  );
}
