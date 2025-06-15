// src/app/dashboard/broker/open-requests/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Handshake, AlertTriangle, PackageOpen, UserCircle, Building } from 'lucide-react';
import type { SearchRequest, User as StoredUserType, PropertyListing } from '@/lib/types';
import { getRequestsAction } from '@/actions/requestActions';
import { getUserPropertiesAction } from '@/actions/propertyActions'; // To fetch broker's own properties
import { useToast } from '@/hooks/use-toast';
import RequestListItem from '@/components/request/RequestListItem';
import ProposePropertyDialog from '@/components/broker/ProposePropertyDialog'; // New Dialog

export default function OpenCollaborationRequestsPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUserType | null>(null);
  const [openRequests, setOpenRequests] = useState<SearchRequest[]>([]);
  const [userProperties, setUserProperties] = useState<PropertyListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUserProperties, setIsLoadingUserProperties] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [selectedRequestForProposal, setSelectedRequestForProposal] = useState<SearchRequest | null>(null);
  const [isProposeDialogOpen, setIsProposeDialogOpen] = useState(false); // Línea corregida

  const fetchBrokerData = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const [requests, properties] = await Promise.all([
        getRequestsAction({ onlyOpenForCollaboration: true }),
        getUserPropertiesAction(userId),
      ]);
      // Filter out requests made by the logged-in user themselves
      setOpenRequests(requests.filter(req => req.user_id !== userId));
      setUserProperties(properties.filter(prop => prop.isActive)); // Only active properties
    } catch (error) {
      console.error("Error fetching broker data:", error);
      toast({
        title: 'Error al Cargar Datos',
        description: 'No se pudieron obtener las solicitudes abiertas o tus propiedades.',
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
        if (user.role_id === 'broker') {
          setLoggedInUser(user);
          fetchBrokerData(user.id);
        } else {
          toast({ title: 'Acceso Denegado', description: 'Solo corredores pueden acceder a esta sección.', variant: 'destructive' });
          router.push('/dashboard');
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
        router.push('/auth/signin');
        setIsLoading(false);
      }
    } else {
      toast({ title: 'Acceso Requerido', description: 'Debes iniciar sesión como corredor.', variant: 'destructive' });
      router.push('/auth/signin');
      setIsLoading(false);
    }
  }, [router, toast, fetchBrokerData]);

  const handleProposeProperty = async (request: SearchRequest) => {
    if (!loggedInUser?.id) return;

    setIsLoadingUserProperties(true);
    try {
      // Fetch latest user properties in case they changed
      const properties = await getUserPropertiesAction(loggedInUser.id);
      const activeUserProps = properties.filter(prop => prop.isActive);
      setUserProperties(activeUserProps);

      if (activeUserProps.length === 0) {
        toast({
          title: 'No Tienes Propiedades Activas',
          description: 'Debes tener al menos una propiedad activa para proponer.',
          variant: 'info',
          action: <Button variant="link" size="sm" asChild><Link href="/properties/submit">Publicar Propiedad</Link></Button>
        });
        setIsLoadingUserProperties(false);
        return;
      }
      setSelectedRequestForProposal(request);
      setIsProposeDialogOpen(true); // Open the dialog
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar tus propiedades.", variant: "destructive" });
    } finally {
      setIsLoadingUserProperties(false);
    }
  };

  const handleProposalSubmitted = () => {
    // Optionally refresh the list of open requests or show a success message
    // For now, just close the dialog
    setIsProposeDialogOpen(false);
    setSelectedRequestForProposal(null);
    if (loggedInUser?.id) {
      fetchBrokerData(loggedInUser.id); // Re-fetch to update any UI elements if necessary
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando solicitudes abiertas...</p>
      </div>
    );
  }

  if (!loggedInUser || loggedInUser.role_id !== 'broker') {
    // This case should be handled by the useEffect redirect, but as a fallback
    return (
        <Card className="shadow-lg">
            <CardHeader className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                <CardTitle className="text-2xl">Acceso Denegado</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <p className="mb-4">Esta sección es exclusiva para corredores de propiedades.</p>
                <Button asChild>
                    <Link href="/dashboard">Volver al Panel</Link>
                </Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl rounded-xl border">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <Handshake className="h-7 w-7 mr-3 text-primary" />
            Solicitudes Abiertas a Colaboración
          </CardTitle>
          <CardDescription>
            Explora las solicitudes de otros corredores y propón tus propiedades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {openRequests.length > 0 ? (
            <div className="space-y-4">
              {openRequests.map((request) => (
                <Card key={request.id} className="bg-card border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="p-4 pb-2">
                     <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 hover:text-primary">
                                <Link href={`/requests/${request.slug}`} target="_blank">{request.title}</Link>
                            </CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                Solicitud de: {request.author?.name || 'Corredor'}
                            </CardDescription>
                        </div>
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleProposeProperty(request)} 
                            disabled={isLoadingUserProperties || (loggedInUser?.id === request.user_id)} // Disable if it's user's own request
                            className="whitespace-nowrap"
                        >
                            {isLoadingUserProperties && selectedRequestForProposal?.id === request.id ? <Loader2 className="h-4 w-4 animate-spin mr-1.5"/> : <Building className="h-4 w-4 mr-1.5"/>}
                            Proponer Propiedad
                        </Button>
                     </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{request.description}</p>
                    <div className="text-xs text-muted-foreground">
                        <span>Ciudad: {request.desiredLocation?.city}</span>
                        {request.desiredLocation?.neighborhood && <span>, Sector: {request.desiredLocation.neighborhood}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-lg font-medium text-muted-foreground">No hay solicitudes abiertas a colaboración en este momento.</p>
              <p className="text-sm text-muted-foreground mt-1">
                ¡Revisa más tarde o <Link href="/requests/submit" className="text-primary hover:underline">publica tu propia solicitud</Link>!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedRequestForProposal && loggedInUser && (
        <ProposePropertyDialog
          open={isProposeDialogOpen}
          onOpenChange={setIsProposeDialogOpen}
          targetRequest={selectedRequestForProposal}
          offeringBroker={loggedInUser}
          userProperties={userProperties}
          isLoadingUserProperties={isLoadingUserProperties}
          onProposalSubmitted={handleProposalSubmitted}
        />
      )}
    </div>
  );
}
