
// src/app/dashboard/page.tsx
'use client'; 

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, ListTree, SearchCheck, Building, UserCircle, Loader2, CreditCard, Users as UsersIcon, LayoutGrid } from 'lucide-react';
import PropertyListItem from '@/components/property/PropertyListItem';
import RequestListItem from '@/components/request/RequestListItem'; 
import type { PropertyListing, SearchRequest, User as StoredUserType } from '@/lib/types';
import { useEffect, useState } from 'react';
import { getUserPropertiesAction } from '@/actions/propertyActions';
import { getUserRequestsAction } from '@/actions/requestActions'; 

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
    setIsClient(true); // Indicate that component has mounted
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
            // Optionally show a toast error
        } finally {
            setIsLoading(false);
        }
      } else if (isClient && localStorage.getItem('loggedInUser') === null) {
        // Only set loading to false if we are on client and confirmed no user
        setIsLoading(false);
        setUserProperties([]);
        setUserRequests([]);
      }
    }
    if (isClient) { // Only run fetchData if on client
        fetchData();
    }
  }, [loggedInUser, isClient]);


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
  
  const userName = loggedInUser?.name || "Usuario";

  return (
    <div className="space-y-8 md:space-y-10">
      <Card className="shadow-xl rounded-xl border">
        <CardHeader className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
            <div className="flex items-center gap-4">
              <UserCircle className="h-12 w-12 md:h-14 md:w-14 text-primary flex-shrink-0" />
              <div>
                <CardTitle className="text-2xl md:text-3xl font-headline font-bold">Panel de {userName}</CardTitle>
                <CardDescription className="text-md md:text-lg text-muted-foreground">Bienvenido. Aquí puedes gestionar tus publicaciones y tu cuenta.</CardDescription>
              </div>
            </div>
            {loggedInUser && (
                 <div className="text-sm bg-primary/10 p-3.5 rounded-lg text-right sm:text-left border border-primary/20">
                    <p className="font-semibold text-primary-foreground">Tu Plan Actual:</p>
                    <p className="text-primary font-medium flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4" /> 
                        {loggedInUser.planName || "Gratuito (o sin plan asignado)"}
                    </p>
                    {!loggedInUser.planName && (
                         <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-xs text-primary hover:text-primary/80" disabled> {/* TODO: Link to plans page */}
                            Ver Planes
                        </Button>
                    )}
                </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button asChild size="lg" variant="default" className="h-12 text-base rounded-md shadow-md hover:shadow-lg transition-shadow">
            <Link href="/properties/submit" className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" /> Publicar Propiedad
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="h-12 text-base rounded-md shadow-md hover:shadow-lg transition-shadow">
            <Link href="/requests/submit" className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" /> Publicar Solicitud
            </Link>
          </Button>
           <Button asChild size="lg" variant="outline" className="h-12 text-base rounded-md shadow-sm hover:shadow-md transition-shadow">
            <Link href="/dashboard/crm" className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" /> Ir a Mi CRM
            </Link>
          </Button>
        </CardContent>
      </Card>

      {!isLoading && loggedInUser && (
        <>
          <Card className="rounded-xl shadow-lg border">
            <CardHeader className="p-6 md:p-8">
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <ListTree className="h-6 w-6 text-primary" /> Mis Propiedades Listadas ({userProperties.length})
              </CardTitle>
              <CardDescription>Gestiona las propiedades que has listado en PropSpot.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 pt-0 space-y-6">
              {userProperties.length > 0 ? (
                userProperties.slice(0,3).map(property => ( // Mostrar solo las 3 primeras
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
             {userProperties.length > 3 && ( // Si hay más de 3, mostrar botón "Ver todas"
               <CardFooter className="p-6 md:p-8 pt-0">
                  <Button variant="outline" className="mx-auto rounded-md" asChild>
                      <Link href="/properties">Ver todas mis propiedades</Link>
                  </Button>
              </CardFooter>
             )}
          </Card>

          <Card className="rounded-xl shadow-lg border">
            <CardHeader className="p-6 md:p-8">
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <SearchCheck className="h-6 w-6 text-primary" /> Mis Solicitudes de Búsqueda ({userRequests.length})
              </CardTitle>
              <CardDescription>Revisa y gestiona tus solicitudes de búsqueda de propiedades.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 pt-0 space-y-6">
              {userRequests.length > 0 ? (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {userRequests.slice(0,2).map(request => ( // Mostrar solo las 2 primeras
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
             {userRequests.length > 2 && ( // Si hay más de 2, mostrar botón "Ver todas"
              <CardFooter className="p-6 md:p-8 pt-0">
                  <Button variant="outline" className="mx-auto rounded-md" asChild>
                      <Link href="/requests">Ver todas mis solicitudes</Link>
                  </Button>
              </CardFooter>
             )}
          </Card>
        </>
      )}
    </div>
  );
}

