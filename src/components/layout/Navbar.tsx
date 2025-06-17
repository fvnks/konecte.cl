// src/components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { Home, Briefcase, Search, PlusCircle, UserCircle, LogIn, Menu, ShieldCheck, LogOut, CreditCard, Users, LayoutDashboard, MessageSquare, UserPlus, MailQuestion } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { getTotalUnreadMessagesCountAction } from '@/actions/chatActions';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import AnnouncementBar from './AnnouncementBar';
import ThemeToggle from './ThemeToggle';
import styled from 'styled-components';

const navItems = [
  { href: '/', label: 'Inicio', icon: <Home /> },
  { href: '/properties', label: 'Propiedades', icon: <Briefcase /> },
  { href: '/requests', label: 'Solicitudes', icon: <Search /> },
  { href: '/plans', label: 'Planes', icon: <CreditCard /> },
  { href: '/contact', label: 'Contacto', icon: <MailQuestion /> },
];

interface StoredUser {
  id: string;
  name: string;
  email: string;
  role_id: string;
  roleName?: string;
  planId?: string | null;
  planName?: string | null;
  avatarUrl?: string;
}

const DEFAULT_NAVBAR_TITLE = "konecte";

const StyledNavContainer = styled.div`
  position: relative;
  display: inline-flex; /* So it wraps its content */
  align-items: center;
  height: 50px; /* Overall height of the nav bar area */
  padding: 5px; /* Padding around the links inside */
  background: rgba(16, 16, 16, 0.05);
  border-radius: 25px; /* Rounded corners for the container */
  
  .dark & {
    background: rgba(220, 220, 220, 0.08);
  }

  &:hover .animated-rect {
    stroke-dasharray: 1; /* Draw full line on container hover */
    stroke-dashoffset: 0;
  }
`;

const StyledNavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding: 8px 12px; /* Padding inside each link */
  margin: 0 2px; /* Small margin between links */
  color: hsl(var(--foreground));
  font-weight: 500;
  font-size: 0.9rem;
  text-decoration: none;
  border-radius: 20px; /* Rounded corners for link hover effect */
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  z-index: 1; /* Links above the SVG */

  .dark & {
    color: hsl(var(--foreground));
  }

  &:hover {
    background-color: #49A7F3;
    color: white !important;
  }

  &:hover svg {
    color: white !important;
    stroke: white !important;
  }

  & svg {
    color: hsl(var(--muted-foreground));
    transition: color 0.2s, stroke 0.2s;
  }
`;

const AnimatedRectSVG = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* So it doesn't interfere with link clicks */
  z-index: 0; /* Behind the links */

  .animated-rect {
    stroke: #49A7F3;
    stroke-width: 2px; /* Thinner stroke */
    fill: transparent;
    stroke-dasharray: 0.02 0.98; /* Start with a very small dash, mostly gap */
    stroke-dashoffset: 0.01;   /* Slightly offset to hide the initial dot better */
    transition: stroke-dasharray 0.6s cubic-bezier(0.25, 0.1, 0.25, 1), stroke-dashoffset 0.6s cubic-bezier(0.25, 0.1, 0.25, 1);
    /* Use pathLength="1" on rect for fractional dasharray/dashoffset */
  }
`;


