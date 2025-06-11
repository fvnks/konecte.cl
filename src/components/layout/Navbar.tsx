
// src/components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { Home, Briefcase, Search, PlusCircle, UserCircle, LogIn, Menu, ShieldCheck, LogOut, CreditCard } from 'lucide-react'; // Added CreditCard
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
  planId?: string | null; // Añadido
  planName?: string | null; // Añadido
  avatarUrl?: string; // Añadido
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
       if (event.key === 'siteSettingsUpdated') { 
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
                 <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={loggedInUser.avatarUrl || `https://placehold.co/40x40.png?text=${loggedInUser.name.substring(0,1)}`} alt={loggedInUser.name} data-ai-hint="persona"/>
                      <AvatarFallback>{loggedInUser.name.substring(0,1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                 <DropdownMenuItem disabled>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{loggedInUser.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {loggedInUser.email}
                      </p>
                       {loggedInUser.planName && (
                        <p className="text-xs leading-none text-primary mt-1">Plan: {loggedInUser.planName}</p>
                      )}
                    </div>
                  </DropdownMenuItem>
                <DropdownMenuSeparator />
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

// Added for consistency in Navbar user display
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
