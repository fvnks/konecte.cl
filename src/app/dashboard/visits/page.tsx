// src/app/dashboard/visits/page.tsx
'use client';

import React, { useEffect, useState, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import type { PropertyVisit, User } from '@/lib/types';
import { getVisitsForUserAction } from '@/actions/visitActions';
import { Loader2, CalendarClock, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VisitsCalendar from '@/components/admin/visits/VisitsCalendar';
import { getStatusVariantForUser } from '@/lib/utils';
import { PropertyVisitStatusLabels } from '@/lib/types';

export default function UserVisitsPage() {
  const { toast } = useToast();
  const [visits, setVisits] = useState<PropertyVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const parsedUser = JSON.parse(userJson);
        setLoggedInUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    } else {
        setIsLoading(false);
    }
  }, []);

  const fetchUserVisits = useCallback(async () => {
    if (!loggedInUser) return;
    setIsLoading(true);
    try {
      const fetchedVisits = await getVisitsForUserAction(loggedInUser.id);
      setVisits(fetchedVisits);
    } catch (error) {
      console.error("Error fetching user visits:", error);
      toast({ title: "Error", description: "No se pudieron cargar tus visitas.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [loggedInUser, toast]);

  useEffect(() => {
    if (loggedInUser) {
        fetchUserVisits();
    }
  }, [loggedInUser, fetchUserVisits]);

  if (isLoading && !loggedInUser) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!loggedInUser) {
    return <p>Debes iniciar sesión para ver tus visitas.</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-2xl font-headline flex items-center">
              <CalendarClock className="h-7 w-7 mr-3 text-primary" /> Mis Visitas
            </CardTitle>
            <CardDescription>Aquí puedes ver todas tus visitas, tanto las que solicitaste como las de tus propiedades.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/visits/schedule"><PlusCircle className="mr-2 h-4 w-4" />Agendar Nueva Visita</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list_view">
            <TabsList>
              <TabsTrigger value="list_view">Lista</TabsTrigger>
              <TabsTrigger value="calendar_view">Calendario</TabsTrigger>
            </TabsList>
            <TabsContent value="list_view" className="mt-4">
              {isLoading ? (
                <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
              ) : visits.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Propiedad</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visits.map((visit) => {
                        const statusInfo = getStatusVariantForUser(visit.status);
                        const userRole = visit.visitor_id === loggedInUser.id ? 'Visitante' : 'Propietario';
                        return (
                          <TableRow key={visit.id}>
                            <TableCell className="font-medium">
                              <Link href={`/properties/${visit.property_slug}`} className="hover:underline">{visit.property_title}</Link>
                            </TableCell>
                            <TableCell>
                                <Badge variant={userRole === 'Visitante' ? 'default' : 'secondary'}>{userRole}</Badge>
                            </TableCell>
                            <TableCell>{format(new Date(visit.proposed_datetime), "dd MMM yyyy, HH:mm", { locale: es })}</TableCell>
                            <TableCell>
                                <Badge variant={statusInfo.variant} className={statusInfo.labelClass}>{PropertyVisitStatusLabels[visit.status]}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No tienes ninguna visita programada.</p>
              )}
            </TabsContent>
            <TabsContent value="calendar_view" className="mt-4">
               {isLoading ? (
                <div className="h-[75vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : (
                <VisitsCalendar visits={visits} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
