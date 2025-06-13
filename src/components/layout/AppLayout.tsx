// src/components/layout/AppLayout.tsx
'use client';

import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
// Removed useState, useEffect for this specific fix as the issue is direct variable state

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const rawPathname = usePathname(); // Returns string on client, null on server.
  
  // Ensure pathname is always a string.
  // If rawPathname is null (SSR) or undefined (unexpected), pathname becomes "".
  const pathname = typeof rawPathname === 'string' ? rawPathname : "";

  // All .startsWith() calls are now on a guaranteed string.
  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  
  const showNavbar = !isAdminRoute && !isDashboardRoute;
  
  // For showFooter and useSpecialMainLayout, the logic remains similar.
  // On SSR, pathname is "", so .startsWith('/auth') is false.
  const showFooter = !isAdminRoute && !isDashboardRoute && !pathname.startsWith('/auth');
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
