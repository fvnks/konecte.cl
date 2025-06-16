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
  const pathname = typeof rawPathname === 'string' ? rawPathname : "";

  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAuthRoute = pathname.startsWith('/auth');
  
  const showNavbar = !isAdminRoute && !isDashboardRoute && !isAuthRoute;
  const showFooter = !isAdminRoute && !isDashboardRoute && !isAuthRoute;
  
  // Layouts específicos no tendrán padding de container por defecto, lo aplicarán ellos mismos
  const useSpecificLayoutPadding = isAdminRoute || isDashboardRoute || isAuthRoute;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {showNavbar && <Navbar />}

      <main
        className={cn(
          "flex-grow",
          useSpecificLayoutPadding
            ? "animate-fade-in" // Las páginas con layout específico (admin, dashboard, auth) gestionan su propio padding
            : "container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 animate-fade-in" // Layout general con container y padding
        )}
      >
        {children}
      </main>

      {showFooter && <Footer />}
    </div>
  );
}
```