export default function Navbar() {
  const router = useRouter();
  const { toast } = useToast();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const fetchSiteSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    try {
      const settings = await getSiteSettingsAction();
      setSiteSettings(settings);
    } catch (error) {
      console.error("Error fetching site settings for Navbar:", error);
      setSiteSettings(null);
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
        fetchSiteSettings();
        const handleSettingsUpdate = () => fetchSiteSettings();
        window.addEventListener('siteSettingsUpdated', handleSettingsUpdate);
        return () => window.removeEventListener('siteSettingsUpdated', handleSettingsUpdate);
    }
  }, [isClient, fetchSiteSettings]);


  useEffect(() => {
    if (isClient) {
      const updateState = async () => {
        const userJson = localStorage.getItem('loggedInUser');
        if (userJson) {
          try {
            const user: StoredUser = JSON.parse(userJson);
            setLoggedInUser(user);
            if (user?.id) {
              const unreadCount = await getTotalUnreadMessagesCountAction(user.id);
              setTotalUnreadMessages(unreadCount);
            } else {
              setTotalUnreadMessages(0);
            }
          } catch (error) {
            console.error("Error parsing user or fetching unread count:", error);
            localStorage.removeItem('loggedInUser');
            setLoggedInUser(null);
            setTotalUnreadMessages(0);
          }
        } else {
          setLoggedInUser(null);
          setTotalUnreadMessages(0);
        }
      };

      updateState(); 

      const handleStorageChange = (event: StorageEvent | CustomEvent) => {
        const isRelevantStorageEvent = event instanceof StorageEvent && event.key === 'loggedInUser';
        const isCustomSessionEvent = event.type === 'userSessionChanged';
        const isCustomMessagesEvent = event.type === 'messagesUpdated';

        if (isRelevantStorageEvent || isCustomSessionEvent || isCustomMessagesEvent) {
          updateState();
        }
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('userSessionChanged', handleStorageChange);
      window.addEventListener('messagesUpdated', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('userSessionChanged', handleStorageChange);
        window.removeEventListener('messagesUpdated', handleStorageChange);
      };
    }
  }, [isClient]);


  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setLoggedInUser(null);
    setTotalUnreadMessages(0);
    toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
    router.push('/');
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    window.dispatchEvent(new CustomEvent('userSessionChanged'));
  };

  const isUserAdmin = loggedInUser?.role_id === 'admin';

  const commonNavLinksDesktop = (closeMenu?: () => void) => (
    <>
      {navItems.map((item) => (
        <StyledNavLink
          key={item.label}
          href={item.href}
          onClick={closeMenu}
        >
          {React.cloneElement(item.icon as React.ReactElement, { className: "h-4 w-4"})}
          {item.label}
        </StyledNavLink>
      ))}
    </>
  );

  const siteTitleForDisplay = siteSettings?.siteTitle || DEFAULT_NAVBAR_TITLE;

  const logoDisplayContent = () => {
    if (isLoadingSettings) {
      return (
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-7 w-32 rounded-md" />
        </div>
      );
    }
    if (siteSettings?.logoUrl) {
      return (
        <Image
          src={siteSettings.logoUrl}
          alt={siteTitleForDisplay}
          width={150} 
          height={40} 
          style={{ objectFit: 'contain', maxHeight: '40px', maxWidth: '150px' }}
          priority
          data-ai-hint="logo empresa"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            const parent = target.parentElement;
            if (parent) {
              const textNode = document.createTextNode(siteTitleForDisplay);
              const span = document.createElement('span');
              span.className = "text-2xl font-bold font-headline text-primary";
              const homeIconContainer = document.createElement('span');
              homeIconContainer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home h-7 w-7 text-primary"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
              parent.insertBefore(homeIconContainer.firstChild || homeIconContainer, target);
              parent.insertBefore(span, target);
              span.appendChild(textNode);
            }
            target.style.display = 'none';
          }}
        />
      );
    }
    return (
      <>
        <Home className="h-7 w-7 text-primary" />
        <span className="text-2xl font-bold font-headline text-primary">{siteTitleForDisplay}</span>
      </>
    );
  };

  const MobileMenuLink = ({ href, icon, label, closeMenu, showBadge, badgeCount }: { href: string; icon: React.ReactNode; label: string; closeMenu?: () => void; showBadge?: boolean; badgeCount?: number; }) => (
    <Button variant="ghost" asChild className="justify-start text-lg px-4 py-3.5 w-full hover:bg-primary/10 hover:text-primary rounded-md" onClick={closeMenu}>
      <Link href={href}>
        <span className="flex items-center justify-between w-full">
            <span className="flex items-center gap-2.5">
                {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5 text-primary"})}
                {label}
            </span>
            {showBadge && badgeCount && badgeCount > 0 && (
                 <Badge variant="destructive" className="h-6 px-2 text-xs rounded-md">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Badge>
            )}
        </span>
      </Link>
    </Button>
  );

  const showUnreadBadge = isClient && loggedInUser && totalUnreadMessages > 0;

  return (
    <>
      {isClient && siteSettings && !isLoadingSettings && siteSettings.announcement_bar_is_active && (
        <AnnouncementBar settings={siteSettings} />
      )}
      {isClient && isLoadingSettings && (
         <Skeleton className="h-10 w-full bg-muted/50" /> 
      )}

      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-lg">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}>
            {isClient ? logoDisplayContent() : <div className="flex items-center gap-2.5"><Home className="h-7 w-7 text-primary" /><span className="text-2xl font-bold font-headline text-primary">{DEFAULT_NAVBAR_TITLE}</span></div>}
          </Link>

          <nav className="hidden md:flex items-center gap-0 mx-auto"> {/* gap set by link margin */}
             <StyledNavContainer>
                {commonNavLinksDesktop()}
                <AnimatedRectSVG 
                    preserveAspectRatio="none" /* Stretches SVG content */
                >
                    <rect 
                        className="animated-rect"
                        x="1" y="1"  /* Offset by half stroke-width */
                        width="calc(100% - 2px)" /* SVG width minus stroke-width */
                        height="calc(100% - 2px)" /* SVG height minus stroke-width */
                        rx="24" /* container radius - stroke-width/2 */
                        ry="24"
                        pathLength="1" /* Allows dasharray/offset to be fractions */
                    />
                </AnimatedRectSVG>
             </StyledNavContainer>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
             {isClient && <ThemeToggle />}
            {isClient ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    className="hidden md:flex items-center gap-2 text-sm font-medium px-4 py-2 h-10 rounded-lg shadow-md hover:bg-primary/90 transition-all"
                  >
                    <PlusCircle className="h-5 w-5" /> Publicar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 bg-card shadow-xl rounded-xl border mt-2 p-1.5">
                  <DropdownMenuItem asChild className="hover:bg-primary/10 py-2.5 px-3 rounded-md cursor-pointer">
                    <Link href="/properties/submit">
                        <span className="flex items-center gap-2.5 text-sm w-full">
                            <Briefcase className="h-4 w-4 text-primary"/>Publicar Propiedad
                        </span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-primary/10 py-2.5 px-3 rounded-md cursor-pointer">
                    <Link href="/requests/submit">
                        <span className="flex items-center gap-2.5 text-sm w-full">
                            <Search className="h-4 w-4 text-primary"/>Publicar Solicitud
                        </span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Skeleton className="h-10 w-32 hidden md:flex rounded-lg" />
            )}

            {isClient && loggedInUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-12 w-12 rounded-full p-0 hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <Avatar className="h-12 w-12 border-2 border-primary/30 hover:border-primary/60 transition-colors">
                        <AvatarImage src={loggedInUser.avatarUrl || `https://placehold.co/48x48.png?text=${loggedInUser.name.substring(0,1)}`} alt={loggedInUser.name} data-ai-hint="persona avatar"/>
                        <AvatarFallback className="bg-muted text-muted-foreground text-lg">{loggedInUser.name.substring(0,1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {showUnreadBadge && (
                          <Badge
                            variant="destructive" 
                            className="absolute top-0.5 right-0.5 transform translate-x-1/4 -translate-y-1/4 h-5 min-w-[1.25rem] px-1.5 text-xs rounded-full flex items-center justify-center leading-none z-10"
                          >
                              {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                          </Badge>
                      )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-card shadow-xl rounded-xl border mt-2 p-1.5">
                  <div className="px-3.5 py-3">
                      <p className="text-sm font-semibold leading-none truncate">{loggedInUser.name}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate mt-0.5">
                        {loggedInUser.email}
                      </p>
                      <div className="mt-2.5 space-y-1.5">
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <ShieldCheck className="h-4 w-4 text-primary/80"/>
                              Rol: <span className="font-medium text-foreground">{loggedInUser.roleName || loggedInUser.role_id}</span>
                          </p>
                          {loggedInUser.planName && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <CreditCard className="h-4 w-4 text-primary/80"/> Plan: <span className="font-medium text-foreground">{loggedInUser.planName}</span>
                              </p>
                          )}
                      </div>
                    </div>
                  <DropdownMenuSeparator className="mx-1.5" />
                  <DropdownMenuItem asChild className="hover:bg-primary/10 py-2.5 px-3 rounded-md cursor-pointer">
                    <Link href="/profile">
                      <span className="flex items-center w-full gap-2.5 text-sm">
                          <UserCircle className="h-4 w-4 text-primary"/>Perfil
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  {isUserAdmin ? (
                    <DropdownMenuItem asChild className="hover:bg-primary/10 py-2.5 px-3 rounded-md cursor-pointer">
                      <Link href="/admin">
                          <span className="flex items-center w-full gap-2.5 text-sm">
                              <LayoutDashboard className="h-4 w-4 text-primary"/>Panel Admin
                          </span>
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild className="hover:bg-primary/10 py-2.5 px-3 rounded-md cursor-pointer">
                      <Link href="/dashboard">
                          <span className="flex items-center w-full justify-between text-sm">
                              <span className="flex items-center gap-2.5">
                                  <LayoutDashboard className="h-4 w-4 text-primary"/>Mi Panel
                              </span>
                              {showUnreadBadge && (
                                  <Badge variant="destructive" className="h-5 px-1.5 text-xs rounded-md">
                                      {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                                  </Badge>
                              )}
                          </span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="hover:bg-primary/10 py-2.5 px-3 rounded-md cursor-pointer">
                    <Link href="/dashboard/crm">
                      <span className="flex items-center w-full gap-2.5 text-sm">
                          <Users className="h-4 w-4 text-primary"/>Mi CRM
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="mx-1.5" />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2.5 cursor-pointer text-destructive hover:!bg-destructive/10 hover:!text-destructive py-2.5 px-3 rounded-md text-sm">
                    <LogOut className="h-4 w-4" /> Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isClient ? (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="outline" size="default" asChild className="hover:bg-primary/5 hover:border-primary/70 hover:text-primary text-sm px-4 py-2 h-10 rounded-lg transition-colors">
                  <Link href="/auth/signin">
                    <span className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" /> Iniciar Sesión
                    </span>
                  </Link>
                </Button>
                <Button variant="default" size="default" asChild className="text-sm px-4 py-2 h-10 rounded-lg shadow-md hover:bg-primary/90 transition-all">
                  <Link href="/auth/signup">
                    <span className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" /> Regístrate
                    </span>
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="h-10 hidden md:flex items-center gap-2">
                  <Skeleton className="h-full w-32 rounded-lg" />
                  <Skeleton className="h-full w-32 rounded-lg" />
              </div>
            )}

            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-primary/10 relative rounded-lg">
                    <Menu className="h-5 w-5 text-primary" />
                    <span className="sr-only">Alternar menú</span>
                    {showUnreadBadge && ( 
                          <Badge variant="destructive" className="absolute -top-0.5 -right-0.5 h-4 min-w-[1rem] px-1 text-[10px] rounded-full flex items-center justify-center leading-none">
                              {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                          </Badge>
                      )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[340px] flex flex-col p-0 pt-5 bg-card border-l shadow-2xl">
                  <div className="px-5 pb-4 border-b">
                      <Link href="/" className="flex items-center gap-2.5" onClick={() => setIsMobileMenuOpen(false)}>
                          {isClient ? logoDisplayContent() : <div className="flex items-center gap-2.5"><Home className="h-7 w-7 text-primary" /><span className="text-2xl font-bold font-headline text-primary">{DEFAULT_NAVBAR_TITLE}</span></div>}
                      </Link>
                  </div>
                  <nav className="flex-grow flex flex-col gap-1.5 p-4 overflow-y-auto">
                    {navItems.map((item) => (
                      <MobileMenuLink 
                        key={`mobile-${item.label}`}
                        href={item.href} 
                        icon={item.icon} 
                        label={item.label} 
                        closeMenu={() => setIsMobileMenuOpen(false)} 
                      />
                    ))}

                    <Separator className="my-3" />
                    <p className="px-4 text-sm font-semibold text-muted-foreground mb-1.5">Publicar</p>
                    <MobileMenuLink href="/properties/submit" icon={<PlusCircle />} label="Publicar Propiedad" closeMenu={() => setIsMobileMenuOpen(false)} />
                    <MobileMenuLink href="/requests/submit" icon={<PlusCircle />} label="Publicar Solicitud" closeMenu={() => setIsMobileMenuOpen(false)} />

                    {isClient && loggedInUser && (
                      <>
                        <Separator className="my-3" />
                        <p className="px-4 text-sm font-semibold text-muted-foreground mb-1.5">Mi Cuenta</p>
                        <MobileMenuLink href="/profile" icon={<UserCircle />} label="Mi Perfil" closeMenu={() => setIsMobileMenuOpen(false)} />
                        {isUserAdmin ? (
                          <MobileMenuLink href="/admin" icon={<LayoutDashboard />} label="Panel Admin" closeMenu={() => setIsMobileMenuOpen(false)} />
                        ) : (
                          <MobileMenuLink href="/dashboard" icon={<LayoutDashboard />} label="Mi Panel" closeMenu={() => setIsMobileMenuOpen(false)} showBadge={showUnreadBadge} badgeCount={totalUnreadMessages} />
                        )}
                          <MobileMenuLink href="/dashboard/crm" icon={<Users />} label="Mi CRM" closeMenu={() => setIsMobileMenuOpen(false)} />
                      </>
                    )}
                  </nav>
                  <div className="p-4 mt-auto border-t">
                      {isClient && <ThemeToggle />} 
                      {isClient && loggedInUser ? (
                          <Button variant="outline" onClick={handleLogout} className="w-full justify-center text-lg py-3.5 flex items-center gap-2.5 cursor-pointer hover:border-destructive hover:text-destructive hover:bg-destructive/5 rounded-lg mt-3">
                              <LogOut className="h-5 w-5" /> Cerrar Sesión
                          </Button>
                      ) : isClient ? (
                          <div className="space-y-3 mt-3">
                              <Button variant="default" asChild className="w-full justify-center text-lg py-3.5 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
                                  <Link href="/auth/signup">
                                      <span className="flex items-center gap-2.5">
                                          <UserPlus className="h-5 w-5" /> Regístrate
                                      </span>
                                  </Link>
                              </Button>
                              <Button variant="outline" asChild className="w-full justify-center text-lg py-3.5 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
                                  <Link href="/auth/signin">
                                      <span className="flex items-center gap-2.5">
                                          <LogIn className="h-5 w-5" /> Iniciar Sesión
                                      </span>
                                  </Link>
                              </Button>
                          </div>
                      ) : (
                        <div className="space-y-3 mt-3">
                          <Skeleton className="h-12 w-full rounded-lg" />
                          <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                      )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
