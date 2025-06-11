
// src/app/dashboard/page.tsx
'use client'; 

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ListTree, SearchCheck, Building, UserCircle, Loader2 } from 'lucide-react';
import PropertyListItem from '@/components/property/PropertyListItem';
import RequestCard from '@/components/request/RequestCard';
import type { PropertyListing, SearchRequest, User as StoredUser } from '@/lib/types';
import { useEffect, useState } from 'react';
import { getUserPropertiesAction } from '@/actions/propertyActions';
import { getUserRequestsAction } from '@/actions/requestActions'; // Importar la nueva acción

export default function DashboardPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [userProperties, setUserProperties] = useState<PropertyListing[]>([]);
  const [userRequests, setUserRequests] = useState<SearchRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const user: StoredUser = JSON.parse(userJson);
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
          getUserRequestsAction(loggedInUser.id) // Usar la acción real
        ]);
        setUserProperties(properties);
        setUserRequests(requests);
        setIsLoading(false);
      } else {
        setIsLoading(false);
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
          <div className="flex items-center gap-3 mb-2">
            <UserCircle className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl font-headline">Panel de {userName}</CardTitle>
              <CardDescription className="text-lg">Bienvenido de nuevo. Aquí puedes gestionar tus publicaciones.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button asChild size="lg" variant="outline">
            <Link href="/properties/submit" className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" /> Publicar Nueva Propiedad
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
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
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

