
// src/components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { Home, Briefcase, Search, PlusCircle, UserCircle, LogIn, Menu, ShieldCheck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import React, { useState, useEffect, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getSiteSettingsAction } from '@/actions/siteSettingsActions';
import type { SiteSettings } from '@/lib/types';
import Image from 'next/image';

const navItems = [
  { href: '/properties', label: 'Propiedades', icon: <Briefcase className="h-4 w-4" /> },
  { href: '/requests', label: 'Solicitudes', icon: <Search className="h-4 w-4" /> },
];

interface StoredUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName?: string;
}

export default function Navbar() {
  const router = useRouter();
  const { toast } = useToast();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  const fetchSiteSettings = useCallback(async () => {
    try {
      const settings = await getSiteSettingsAction();
      setSiteSettings(settings);
    } catch (error) {
      console.error("Error fetching site settings for Navbar:", error);
      // Fallback a null para que use el logo por defecto
      setSiteSettings(null);
    }
  }, []);
  
  useEffect(() => {
    fetchSiteSettings();
  }, [fetchSiteSettings]);


  const updateLoginState = useCallback(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setLoggedInUser(JSON.parse(userJson));
      } catch (error) {
        console.error("Error parsing loggedInUser from localStorage", error);
        localStorage.removeItem('loggedInUser');
        setLoggedInUser(null);
      }
    } else {
      setLoggedInUser(null);
    }
  }, []);

  useEffect(() => {
    updateLoginState(); 

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'loggedInUser') {
        updateLoginState();
      }
      // Si los site_settings cambian (ej. desde el panel de admin en otra pestaña),
      // podríamos necesitar una forma de notificar al Navbar para que recargue.
      // Por simplicidad, recargamos las config del sitio si el storage cambia (aunque no sea 'siteSettings').
      // O podemos añadir un listener específico si 'siteSettings' se guarda en localStorage.
      // Por ahora, lo más simple es que se actualice en la próxima carga o si el usuario navega.
      // O, si 'siteSettings' se guarda en BD y se invalida caché de Next.js, la próxima carga lo tomará.
      // Para un efecto inmediato, podríamos llamar fetchSiteSettings() aquí también si detectamos un cambio relevante.
      // Por ahora, el logo se cargará al inicio y se mantendrá.
       if (event.key === 'siteSettingsUpdated') { // Evento personalizado que dispararíamos desde la página de admin
        fetchSiteSettings();
      }
    };
    
    window.addEventListener('storage', updateLoginState);
    window.addEventListener('storage', handleStorageChange);


    return () => {
      window.removeEventListener('storage', updateLoginState);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [updateLoginState, fetchSiteSettings]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setLoggedInUser(null);
    toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
    router.push('/');
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const isUserAdmin = loggedInUser?.roleId === 'admin';

  const commonNavLinks = (closeMobileMenu?: () => void) => (
    <>
      {navItems.map((item) => (
        <Button key={item.label} variant="ghost" asChild className="text-sm font-medium md:text-base md:justify-start md:px-4 md:py-3 w-full" onClick={closeMobileMenu}>
          <Link href={item.href} className="flex items-center gap-2 md:gap-3">
            {item.icon}
            {item.label}
          </Link>
        </Button>
      ))}
    </>
  );

  const logoDisplay = siteSettings?.logoUrl ? (
    <Image src={siteSettings.logoUrl} alt="Logo del Sitio" width={120} height={30} style={{ objectFit: 'contain', maxHeight: '30px' }} priority />
  ) : (
    <>
      <Home className="h-7 w-7 text-primary" />
      <span className="text-xl font-bold font-headline text-primary">PropSpot</span>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}>
          {logoDisplay}
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {commonNavLinks()}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-sm font-medium flex items-center gap-2">
                <PlusCircle className="h-4 w-4" /> Publicar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/properties/submit">Publicar una Propiedad</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/requests/submit">Publicar una Solicitud</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-2">
          {loggedInUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserCircle className="h-6 w-6" />
                  <span className="sr-only">Menú de Usuario</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">Perfil</Link>
                </DropdownMenuItem>
                {isUserAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Panel de Admin</Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer">
                  <LogOut className="h-4 w-4" /> Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" asChild className="hidden md:flex items-center gap-2">
              <Link href="/auth/signin">
                <LogIn className="h-4 w-4" /> Iniciar Sesión
              </Link>
            </Button>
          )}
          
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Alternar menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] flex flex-col p-0">
                <div className="p-4 border-b">
                    <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                        {logoDisplay}
                    </Link>
                </div>
                <nav className="flex-grow flex flex-col gap-1 p-4"> 
                  {commonNavLinks(() => setIsMobileMenuOpen(false))}
                  <MobileSeparator />
                   <Button variant="ghost" asChild className="justify-start text-base px-4 py-3 w-full" onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/properties/submit" className="flex items-center gap-3 w-full">
                        <PlusCircle className="h-4 w-4" /> Publicar Propiedad
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild className="justify-start text-base px-4 py-3 w-full" onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/requests/submit" className="flex items-center gap-3 w-full">
                        <PlusCircle className="h-4 w-4" /> Publicar Solicitud
                      </Link>
                    </Button>
                  <MobileSeparator />
                  {loggedInUser ? (
                     <>
                      <Button variant="ghost" asChild className="justify-start text-base px-4 py-3 w-full" onClick={() => setIsMobileMenuOpen(false)}>
                        <Link href="/profile" className="flex items-center gap-3 w-full">
                          <UserCircle className="h-4 w-4" /> Perfil
                        </Link>
                      </Button>
                      {isUserAdmin ? (
                        <Button variant="ghost" asChild className="justify-start text-base px-4 py-3 w-full" onClick={() => setIsMobileMenuOpen(false)}>
                            <Link href="/admin" className="flex items-center gap-3 w-full">
                                <ShieldCheck className="h-4 w-4 text-primary" /> Panel de Admin
                            </Link>
                        </Button>
                       ) : (
                        <Button variant="ghost" asChild className="justify-start text-base px-4 py-3 w-full" onClick={() => setIsMobileMenuOpen(false)}>
                          <Link href="/dashboard" className="flex items-center gap-3 w-full">
                            <Briefcase className="h-4 w-4" /> Panel
                          </Link>
                        </Button>
                       )}
                    </>
                  ) : null }
                </nav>
                <div className="p-4 mt-auto border-t">
                    {loggedInUser ? (
                        <Button variant="outline" onClick={handleLogout} className="w-full justify-center text-base py-3 flex items-center gap-3 cursor-pointer">
                            <LogOut className="h-4 w-4" /> Cerrar Sesión
                        </Button>
                    ) : (
                        <Button variant="default" asChild className="w-full justify-center text-base py-3 flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
                            <Link href="/auth/signin">
                                <LogIn className="h-4 w-4" /> Iniciar Sesión
                            </Link>
                        </Button>
                    )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

const MobileSeparator = () => <Separator className="my-2" />;
```