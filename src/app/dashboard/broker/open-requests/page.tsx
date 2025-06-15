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
  const [isProposeDialogValid, setIsProposeDialogValid] = useState(false);
  const [isProposeDialogOpen, setIsProposeDialogOpen] = useState(false);

  const fetchOpenRequests = useCallback(async (currentBrokerId: string) => {
    setIsLoading(true);
    try {
      const allOpenRequests = await getRequestsAction({
        onlyOpenForCollaboration: true,
        includeInactive: false,
      });
      const relevantRequests = allOpenRequests.filter(req => req.user_id !== currentBrokerId);
      setOpenRequests(relevantRequests);
    } catch (error) {
      console.error("Error fetching open collaboration requests:", error);
      toast({
        title: 'Error al Cargar Solicitudes',
        description: 'No se pudieron obtener las solicitudes abiertas a colaboración.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchUserProperties = useCallback(async (userId: string) => {
    setIsLoadingUserProperties(true);
    try {
      const properties = await getUserPropertiesAction(userId);
      setUserProperties(properties.filter(p => p.isActive)); // Only active properties can be proposed
    } catch (error) {
      console.error("Error fetching user properties:", error);
      toast({
        title: 'Error al Cargar Propiedades',
        description: 'No se pudieron obtener tus propiedades para proponer.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingUserProperties(false);
    }
  }, [toast]);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const user: StoredUserType = JSON.parse(userJson);
        if (user.role_id !== 'broker') {
          toast({ title: "Acceso Denegado", description: "Esta sección es solo para corredores.", variant: "destructive" });
          router.push('/dashboard');
          return;
        }
        setLoggedInUser(user);
        fetchOpenRequests(user.id);
        fetchUserProperties(user.id);
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        toast({ title: "Error de Sesión", description: "Por favor, inicia sesión de nuevo.", variant: "destructive" });
        localStorage.removeItem('loggedInUser');
        router.push('/auth/signin');
      }
    } else {
      toast({ title: "Acceso Requerido", description: "Debes iniciar sesión como corredor.", variant: "destructive" });
      router.push('/auth/signin');
    }
  }, [router, toast, fetchOpenRequests, fetchUserProperties]);
  
  const handleProposePropertyClick = (request: SearchRequest) => {
    if (userProperties.length === 0 && !isLoadingUserProperties) {
        toast({
            title: "No Tienes Propiedades Activas",
            description: "Debes tener al menos una propiedad activa para proponer a esta solicitud. Publica una propiedad primero.",
            variant: "warning",
            action: <Button asChild variant="link"><Link href="/properties/submit">Publicar Propiedad</Link></Button>
        });
        return;
    }
    setSelectedRequestForProposal(request);
    setIsProposeDialogValid(true);
    setIsProposeDialogOpen(true);
  };

  const handleProposalSubmitted = () => {
    setIsProposeDialogOpen(false);
    // Optionally, refresh open requests or give feedback
    if (loggedInUser) fetchOpenRequests(loggedInUser.id); // Refresh list
  };

  useEffect(() => {
    if (!isProposeDialogOpen) {
        const timer = setTimeout(() => {
            setSelectedRequestForProposal(null);
            setIsProposeDialogValid(false);
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [isProposeDialogOpen]);


  if (isLoading && openRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Buscando oportunidades de colaboración...</p>
      </div>
    );
  }

  if (!loggedInUser) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <UserCircle className="h-8 w-8 mr-3 text-primary" />
            Acceso Requerido
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">
          <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-xl font-semibold mb-2">Debes iniciar sesión como corredor para acceder.</p>
          <Button asChild className="mt-4">
            <Link href="/auth/signin">Iniciar Sesión</Link>
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
            Oportunidades de Colaboración (Canje)
          </CardTitle>
          <CardDescription>
            Encuentra solicitudes de clientes publicadas por otros corredores que estén abiertas a colaboración.
            Propón una de tus propiedades para iniciar un canje.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && openRequests.length > 0 && (
            <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
          )}
          {!isLoading && openRequests.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <PackageOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No hay solicitudes abiertas a colaboración por otros corredores.</p>
              <p className="text-sm text-muted-foreground mt-1">
                ¡Revisa más tarde o publica tus propias solicitudes para canje!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {openRequests.map((request) => (
                <div key={request.id} className="relative group/item">
                  <RequestListItem request={request} />
                  <Button
                    variant="default"
                    size="sm"
                    className="absolute bottom-4 right-4 opacity-80 hover:opacity-100 md:opacity-0 group-hover/item:opacity-100 transition-opacity z-10 shadow-md"
                    onClick={() => handleProposePropertyClick(request)}
                    disabled={isLoadingUserProperties}
                  >
                    {isLoadingUserProperties ? <Loader2 className="h-4 w-4 animate-spin mr-1.5"/> : <Building className="h-4 w-4 mr-1.5"/>}
                    Proponer Propiedad
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {isProposeDialogValid && selectedRequestForProposal && loggedInUser && (
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
```