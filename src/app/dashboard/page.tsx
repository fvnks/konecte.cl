
// src/app/dashboard/page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, ListTree, SearchCheck, Building, UserCircle, Loader2, CreditCard, Users as UsersIcon, LayoutGrid, ArrowRight } from 'lucide-react';
import PropertyListItem from '@/components/property/PropertyListItem';
import RequestListItem from '@/components/request/RequestListItem';
import type { PropertyListing, SearchRequest, User as StoredUserType } from '@/lib/types';
import { useEffect, useState } from 'react';
import { getUserPropertiesAction } from '@/actions/propertyActions';
import { getUserRequestsAction } from '@/actions/requestActions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DashboardUser extends StoredUserType {
  planId?: string | null;
  planName?: string | null;
}

export default function DashboardPage() {
  const [loggedInUser, setLoggedInUser] = useState<DashboardUser | null>(null);
  const [userProperties, setUserProperties] = useState<PropertyListing[]>([]);
  const [userRequests, setUserRequests] = useState<SearchRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const user: DashboardUser = JSON.parse(userJson);
        setLoggedInUser(user);
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
      }
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (loggedInUser?.id) {
        setIsLoading(true);
        try {
            const [properties, requests] = await Promise.all([
            getUserPropertiesAction(loggedInUser.id),
            getUserRequestsAction(loggedInUser.id)
            ]);
            setUserProperties(properties);
            setUserRequests(requests);
        } catch(error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
      } else if (isClient && localStorage.getItem('loggedInUser') === null) {
        setIsLoading(false);
        setUserProperties([]);
        setUserRequests([]);
      }
    }
    if (isClient) {
        fetchData();
    }
  }, [loggedInUser, isClient]);

  const userName = loggedInUser?.name || "Usuario";
  const userAvatar = loggedInUser?.avatarUrl;
  const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  if (!isClient || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,10rem)-var(--footer-height,5rem))] py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando tu panel...</p>
      </div>
    );
  }

  if (!loggedInUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,10rem)-var(--footer-height,5rem))] py-10">
        <UserCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl font-semibold mb-2">Debes iniciar sesión para ver tu panel.</p>
        <Button asChild>
          <Link href="/auth/signin">Iniciar Sesión</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <Card className="shadow-xl rounded-xl border overflow-hidden">
        <CardHeader className="p-6 md:p-8 bg-gradient-to-br from-primary/10 to-accent/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-card shadow-md">
                <AvatarImage src={userAvatar} alt={userName} data-ai-hint="usuario perfil"/>
                <AvatarFallback className="text-2xl md:text-3xl bg-muted">{userInitials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl md:text-4xl font-headline font-bold">¡Hola, {userName}!</CardTitle>
                <CardDescription className="text-base md:text-lg text-muted-foreground mt-1">Bienvenido a tu centro de control en PropSpot.</CardDescription>
              </div>
            </div>
            {loggedInUser && (
                 <div className="text-sm bg-card p-4 rounded-lg shadow-sm border text-right sm:text-left min-w-[220px] self-start sm:self-center">
                    <p className="font-semibold text-foreground mb-0.5">Tu Plan Actual:</p>
                    <p className="text-primary font-medium flex items-center sm:items-start md:items-center gap-1.5 text-lg">
                        <CreditCard className="h-5 w-5 mt-0.5" />
                        {loggedInUser.planName || "Básico"}
                    </p>
                    <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-xs text-accent hover:text-accent/80" asChild>
                        <Link href="/profile"> {/* TODO: Link to plans/upgrade page if exists */}
                            {loggedInUser.planName ? "Gestionar Plan" : "Ver Planes"} <ArrowRight className="h-3 w-3 ml-1"/>
                        </Link>
                    </Button>
                </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button asChild size="lg" variant="default" className="h-14 text-base rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Link href="/properties/submit" className="flex items-center gap-2.5">
              <PlusCircle className="h-5 w-5" /> Publicar Propiedad
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="h-14 text-base rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Link href="/requests/submit" className="flex items-center gap-2.5">
              <PlusCircle className="h-5 w-5" /> Publicar Solicitud
            </Link>
          </Button>
           <Button asChild size="lg" variant="outline" className="h-14 text-base rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <Link href="/dashboard/crm" className="flex items-center gap-2.5">
              <UsersIcon className="h-5 w-5" /> Ir a Mi CRM
            </Link>
          </Button>
        </CardContent>
      </Card>

      {!isLoading && loggedInUser && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
          <Card className="rounded-xl shadow-lg border">
            <CardHeader className="p-6 md:p-8">
              <CardTitle className="text-2xl font-headline flex items-center gap-3">
                <ListTree className="h-7 w-7 text-primary" /> Mis Propiedades ({userProperties.length})
              </CardTitle>
              <CardDescription>Gestiona las propiedades que has listado.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 pt-0 space-y-6">
              {userProperties.length > 0 ? (
                userProperties.slice(0,2).map(property => (
                  <PropertyListItem key={property.id} property={property} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Building className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg">Aún no has publicado ninguna propiedad.</p>
                  <Button asChild variant="link" className="mt-2 text-primary">
                    <Link href="/properties/submit">¡Publica tu primera propiedad!</Link>
                  </Button>
                </div>
              )}
            </CardContent>
             {userProperties.length > 0 && (
               <CardFooter className="p-6 md:p-8 pt-0">
                  <Button variant="outline" className="w-full rounded-md" asChild>
                      <Link href="/properties" className="flex items-center gap-2">Ver todas mis propiedades <ArrowRight className="h-4 w-4"/></Link>
                  </Button>
              </CardFooter>
             )}
          </Card>

          <Card className="rounded-xl shadow-lg border">
            <CardHeader className="p-6 md:p-8">
              <CardTitle className="text-2xl font-headline flex items-center gap-3">
                <SearchCheck className="h-7 w-7 text-primary" /> Mis Solicitudes ({userRequests.length})
              </CardTitle>
              <CardDescription>Revisa tus solicitudes de búsqueda de propiedades.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 pt-0 space-y-6">
              {userRequests.length > 0 ? (
                 <div className="space-y-6">
                  {userRequests.slice(0,2).map(request => (
                    <RequestListItem key={request.id} request={request} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <SearchCheck className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg">No tienes solicitudes de propiedad activas.</p>
                   <Button asChild variant="link" className="mt-2 text-primary">
                    <Link href="/requests/submit">¡Crea tu primera solicitud!</Link>
                  </Button>
                </div>
              )}
            </CardContent>
             {userRequests.length > 0 && (
              <CardFooter className="p-6 md:p-8 pt-0">
                  <Button variant="outline" className="w-full rounded-md" asChild>
                      <Link href="/requests" className="flex items-center gap-2">Ver todas mis solicitudes <ArrowRight className="h-4 w-4"/></Link>
                  </Button>
              </CardFooter>
             )}
          </Card>
        </div>
      )}
    </div>
  );
}

    