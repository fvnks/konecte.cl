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
  
  const showNavbar = !isAdminRoute && !isDashboardRoute && !isAuthRoute;
  const showFooter = !isAdminRoute && !isDashboardRoute && !isAuthRoute;
  const showFloatingAssistant = showNavbar; // Mostrar el asistente en las mismas páginas que el Navbar/Footer
  
  const useSpecificLayoutPadding = isAdminRoute || isDashboardRoute || isAuthRoute;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {showNavbar && <Navbar />}

      <main
        className={cn(
          "flex-grow",
          useSpecificLayoutPadding
            ? "animate-fade-in" 
            : "container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 animate-fade-in"
        )}
      >
        {children}
      </main>

      {showFooter && <Footer />}
      {showFloatingAssistant && <FloatingAssistantButton />}
    </div>
  );
}
