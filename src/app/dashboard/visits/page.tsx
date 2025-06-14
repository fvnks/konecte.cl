// src/app/dashboard/visits/page.tsx
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CalendarCheck, UserCircle, CalendarClock, PackageOpen, RefreshCw } from 'lucide-react';
import type { PropertyVisit, User as StoredUserType, PropertyVisitAction } from '@/lib/types';
import { getVisitsForUserAction } from '@/actions/visitActions';
import { useToast } from '@/hooks/use-toast';
import VisitListItem from '@/components/dashboard/visits/VisitListItem';
import ManageVisitDialog from '@/components/dashboard/visits/ManageVisitDialog';

export default function UserVisitsPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUserType | null>(null);
  const [requestedVisits, setRequestedVisits] = useState<PropertyVisit[]>([]);
  const [propertyVisits, setPropertyVisits] = useState<PropertyVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, startRefreshingTransition] = useTransition();
  const { toast } = useToast();

  const [managingVisit, setManagingVisit] = useState<PropertyVisit | null>(null);
  const [manageActionType, setManageActionType] = useState<PropertyVisitAction | null>(null);
  const [isManageDialogValid, setIsManageDialogValid] = useState(false); // Track if dialog can be opened
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);


  const fetchVisits = async (userId: string) => {
    if (isRefreshing) return;
    setIsLoading(true);
    try {
      const [reqVisits, propVisits] = await Promise.all([
        getVisitsForUserAction(userId, 'visitor'),
        getVisitsForUserAction(userId, 'owner'),
      ]);
      setRequestedVisits(reqVisits);
      setPropertyVisits(propVisits);
    } catch (error) {
      console.error("Error fetching visits:", error);
      toast({
        title: 'Error al Cargar Visitas',
        description: 'No se pudieron obtener tus visitas. Intenta de nuevo más tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const user: StoredUserType = JSON.parse(userJson);
        setLoggedInUser(user);
        fetchVisits(user.id);
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefreshVisits = () => {
    if (loggedInUser?.id) {
      startRefreshingTransition(() => {
        fetchVisits(loggedInUser.id);
      });
    }
  };

  const handleManageVisit = (visit: PropertyVisit, action: PropertyVisitAction) => {
    setManagingVisit(visit);
    setManageActionType(action);
    setIsManageDialogValid(true); // Mark as valid to open
    setIsManageDialogOpen(true); // Open dialog
  };

  const handleVisitUpdated = () => {
    setIsManageDialogOpen(false);
    setManagingVisit(null);
    setManageActionType(null);
    setIsManageDialogValid(false);
    if (loggedInUser?.id) {
      fetchVisits(loggedInUser.id); // Refresh lists
    }
  };
  
  useEffect(() => {
    if (!isManageDialogOpen) {
        // Delay resetting a bit to allow dialog close animation
        const timer = setTimeout(() => {
            setManagingVisit(null);
            setManageActionType(null);
            setIsManageDialogValid(false);
        }, 300); 
        return () => clearTimeout(timer);
    }
  }, [isManageDialogOpen]);


  if (isLoading && requestedVisits.length === 0 && propertyVisits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando tus visitas...</p>
      </div>
    );
  }

  if (!loggedInUser && !isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <UserCircle className="h-8 w-8 mr-3 text-primary" />
            Acceso Requerido
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">
          <p className="text-xl font-semibold mb-2">Debes iniciar sesión para ver tus visitas.</p>
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-headline flex items-center">
              <CalendarClock className="h-7 w-7 mr-3 text-primary" />
              Gestión de Visitas
            </CardTitle>
            <CardDescription>Revisa y administra tus solicitudes de visita y las visitas a tus propiedades.</CardDescription>
          </div>
          <Button onClick={handleRefreshVisits} variant="outline" size="icon" disabled={isRefreshing || isLoading} aria-label="Refrescar visitas">
            <RefreshCw className={`h-4 w-4 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="requested" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 h-auto">
              <TabsTrigger value="requested" className="py-2.5 text-sm">Mis Solicitudes de Visita ({requestedVisits.length})</TabsTrigger>
              <TabsTrigger value="property" className="py-2.5 text-sm">Visitas a Mis Propiedades ({propertyVisits.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="requested">
              {isLoading && requestedVisits.length === 0 ? (
                <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
              ) : requestedVisits.length > 0 ? (
                <div className="space-y-3">
                  {requestedVisits.map(visit => (
                    <VisitListItem key={visit.id} visit={visit} currentUserId={loggedInUser!.id} onManageVisit={handleManageVisit}/>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-lg font-medium text-muted-foreground">No has solicitado ninguna visita.</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href="/properties">Explorar propiedades</Link>
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="property">
               {isLoading && propertyVisits.length === 0 ? (
                <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
              ) : propertyVisits.length > 0 ? (
                <div className="space-y-3">
                  {propertyVisits.map(visit => (
                    <VisitListItem key={visit.id} visit={visit} currentUserId={loggedInUser!.id} onManageVisit={handleManageVisit}/>
                  ))}
                </div>
              ) : (
                 <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-lg font-medium text-muted-foreground">Nadie ha solicitado visitar tus propiedades aún.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {isManageDialogValid && managingVisit && manageActionType && loggedInUser && (
        <ManageVisitDialog
          key={managingVisit.id + manageActionType} // Ensure re-render with new props
          open={isManageDialogOpen}
          onOpenChange={setIsManageDialogOpen}
          visit={managingVisit}
          actionType={manageActionType}
          currentUserId={loggedInUser.id}
          onVisitUpdated={handleVisitUpdated}
        />
      )}
    </div>
  );
}
