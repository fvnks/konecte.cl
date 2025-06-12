
// src/components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { Home, Briefcase, Search, PlusCircle, UserCircle, LogIn, Menu, ShieldCheck, LogOut, CreditCard, Users, LayoutDashboard } from 'lucide-react';
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
  { href: '/properties', label: 'Propiedades', icon: <Briefcase /> },
  { href: '/requests', label: 'Solicitudes', icon: <Search /> },
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
     // Escuchar evento personalizado para actualizar settings si cambian en otra parte
    const handleSettingsUpdate = () => fetchSiteSettings();
    window.addEventListener('siteSettingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('siteSettingsUpdated', handleSettingsUpdate);
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

    const handleStorageChange = (event: StorageEvent | Event) => {
      // Manejar tanto StorageEvent como el evento personalizado 'storage'
      if (event instanceof StorageEvent) {
        if (event.key === 'loggedInUser') {
          updateLoginState();
        }
      } else if (event.type === 'storage' && (event as CustomEvent).detail?.key === 'loggedInUser') {
         updateLoginState();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    // También escuchar el evento personalizado 'storage' por si acaso.
    // Este se dispara manualmente desde signInAction.
    document.addEventListener('storage', handleStorageChange);


    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('storage', handleStorageChange);
    };
  }, [updateLoginState]);

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
        <Button key={item.label} variant="ghost" asChild className="text-sm font-medium hover:bg-primary/10 hover:text-primary md:text-base md:justify-start md:px-4 md:py-2 w-full" onClick={closeMobileMenu}>
          <Link href={item.href} className="flex items-center gap-2 md:gap-2.5">
            {React.cloneElement(item.icon, { className: "h-4 w-4 md:h-5 md:w-5"})}
            {item.label}
          </Link>
        </Button>
      ))}
    </>
  );

  const logoDisplay = siteSettings?.logoUrl ? (
    <Image src={siteSettings.logoUrl} alt={siteSettings.siteTitle || "PropSpot Logo"} width={140} height={36} style={{ objectFit: 'contain', maxHeight: '36px' }} priority data-ai-hint="logo empresa"/>
  ) : (
    <>
      <Home className="h-7 w-7 text-primary" />
      <span className="text-2xl font-bold font-headline text-primary">PropSpot</span>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-lg">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}>
          {logoDisplay}
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {commonNavLinks()}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-sm font-medium flex items-center gap-2 px-4 py-2 hover:bg-primary/10 hover:text-primary">
                <PlusCircle className="h-5 w-5" /> Publicar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card shadow-xl rounded-lg border">
              <DropdownMenuItem asChild className="hover:bg-primary/10 py-2.5">
                <Link href="/properties/submit" className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary"/>Publicar Propiedad</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-primary/10 py-2.5">
                <Link href="/requests/submit" className="flex items-center gap-2"><Search className="h-4 w-4 text-primary"/>Publicar Solicitud</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-3">
          {isClient && loggedInUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:opacity-80 transition-opacity">
                    <Avatar className="h-10 w-10 border-2 border-primary/50">
                      <AvatarImage src={loggedInUser.avatarUrl || `https://placehold.co/40x40.png?text=${loggedInUser.name.substring(0,1)}`} alt={loggedInUser.name} data-ai-hint="persona avatar"/>
                      <AvatarFallback className="bg-muted text-muted-foreground">{loggedInUser.name.substring(0,1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-card shadow-xl rounded-lg border">
                 <div className="px-3 py-3">
                    <p className="text-sm font-semibold leading-none truncate">{loggedInUser.name}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate mt-0.5">
                      {loggedInUser.email}
                    </p>
                    <div className="mt-2 space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-primary/80"/>
                            Rol: <span className="font-medium text-foreground">{loggedInUser.roleName || loggedInUser.roleId}</span>
                        </p>
                        {loggedInUser.planName && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-primary/80"/> Plan: <span className="font-medium text-foreground">{loggedInUser.planName}</span>
                            </p>
                        )}
                    </div>
                  </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="hover:bg-primary/10 py-2.5">
                  <Link href="/profile" className="flex items-center w-full gap-2"><UserCircle className="h-4 w-4 text-primary"/>Perfil</Link>
                </DropdownMenuItem>
                {isUserAdmin ? (
                  <DropdownMenuItem asChild className="hover:bg-primary/10 py-2.5">
                    <Link href="/admin" className="flex items-center w-full gap-2"><LayoutDashboard className="h-4 w-4 text-primary"/>Panel Admin</Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild className="hover:bg-primary/10 py-2.5">
                    <Link href="/dashboard" className="flex items-center w-full gap-2"><LayoutDashboard className="h-4 w-4 text-primary"/>Panel</Link>
                  </DropdownMenuItem>
                )}
                 <DropdownMenuItem asChild className="hover:bg-primary/10 py-2.5">
                  <Link href="/dashboard/crm" className="flex items-center w-full gap-2"><Users className="h-4 w-4 text-primary"/>Mi CRM</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive hover:!bg-destructive/10 hover:!text-destructive py-2.5">
                  <LogOut className="h-4 w-4" /> Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isClient ? (
            <Button variant="outline" size="default" asChild className="hidden md:flex items-center gap-2 hover:bg-primary/10 hover:border-primary hover:text-primary">
              <Link href="/auth/signin">
                <LogIn className="h-4 w-4" /> Iniciar Sesión
              </Link>
            </Button>
          ) : (
             <div className="h-10 w-24 hidden md:block bg-muted/50 rounded-md animate-pulse"></div> 
          )}
          
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Alternar menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[340px] flex flex-col p-0 pt-5 bg-card">
                <div className="px-5 pb-4 border-b">
                    <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                        {logoDisplay}
                    </Link>
                </div>
                <nav className="flex-grow flex flex-col gap-1.5 p-5 overflow-y-auto"> 
                  {commonNavLinks(() => setIsMobileMenuOpen(false))}
                  <MobileSeparator />
                   <Button variant="ghost" asChild className="justify-start text-base px-4 py-3 w-full hover:bg-primary/10 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/properties/submit" className="flex items-center gap-2.5 w-full">
                        <PlusCircle className="h-5 w-5 text-primary" /> Publicar Propiedad
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild className="justify-start text-base px-4 py-3 w-full hover:bg-primary/10 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/requests/submit" className="flex items-center gap-2.5 w-full">
                        <PlusCircle className="h-5 w-5 text-primary" /> Publicar Solicitud
                      </Link>
                    </Button>
                  <MobileSeparator />
                  {isClient && loggedInUser ? (
                     <>
                      <Button variant="ghost" asChild className="justify-start text-base px-4 py-3 w-full hover:bg-primary/10 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                        <Link href="/profile" className="flex items-center gap-2.5 w-full">
                          <UserCircle className="h-5 w-5 text-primary" /> Perfil
                        </Link>
                      </Button>
                      {isUserAdmin ? (
                        <Button variant="ghost" asChild className="justify-start text-base px-4 py-3 w-full hover:bg-primary/10 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                            <Link href="/admin" className="flex items-center gap-2.5 w-full">
                                <LayoutDashboard className="h-5 w-5 text-primary" /> Panel Admin
                            </Link>
                        </Button>
                       ) : (
                        <Button variant="ghost" asChild className="justify-start text-base px-4 py-3 w-full hover:bg-primary/10 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                          <Link href="/dashboard" className="flex items-center gap-2.5 w-full">
                            <LayoutDashboard className="h-5 w-5 text-primary" /> Panel
                          </Link>
                        </Button>
                       )}
                        <Button variant="ghost" asChild className="justify-start text-base px-4 py-3 w-full hover:bg-primary/10 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                          <Link href="/dashboard/crm" className="flex items-center gap-2.5 w-full">
                            <Users className="h-5 w-5 text-primary" /> Mi CRM
                          </Link>
                        </Button>
                    </>
                  ) : null }
                </nav>
                <div className="p-5 mt-auto border-t">
                    {isClient && loggedInUser ? (
                        <Button variant="outline" onClick={handleLogout} className="w-full justify-center text-base py-3.5 flex items-center gap-3 cursor-pointer hover:border-destructive hover:text-destructive hover:bg-destructive/5">
                            <LogOut className="h-5 w-5" /> Cerrar Sesión
                        </Button>
                    ) : isClient ? (
                        <Button variant="default" asChild className="w-full justify-center text-base py-3.5 flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
                            <Link href="/auth/signin">
                                <LogIn className="h-5 w-5" /> Iniciar Sesión
                            </Link>
                        </Button>
                    ) : (
                      <div className="h-12 w-full bg-muted/50 rounded-md animate-pulse"></div> 
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

const MobileSeparator = () => <Separator className="my-2.5" />;
