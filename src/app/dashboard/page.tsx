
// src/app/dashboard/page.tsx
'use client'; 

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, ListTree, SearchCheck, Building, UserCircle, Loader2, CreditCard } from 'lucide-react';
import PropertyListItem from '@/components/property/PropertyListItem';
import RequestCard from '@/components/request/RequestCard'; // RequestCard para una vista más detallada en el dashboard
import type { PropertyListing, SearchRequest, User as StoredUserType } from '@/lib/types';
import { useEffect, useState } from 'react';
import { getUserPropertiesAction } from '@/actions/propertyActions';
import { getUserRequestsAction } from '@/actions/requestActions'; 

// Extender StoredUser para incluir planId y planName, si no están ya en StoredUserType
interface DashboardUser extends StoredUserType {
  planId?: string | null;
  planName?: string | null;
}

export default function DashboardPage() {
  const [loggedInUser, setLoggedInUser] = useState<DashboardUser | null>(null);
  const [userProperties, setUserProperties] = useState<PropertyListing[]>([]);
  const [userRequests, setUserRequests] = useState<SearchRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
        const [properties, requests] = await Promise.all([
          getUserPropertiesAction(loggedInUser.id),
          getUserRequestsAction(loggedInUser.id)
        ]);
        setUserProperties(properties);
        setUserRequests(requests);
        setIsLoading(false);
      } else {
        // Si no hay loggedInUser después del primer chequeo, paramos la carga
        // esto puede pasar si el usuario llega directamente y no hay nada en localStorage aún
        if (localStorage.getItem('loggedInUser') === null) {
            setIsLoading(false);
        }
        setUserProperties([]);
        setUserRequests([]);
      }
    }
    fetchData();
  }, [loggedInUser]);


  if (!loggedInUser && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
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
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <UserCircle className="h-10 w-10 text-primary flex-shrink-0" />
              <div>
                <CardTitle className="text-3xl font-headline">Panel de {userName}</CardTitle>
                <CardDescription className="text-lg">Bienvenido. Aquí puedes gestionar tus publicaciones y tu cuenta.</CardDescription>
              </div>
            </div>
            {loggedInUser && (
                 <div className="text-sm bg-secondary/50 p-3 rounded-md text-right sm:text-left">
                    <p className="font-semibold">Tu Plan Actual:</p>
                    <p className="text-primary flex items-center gap-1">
                        <CreditCard className="h-4 w-4" /> 
                        {loggedInUser.planName || "Gratuito (o sin plan asignado)"}
                    </p>
                    {!loggedInUser.planName && (
                         <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-xs" disabled> {/* TODO: Link to plans page */}
                            Ver Planes
                        </Button>
                    )}
                </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button asChild size="lg" variant="default">
            <Link href="/properties/submit" className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" /> Publicar Nueva Propiedad
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/requests/submit" className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" /> Publicar Nueva Solicitud
            </Link>
          </Button>
        </CardContent>
      </Card>

      {isLoading && loggedInUser && (
        <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Cargando tus datos...</p>
        </div>
      )}

      {!isLoading && loggedInUser && (
        <>
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-headline flex items-center gap-2">
                  <ListTree className="h-6 w-6 text-primary" /> Mis Propiedades Publicadas ({userProperties.length})
                </CardTitle>
                <CardDescription>Gestiona las propiedades que has listado en PropSpot.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {userProperties.length > 0 ? (
                  userProperties.map(property => (
                    <PropertyListItem key={property.id} property={property} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building className="h-12 w-12 mx-auto mb-2" />
                    <p>Aún no has publicado ninguna propiedad.</p>
                    <Button asChild variant="link" className="mt-2">
                      <Link href="/properties/submit">¡Publica tu primera propiedad!</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
               {userProperties.length > 0 && (
                 <CardFooter>
                    <Button variant="outline" className="mx-auto" asChild>
                        <Link href="/properties">Ver todas mis propiedades</Link> {/* TODO: Link to a filtered user properties page */}
                    </Button>
                </CardFooter>
               )}
            </Card>
          </section>

          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-headline flex items-center gap-2">
                  <SearchCheck className="h-6 w-6 text-primary" /> Mis Solicitudes Activas ({userRequests.length})
                </CardTitle>
                <CardDescription>Revisa y gestiona tus solicitudes de búsqueda de propiedades.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {userRequests.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userRequests.map(request => (
                      <RequestCard key={request.id} request={request} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <SearchCheck className="h-12 w-12 mx-auto mb-2" />
                    <p>No tienes solicitudes de propiedad activas.</p>
                     <Button asChild variant="link" className="mt-2">
                      <Link href="/requests/submit">¡Crea tu primera solicitud!</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
               {userRequests.length > 0 && (
                <CardFooter>
                    <Button variant="outline" className="mx-auto" asChild>
                        <Link href="/requests">Ver todas mis solicitudes</Link> {/* TODO: Link to a filtered user requests page */}
                    </Button>
                </CardFooter>
               )}
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
