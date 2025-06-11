'use client';

import Link from 'next/link';
import { Home, Briefcase, Search, MessageSquare, PlusCircle, UserCircle, LogIn, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import React from 'react';

const navItems = [
  { href: '/properties', label: 'Properties', icon: <Briefcase className="h-4 w-4" /> },
  { href: '/requests', label: 'Requests', icon: <Search className="h-4 w-4" /> },
  // { href: '/forums', label: 'Forums', icon: <MessageSquare className="h-4 w-4" /> }, // TODO: Uncomment when forums are ready
];

export default function Navbar() {
  const [isUserLoggedIn, setIsUserLoggedIn] = React.useState(false); // Placeholder for auth state

  const commonNavLinks = (
    <>
      {navItems.map((item) => (
        <Button key={item.label} variant="ghost" asChild className="text-sm font-medium">
          <Link href={item.href} className="flex items-center gap-2">
            {item.icon}
            {item.label}
          </Link>
        </Button>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Home className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold font-headline text-primary">PropSpot</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {commonNavLinks}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-sm font-medium flex items-center gap-2">
                <PlusCircle className="h-4 w-4" /> Submit
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/properties/submit">List a Property</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/requests/submit">Post a Request</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-2">
          {isUserLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserCircle className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsUserLoggedIn(false)}>Log Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" asChild className="hidden md:flex items-center gap-2">
              <Link href="/auth/signin">
                <LogIn className="h-4 w-4" /> Sign In
              </Link>
            </Button>
          )}
          
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <div className="flex flex-col gap-4 py-6">
                  <Link href="/" className="flex items-center gap-2 px-4">
                     <Home className="h-7 w-7 text-primary" />
                     <span className="text-xl font-bold font-headline text-primary">PropSpot</span>
                  </Link>
                  <Separator />
                  {navItems.map((item) => (
                    <Button key={item.label} variant="ghost" asChild className="justify-start text-base px-4">
                      <Link href={item.href} className="flex items-center gap-3">
                        {item.icon}
                        {item.label}
                      </Link>
                    </Button>
                  ))}
                  <Separator />
                   <Button variant="ghost" asChild className="justify-start text-base px-4">
                      <Link href="/properties/submit" className="flex items-center gap-3">
                        <PlusCircle className="h-4 w-4" /> List a Property
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild className="justify-start text-base px-4">
                      <Link href="/requests/submit" className="flex items-center gap-3">
                        <PlusCircle className="h-4 w-4" /> Post a Request
                      </Link>
                    </Button>
                  <Separator />
                  {isUserLoggedIn ? (
                     <>
                      <Button variant="ghost" asChild className="justify-start text-base px-4">
                        <Link href="/profile" className="flex items-center gap-3">
                          <UserCircle className="h-4 w-4" /> Profile
                        </Link>
                      </Button>
                      <Button variant="ghost" asChild className="justify-start text-base px-4">
                        <Link href="/dashboard" className="flex items-center gap-3">
                           {/* Replace with appropriate dashboard icon */}
                          <Briefcase className="h-4 w-4" /> Dashboard 
                        </Link>
                      </Button>
                      <Button variant="ghost" onClick={() => setIsUserLoggedIn(false)} className="justify-start text-base px-4">
                        Log Out
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" asChild className="mx-4">
                      <Link href="/auth/signin">
                        <LogIn className="h-4 w-4 mr-2" /> Sign In
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

const Separator = () => <div className="h-px bg-border mx-4 my-2" />;
