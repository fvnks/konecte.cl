
// src/app/dashboard/my-listings/page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, PlusCircle, ListTree, Building, FileSearch, AlertTriangle, Edit3, ToggleLeft, ToggleRight } from 'lucide-react';
import PropertyListItem from '@/components/property/PropertyListItem';
import RequestListItem from '@/components/request/RequestListItem';
import type { PropertyListing, SearchRequest, User as StoredUserType } from '@/lib/types';
import { useEffect, useState, useTransition, useCallback } from 'react';
import { getUserPropertiesAction, updatePropertyStatusAction } from '@/actions/propertyActions';
import { getUserRequestsAction, updateRequestStatusAction } from '@/actions/requestActions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch'; 

export default function MyListingsPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUserType | null>(null);
  const [userProperties, setUserProperties] = useState<PropertyListing[]>([]);
  const [userRequests, setUserRequests] = useState<SearchRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingStatus, startToggleTransition] = useTransition();
  const { toast } = useToast();

  const fetchUserListings = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const [properties, requests] = await Promise.all([
        getUserPropertiesAction(userId),
        getUserRequestsAction(userId),
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
  }, [toast]);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const user: StoredUserType = JSON.parse(userJson);
        setLoggedInUser(user);
        fetchUserListings(user.id);
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [fetchUserListings]);

  const handleTogglePropertyStatus = async (propertyId: string, currentStatus: boolean) => {
    startToggleTransition(async () => {
      const result = await updatePropertyStatusAction(propertyId, !currentStatus);
      if (result.success) {
        toast({ title: "Estado Actualizado", description: result.message });
        setUserProperties(prev => 
          prev.map(p => p.id === propertyId ? { ...p, isActive: !currentStatus } : p)
        );
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleToggleRequestStatus = async (requestId: string, currentStatus: boolean) => {
    startToggleTransition(async () => {
      const result = await updateRequestStatusAction(requestId, !currentStatus);
      if (result.success) {
        toast({ title: "Estado Actualizado", description: result.message });
        setUserRequests(prev => 
          prev.map(r => r.id === requestId ? { ...r, isActive: !currentStatus } : r)
        );
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

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
                    <div key={property.id} className="p-3 border rounded-lg bg-card shadow-sm">
                      <PropertyListItem property={property} />
                      <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                           <Switch
                              id={`prop-status-${property.id}`}
                              checked={property.isActive}
                              onCheckedChange={() => handleTogglePropertyStatus(property.id, property.isActive)}
                              disabled={isTogglingStatus}
                              aria-label={property.isActive ? "Desactivar propiedad" : "Activar propiedad"}
                            />
                           <Badge variant={property.isActive ? "default" : "outline"} className="text-xs">
                                {property.isActive ? <ToggleRight className="mr-1 h-3 w-3"/> : <ToggleLeft className="mr-1 h-3 w-3"/>}
                                {property.isActive ? 'Activa' : 'Inactiva'}
                           </Badge>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/my-listings/property/${property.id}/edit`}> 
                            <Edit3 className="mr-1.5 h-3.5 w-3.5"/> Editar
                          </Link>
                        </Button>
                      </div>
                    </div>
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
                     <div key={request.id} className="p-3 border rounded-lg bg-card shadow-sm">
                      <RequestListItem request={request} />
                      <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                           <Switch
                              id={`req-status-${request.id}`}
                              checked={request.isActive}
                              onCheckedChange={() => handleToggleRequestStatus(request.id, request.isActive)}
                              disabled={isTogglingStatus}
                              aria-label={request.isActive ? "Desactivar solicitud" : "Activar solicitud"}
                            />
                           <Badge variant={request.isActive ? "default" : "outline"} className="text-xs">
                                {request.isActive ? <ToggleRight className="mr-1 h-3 w-3"/> : <ToggleLeft className="mr-1 h-3 w-3"/>}
                                {request.isActive ? 'Activa' : 'Inactiva'}
                           </Badge>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/requests/${request.id}/edit`}> {/* TODO: Usar /dashboard/my-listings/request/${request.id}/edit cuando esté */}
                            <Edit3 className="mr-1.5 h-3.5 w-3.5"/> Editar
                          </Link>
                        </Button>
                      </div>
                    </div>
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

