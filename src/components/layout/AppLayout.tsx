
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
  
  const showNavbar = !isAdminRoute && !isDashboardRoute; // Auth routes have showNavbar = true
  const showFooter = !isAdminRoute && !isDashboardRoute && !isAuthRoute;
  const showFloatingAssistant = showNavbar; 
  
  const routeHasSpecificPadding = isAdminRoute || isDashboardRoute;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {showNavbar && <Navbar />}

      <main
        className={cn(
          "flex-grow animate-fade-in",
          // If it's NOT (admin or dashboard) AND it's also NOT auth, apply standard container padding & top margin for navbar
          !routeHasSpecificPadding && !isAuthRoute 
            ? "container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 pt-20" // Added pt-20 here too for general pages
            : "", 
          // If it IS an auth route, only apply pt-20 (navbar height), page handles its own layout
          isAuthRoute && "pt-20" 
        )}
      >
        {children}
      </main>

      {showFooter && <Footer />}
      {showFloatingAssistant && <FloatingAssistantButton />}
    </div>
  );
}
