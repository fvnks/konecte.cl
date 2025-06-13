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
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAuthRoute = pathname.startsWith('/auth');

  // Navbar se muestra a menos que sea admin o dashboard
  const showNavbar = !isAdminRoute && !isDashboardRoute;

  // Footer se muestra a menos que sea admin, dashboard o auth
  const showFooter = !isAdminRoute && !isDashboardRoute && !isAuthRoute;

  // Main usa layout especial (sin container padding) si es admin, dashboard o auth
  const useSpecialMainLayout = isAdminRoute || isDashboardRoute || isAuthRoute;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {showNavbar && <Navbar />}

      <main
        className={cn(
          "flex-grow",
          useSpecialMainLayout
            ? "animate-fade-in" // Para rutas especiales: ancho completo
            : "container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 animate-fade-in"
        )}
      >
        {children}
      </main>

      {showFooter && <Footer />}
    </div>
  );
}
