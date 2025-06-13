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
  // Actualizar la condición para incluir rutas de autenticación
  const isSpecialLayoutRoute = 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/auth');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Mostrar Navbar solo si NO es admin, NI dashboard, NI auth */}
      {!isSpecialLayoutRoute && <Navbar />} 
      
      <main
        className={cn(
          "flex-grow", // Clase base para ocupar el espacio vertical
          isSpecialLayoutRoute 
            ? "animate-fade-in" // Para rutas especiales: ancho completo, el layout específico maneja padding
            : "container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 animate-fade-in" // Para rutas normales: centrado y con padding
        )}
      >
        {children}
      </main>
      
      {/* Mostrar Footer solo si NO es admin, NI dashboard, NI auth */}
      {!isSpecialLayoutRoute && <Footer />}
    </div>
  );
}
