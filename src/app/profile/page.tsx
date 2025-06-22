// src/app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Mail, ShieldCheck, CreditCard, Edit, Lock, LogIn, Loader2, ExternalLink, MessageSquare, LayoutDashboard, Phone, Building as BuildingIcon, Globe } from 'lucide-react';
import type { User as StoredUserType } from '@/lib/types'; 
import { Separator } from '@/components/ui/separator';

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

  const isBroker = user.role_id === 'broker';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="shadow-xl rounded-xl border">
        <CardHeader className="text-center items-center pt-8 pb-6 bg-secondary/30 rounded-t-xl">
          <Avatar className="h-28 w-28 border-4 border-background shadow-md">
            <AvatarImage src={user.avatarUrl || `https://placehold.co/112x112.png?text=${userNameInitials}`} alt={user.name || 'Avatar'} data-ai-hint="persona retrato" />
            <AvatarFallback className="text-4xl">{userNameInitials}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-headline mt-4">{user.name}</CardTitle>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2 text-muted-foreground">
            {user.email && (
              <span className="text-md flex items-center gap-1.5"><Mail className="h-4 w-4" /> {user.email}</span>
            )}
            {user.rut_tin && (
              <span className="text-md flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> {user.rut_tin}</span>
            )}
          </div>
           <div className="mt-3">
              <Button asChild variant="outline" size="sm" className="bg-card hover:bg-card/90">
                <Link href="/profile/edit">
                  <Edit className="mr-2 h-4 w-4" /> Editar Perfil
                </Link>
              </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Información General</h3>
            <div className="flex items-center p-3 bg-muted/30 rounded-lg">
                <Phone className="h-5 w-5 mr-3 text-primary/80 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{user.phone_number || 'No proporcionado'}</p>
                </div>
            </div>
             <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span>Rol en la Plataforma:</span>
                </div>
                <Badge variant="secondary" className="text-sm font-medium">{user.role_name || user.role_id}</Badge>
              </div>
            {user.plan_id && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Plan Actual:</span>
                </div>
                <Badge variant="outline" className="text-sm font-medium">{user.plan_name || 'N/A'}</Badge>
              </div>
            )}
          </div>

          {isBroker && (
            <>
            <Separator />
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Información de Corredor</h3>
                <p className="text-sm"><span className="font-medium">Empresa:</span> {user.company_name || 'No proporcionado'}</p>
                <p className="text-sm"><span className="font-medium">Ubicación Principal:</span> {user.main_operating_commune || 'N/A'}, {user.main_operating_region || 'N/A'}</p>
                 <p className="text-sm"><span className="font-medium">Propiedades en Cartera:</span> {user.properties_in_portfolio_count ?? 'No proporcionado'}</p>
                 <p className="text-sm flex items-center gap-2"><span className="font-medium">Web/RRSS:</span> 
                    {user.website_social_media_link ? 
                    <a href={user.website_social_media_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">{user.website_social_media_link} <ExternalLink className="h-3 w-3"/></a>
                    : 'No proporcionado'
                    }
                </p>
            </div>
            </>
          )}

          <Separator/>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Button variant="default" asChild className="w-full text-base py-2.5 h-auto rounded-md">
                <Link href={user.role_id === 'admin' ? "/admin" : "/dashboard"} className="flex items-center gap-2">
                    <LayoutDashboard className="mr-2 h-4 w-4"/> Ir al Panel
                </Link>
             </Button>
             <Button variant="outline" asChild className="w-full text-base py-2.5 h-auto rounded-md">
                <Link href="/dashboard/messages" className="flex items-center gap-2">
                    <MessageSquare className="mr-2 h-4 w-4" /> Mis Mensajes
                </Link>
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
