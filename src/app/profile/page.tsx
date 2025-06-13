
// src/app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Mail, ShieldCheck, CreditCard, Edit, Lock, LogIn, Loader2, ExternalLink, MessageSquare, LayoutDashboard } from 'lucide-react';
import type { User as StoredUserType } from '@/lib/types'; 

interface ProfileUser extends StoredUserType {
  roleName?: string;
  planName?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); 
  }, []);

  useEffect(() => {
    if (isClient) {
      const userJson = localStorage.getItem('loggedInUser');
      if (userJson) {
        try {
          const parsedUser: ProfileUser = JSON.parse(userJson);
          setUser(parsedUser);
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
          localStorage.removeItem('loggedInUser'); 
        }
      }
      setIsLoading(false);
    }
  }, [isClient]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <UserCircle className="h-20 w-20 text-muted-foreground mb-6" />
        <h1 className="text-2xl font-bold mb-3">Perfil de Usuario</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Debes iniciar sesión para ver tu perfil.
        </p>
        <Button asChild size="lg">
          <Link href="/auth/signin" className="flex items-center gap-2">
            <LogIn className="h-5 w-5" /> Iniciar Sesión
          </Link>
        </Button>
      </div>
    );
  }

  const userNameInitials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : '??';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="shadow-xl rounded-xl border">
        <CardHeader className="text-center items-center pt-8 pb-6 bg-secondary/30 rounded-t-xl">
          <Avatar className="h-28 w-28 border-4 border-background shadow-md">
            <AvatarImage src={user.avatarUrl || `https://placehold.co/112x112.png?text=${userNameInitials}`} alt={user.name || 'Avatar'} data-ai-hint="persona retrato" />
            <AvatarFallback className="text-4xl">{userNameInitials}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-headline mt-4">{user.name}</CardTitle>
          {user.email && (
            <CardDescription className="text-md text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-4 w-4" /> {user.email}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="space-y-3">
            {user.roleName && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span>Rol en la Plataforma:</span>
                </div>
                <Badge variant="secondary" className="text-sm font-medium">{user.roleName}</Badge>
              </div>
            )}
            {user.planName && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Plan Actual:</span>
                </div>
                <Badge variant="outline" className="text-sm font-medium">{user.planName}</Badge>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t">
            <Button variant="outline" className="w-full text-base py-2.5 h-auto rounded-md" disabled>
              <Edit className="mr-2 h-4 w-4" /> Editar Perfil
            </Button>
            <Button variant="outline" className="w-full text-base py-2.5 h-auto rounded-md" disabled>
              <Lock className="mr-2 h-4 w-4" /> Cambiar Contraseña
            </Button>
             <Button variant="outline" asChild className="w-full text-base py-2.5 h-auto rounded-md sm:col-span-2">
                <Link href="/dashboard/messages" className="flex items-center gap-2">
                    <MessageSquare className="mr-2 h-4 w-4" /> Mis Mensajes
                </Link>
             </Button>
          </div>
          
           {user.roleId === 'admin' ? (
             <Button variant="default" asChild className="w-full text-base py-2.5 h-auto rounded-md mt-4">
                <Link href="/admin" className="flex items-center gap-2">
                    <LayoutDashboard className="mr-2 h-4 w-4"/> Ir al Panel de Admin <ExternalLink className="h-4 w-4"/>
                </Link>
             </Button>
          ) : (
            <Button variant="default" asChild className="w-full text-base py-2.5 h-auto rounded-md mt-4">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <LayoutDashboard className="mr-2 h-4 w-4"/> Ir a Mi Panel <ExternalLink className="h-4 w-4"/>
                </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
