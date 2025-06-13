// src/components/layout/AppLayout.tsx
'use client'; // Convertir a Client Component para usar usePathname

import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { usePathname } from 'next/navigation'; // Importar hook
import { cn } from '@/lib/utils'; // Para clases condicionales

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {!isAdminRoute && <Navbar />} {/* Mostrar Navbar solo en rutas no-admin */}
      
      <main
        className={cn(
          "flex-grow", // Clase base para ocupar el espacio vertical
          isAdminRoute 
            ? "animate-fade-in" // Para rutas de admin: ancho completo, AdminLayout maneja su padding
            : "container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 animate-fade-in" // Para rutas no-admin: centrado y con padding
        )}
      >
        {children}
      </main>
      
      {!isAdminRoute && <Footer />} {/* Mostrar Footer solo en rutas no-admin */}
    </div>
  );
}
