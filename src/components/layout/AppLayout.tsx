// src/components/layout/AppLayout.tsx
'use client';

import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import FloatingAssistantButton from './FloatingAssistantButton';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const rawPathname = usePathname(); 
  const pathname = typeof rawPathname === 'string' ? rawPathname : "";

  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAuthRoute = pathname.startsWith('/auth');
  
  const showNavbar = !isAdminRoute && !isDashboardRoute;
  const showFooter = !isAdminRoute && !isDashboardRoute && !isAuthRoute;
  const showFloatingAssistant = showNavbar; 
  
  const routeNeedsStandardContainerPadding = !isAdminRoute && !isDashboardRoute && !isAuthRoute;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {showNavbar && <Navbar />}

      <main
        className={cn(
          "flex-grow animate-fade-in",
          // Aplicar padding estándar y pt-20 para Navbar solo a páginas generales
          routeNeedsStandardContainerPadding
            ? "container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 pt-20" 
            : "",
          // Las rutas de Admin y Dashboard manejan su propio padding/layout interno.
          // Las rutas de Auth también manejan su layout (pantalla completa) y no necesitan pt-20 aquí,
          // ya que su div raíz con min-h-[calc(100vh-5rem)] y el Navbar sticky gestionan el espacio.
        )}
      >
        {children}
      </main>

      {showFooter && <Footer />}
      {showFloatingAssistant && <FloatingAssistantButton />}
    </div>
  );
}
