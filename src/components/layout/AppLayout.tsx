// src/components/layout/AppLayout.tsx
'use client';

import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const rawPathname = usePathname();
  const pathname = rawPathname ?? ""; // Asegurar que pathname siempre sea un string

  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  
  // Navbar se muestra en todas las rutas excepto /admin/** y /dashboard/**
  const showNavbar = !isAdminRoute && !isDashboardRoute;
  
  // Footer se oculta en admin, dashboard y auth
  const showFooter = !isAdminRoute && !isDashboardRoute && !pathname.startsWith('/auth');

  // Layout especial de main (sin container padding) para admin, dashboard y auth
  const useSpecialMainLayout = isAdminRoute || isDashboardRoute || pathname.startsWith('/auth');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {showNavbar && <Navbar />}

      <main
        className={cn(
          "flex-grow",
          useSpecialMainLayout
            ? "animate-fade-in" 
            : "container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 animate-fade-in"
        )}
      >
        {children}
      </main>

      {showFooter && <Footer />}
    </div>
  );
}
