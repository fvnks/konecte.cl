// src/app/dashboard/my-listings/page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, PlusCircle, ListTree, Building, FileSearch, AlertTriangle } from 'lucide-react';
import PropertyListItem from '@/components/property/PropertyListItem';
import RequestListItem from '@/components/request/RequestListItem';
import type { PropertyListing, SearchRequest, User as StoredUserType } from '@/lib/types';
import { useEffect, useState, useTransition } from 'react';
import { getUserPropertiesAction } from '@/actions/propertyActions';
import { getUserRequestsAction } from '@/actions/requestActions';
import { useToast } from '@/hooks/use-toast';

export default function MyListingsPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUserType | null>(null);
  const [userProperties, setUserProperties] = useState<PropertyListing[]>([]);
  const [userRequests, setUserRequests] = useState<SearchRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setLoggedInUser(JSON.parse(userJson));
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
      }
    } else {
        setIsLoading(false); // No user, stop loading
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (loggedInUser?.id) {
        setIsLoading(true);
        try {
          const [properties, requests] = await Promise.all([
            getUserPropertiesAction(loggedInUser.id),
            getUserRequestsAction(loggedInUser.id),
          ]);
          setUserProperties(properties);
          setUserRequests(requests);
        } catch (error) {
          console.error("Error fetching user listings:", error);
          toast({
            title: 'Error al Cargar Publicaciones',
            description: 'No se pudieron obtener tus propiedades y solicitudes.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }
    }
    if (loggedInUser) {
        fetchData();
    }
  }, [loggedInUser, toast]);

  if (!loggedInUser && !isLoading) {
    return (
        <Card className="shadow-lg">
            <CardHeader className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                <CardTitle className="text-2xl">Acceso Denegado</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <p className="mb-4">Debes iniciar sesión para ver tus publicaciones.</p>
                <Button asChild>
                    <Link href="/auth/signin">Iniciar Sesión</Link>
                </Button>
            </CardContent>
        </Card>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando tus publicaciones...</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <Card className="shadow-xl rounded-xl border">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-2xl font-headline flex items-center">
              <ListTree className="h-7 w-7 mr-3 text-primary" />
              Mis Publicaciones
            </CardTitle>
            <CardDescription>
              Gestiona las propiedades y solicitudes que has creado en la plataforma.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center">
             <Button asChild variant="default" size="sm">
                 <Link href="/properties/submit"><PlusCircle className="mr-2 h-4 w-4"/>Nueva Propiedad</Link>
             </Button>
             <Button asChild variant="outline" size="sm">
                 <Link href="/requests/submit"><PlusCircle className="mr-2 h-4 w-4"/>Nueva Solicitud</Link>
             </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="properties" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-auto">
              <TabsTrigger value="properties" className="py-2.5 text-sm"><Building className="mr-2 h-4 w-4"/>Propiedades ({userProperties.length})</TabsTrigger>
              <TabsTrigger value="requests" className="py-2.5 text-sm"><FileSearch className="mr-2 h-4 w-4"/>Solicitudes ({userRequests.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="properties">
              {userProperties.length > 0 ? (
                <div className="space-y-4">
                  {userProperties.map(property => (
                    <PropertyListItem key={property.id} property={property} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <Building className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-lg font-medium text-muted-foreground">No has publicado ninguna propiedad.</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href="/properties/submit">Publicar mi primera propiedad</Link>
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="requests">
              {userRequests.length > 0 ? (
                <div className="space-y-4">
                  {userRequests.map(request => (
                    <RequestListItem key={request.id} request={request} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <FileSearch className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-lg font-medium text-muted-foreground">No has creado ninguna solicitud.</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href="/requests/submit">Crear mi primera solicitud</Link>
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
