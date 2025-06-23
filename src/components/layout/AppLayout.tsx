// src/components/layout/AppLayout.tsx
'use client';

import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import FloatingAssistantButton from './FloatingAssistantButton';
import React, { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen'; // Import the new loading screen

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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for aesthetic purposes
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500); // 2.5 seconds loading time

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading && <LoadingScreen />}
      <div
        className={cn(
          "flex min-h-screen flex-col bg-background text-foreground transition-opacity duration-700 ease-in-out",
          loading ? 'opacity-0' : 'opacity-100'
        )}
      >
        {showNavbar && <Navbar />}
        <main
          className={cn(
            "flex-grow",
            routeNeedsStandardContainerPadding && "container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 pt-20"
          )}
        >
          {children}
        </main>
        {showFooter && <Footer />}
        {showFloatingAssistant && <FloatingAssistantButton />}
      </div>
    </>
  );
}
