
// src/components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { Home, Briefcase, Search, PlusCircle, UserCircle, LogIn, Menu, ShieldCheck, LogOut, CreditCard, Users } from 'lucide-react'; // Added Users for CRM
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  planId?: string | null;
  planName?: string | null;
  avatarUrl?: string;
}

export default function Navbar() {
  const router = useRouter();
  const { toast } = useToast();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


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
        <Button key={item.label} variant="ghost" asChild className="text-sm font-medium md:text-base md:justify-start md:px-3 md:py-2 w-full" onClick={closeMobileMenu}>
          <Link href={item.href} className="flex items-center gap-2 md:gap-2.5">
            {React.cloneElement(item.icon, { className: "h-4 w-4 md:h-5 md:w-5"})}
            {item.label}
          </Link>
        </Button>
      ))}
    </>
  );

  const logoDisplay = siteSettings?.logoUrl ? (
    <Image src={siteSettings.logoUrl} alt={siteSettings.siteTitle || "PropSpot Logo"} width={130} height={32} style={{ objectFit: 'contain', maxHeight: '32px' }} priority data-ai-hint="logo empresa"/>
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
              <Button variant="ghost" className="text-sm font-medium flex items-center gap-2 px-3 py-2">
                <PlusCircle className="h-5 w-5" /> Publicar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/properties/submit">Publicar Propiedad</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/requests/submit">Publicar Solicitud</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-2">
          {isClient && loggedInUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={loggedInUser.avatarUrl || `https://placehold.co/40x40.png?text=${loggedInUser.name.substring(0,1)}`} alt={loggedInUser.name} data-ai-hint="persona avatar"/>
                      <AvatarFallback>{loggedInUser.name.substring(0,1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                 <DropdownMenuItem disabled>
                    <div className="flex flex-col space-y-1 py-1">
                      <p className="text-sm font-medium leading-none">{loggedInUser.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {loggedInUser.email}
                      </p>
                       {loggedInUser.planName && (
                        <p className="text-xs leading-none text-primary mt-1 flex items-center">
                          <CreditCard className="mr-1.5 h-3 w-3"/> Plan: {loggedInUser.planName}
                        </p>
                      )}
                    </div>
                  </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center w-full"><UserCircle className="mr-2 h-4 w-4"/>Perfil</Link>
                </DropdownMenuItem>
                {isUserAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center w-full"><ShieldCheck className="mr-2 h-4 w-4 text-primary"/>Panel Admin</Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center w-full"><Briefcase className="mr-2 h-4 w-4"/>Panel</Link>
                  </DropdownMenuItem>
                )}
                 <DropdownMenuItem asChild>
                  <Link href="/dashboard/crm" className="flex items-center w-full"><Users className="mr-2 h-4 w-4"/>Mi CRM</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="h-4 w-4" /> Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isClient ? (
            <Button variant="outline" size="sm" asChild className="hidden md:flex items-center gap-2">
              <Link href="/auth/signin">
                <LogIn className="h-4 w-4" /> Iniciar Sesión
              </Link>
            </Button>
          ) : (
             <div className="h-8 w-20 hidden md:block"></div> // Placeholder for SSR
          )}
          
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Alternar menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] flex flex-col p-0 pt-4">
                <div className="px-4 pb-3 border-b">
                    <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                        {logoDisplay}
                    </Link>
                </div>
                <nav className="flex-grow flex flex-col gap-1 p-4"> 
                  {commonNavLinks(() => setIsMobileMenuOpen(false))}
                  <MobileSeparator />
                   <Button variant="ghost" asChild className="justify-start text-base px-3 py-2 w-full" onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/properties/submit" className="flex items-center gap-2.5 w-full">
                        <PlusCircle className="h-5 w-5" /> Publicar Propiedad
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild className="justify-start text-base px-3 py-2 w-full" onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/requests/submit" className="flex items-center gap-2.5 w-full">
                        <PlusCircle className="h-5 w-5" /> Publicar Solicitud
                      </Link>
                    </Button>
                  <MobileSeparator />
                  {isClient && loggedInUser ? (
                     <>
                      <Button variant="ghost" asChild className="justify-start text-base px-3 py-2 w-full" onClick={() => setIsMobileMenuOpen(false)}>
                        <Link href="/profile" className="flex items-center gap-2.5 w-full">
                          <UserCircle className="h-5 w-5" /> Perfil
                        </Link>
                      </Button>
                      {isUserAdmin ? (
                        <Button variant="ghost" asChild className="justify-start text-base px-3 py-2 w-full" onClick={() => setIsMobileMenuOpen(false)}>
                            <Link href="/admin" className="flex items-center gap-2.5 w-full">
                                <ShieldCheck className="h-5 w-5 text-primary" /> Panel Admin
                            </Link>
                        </Button>
                       ) : (
                        <Button variant="ghost" asChild className="justify-start text-base px-3 py-2 w-full" onClick={() => setIsMobileMenuOpen(false)}>
                          <Link href="/dashboard" className="flex items-center gap-2.5 w-full">
                            <Briefcase className="h-5 w-5" /> Panel
                          </Link>
                        </Button>
                       )}
                        <Button variant="ghost" asChild className="justify-start text-base px-3 py-2 w-full" onClick={() => setIsMobileMenuOpen(false)}>
                          <Link href="/dashboard/crm" className="flex items-center gap-2.5 w-full">
                            <Users className="h-5 w-5" /> Mi CRM
                          </Link>
                        </Button>
                    </>
                  ) : null }
                </nav>
                <div className="p-4 mt-auto border-t">
                    {isClient && loggedInUser ? (
                        <Button variant="outline" onClick={handleLogout} className="w-full justify-center text-base py-3 flex items-center gap-3 cursor-pointer">
                            <LogOut className="h-5 w-5" /> Cerrar Sesión
                        </Button>
                    ) : isClient ? (
                        <Button variant="default" asChild className="w-full justify-center text-base py-3 flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
                            <Link href="/auth/signin">
                                <LogIn className="h-5 w-5" /> Iniciar Sesión
                            </Link>
                        </Button>
                    ) : (
                      <div className="h-10 w-full"></div> // Placeholder for SSR
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
