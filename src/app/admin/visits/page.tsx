
// src/app/admin/visits/page.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import type { PropertyVisit, PropertyVisitStatus } from '@/lib/types';
import { PropertyVisitStatusLabels } from '@/lib/types';
import { getAllVisitsForAdminAction } from '@/actions/visitActions';
import { Loader2, CalendarClock, AlertTriangle, Eye, User, HomeIcon as PropertyIcon, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const getStatusVariantForAdmin = (status: PropertyVisitStatus): { variant: "default" | "secondary" | "destructive" | "outline"; labelClass?: string } => {
  switch (status) {
    case 'pending_confirmation': return { variant: 'outline', labelClass: 'text-amber-600 border-amber-500' };
    case 'confirmed': return { variant: 'default', labelClass: 'bg-green-500 text-white border-green-600' };
    case 'cancelled_by_visitor':
    case 'cancelled_by_owner':
      return { variant: 'destructive', labelClass: 'bg-red-500 text-white border-red-600' };
    case 'rescheduled_by_owner': return { variant: 'outline', labelClass: 'text-blue-600 border-blue-500' };
    case 'completed': return { variant: 'default', labelClass: 'bg-indigo-500 text-white border-indigo-600' };
    case 'visitor_no_show':
    case 'owner_no_show':
      return { variant: 'secondary', labelClass: 'text-slate-600 border-slate-500' };
    default: return { variant: 'secondary', labelClass: 'text-gray-600 border-gray-500' };
  }
};


export default function AdminVisitsPage() {
  const { toast } = useToast();
  const [visits, setVisits] = useState<PropertyVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, startRefreshingTransition] = useTransition();

  const fetchAllVisits = async () => {
    if(isRefreshing) return;
    setIsLoading(true);
    try {
      const fetchedVisits = await getAllVisitsForAdminAction();
      setVisits(fetchedVisits);
    } catch (error) {
      console.error("Error fetching all visits for admin:", error);
      toast({ title: "Error", description: "No se pudieron cargar todas las visitas.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllVisits();
  }, []);

  const handleRefresh = () => {
    startRefreshingTransition(() => {
        fetchAllVisits();
    });
  };
  
  if (isLoading && visits.length === 0) { 
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando todas las visitas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg rounded-xl border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
                <CardTitle className="text-2xl font-headline flex items-center">
                    <CalendarClock className="h-7 w-7 mr-3 text-primary" /> Gestión de Todas las Visitas
                </CardTitle>
                <CardDescription>Supervisa todas las solicitudes y programaciones de visitas en la plataforma.</CardDescription>
            </div>
             <Button onClick={handleRefresh} variant="outline" size="icon" disabled={isRefreshing || isLoading} aria-label="Refrescar visitas">
                <RefreshCw className={`h-4 w-4 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
            </Button>
        </CardHeader>
        <CardContent>
          {isLoading && visits.length > 0 && <p className="text-sm text-muted-foreground mb-2">Actualizando lista de visitas...</p>}
          {visits.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Propiedad</TableHead>
                    <TableHead className="min-w-[150px]">Visitante</TableHead>
                    <TableHead className="min-w-[150px]">Propietario</TableHead>
                    <TableHead className="min-w-[150px]">Fecha Propuesta</TableHead>
                    <TableHead className="min-w-[150px]">Fecha Confirmada</TableHead>
                    <TableHead className="min-w-[150px]">Estado</TableHead>
                    <TableHead className="min-w-[180px]">Notas Visitante</TableHead>
                    <TableHead className="min-w-[180px]">Notas Propietario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((visit) => {
                    const statusInfo = getStatusVariantForAdmin(visit.status);
                    return (
                        <TableRow key={visit.id}>
                        <TableCell className="font-medium text-xs">
                            <Link href={`/properties/${visit.property_slug}`} target="_blank" className="hover:underline text-primary flex items-center gap-1">
                                <PropertyIcon className="h-3.5 w-3.5"/> {visit.property_title}
                            </Link>
                        </TableCell>
                        <TableCell className="text-xs">{visit.visitor_name || 'N/A'}</TableCell>
                        <TableCell className="text-xs">{visit.owner_name || 'N/A'}</TableCell>
                        <TableCell className="text-xs">
                            {format(new Date(visit.proposed_datetime), "dd MMM yyyy, HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell className="text-xs">
                            {visit.confirmed_datetime ? format(new Date(visit.confirmed_datetime), "dd MMM yyyy, HH:mm", { locale: es }) : '-'}
                        </TableCell>
                        <TableCell>
                            <Badge variant={statusInfo.variant} className={`capitalize text-[10px] px-1.5 py-0.5 ${statusInfo.labelClass}`}>
                            {PropertyVisitStatusLabels[visit.status]}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={visit.visitor_notes || undefined}>
                            {visit.visitor_notes || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={visit.owner_notes || undefined}>
                            {visit.owner_notes || '-'}
                        </TableCell>
                        </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            !isLoading && (
                <div className="text-center py-10 text-muted-foreground bg-muted/30 rounded-lg">
                    <AlertTriangle className="mx-auto h-12 w-12 mb-3 text-gray-400" />
                    <p className="text-lg font-medium">No hay visitas registradas en el sistema.</p>
                    <p className="text-sm mt-1">Cuando los usuarios soliciten o gestionen visitas, aparecerán aquí.</p>
                </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
