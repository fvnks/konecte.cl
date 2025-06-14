
// src/app/admin/visits/page.tsx
'use client';

import React, { useEffect, useState, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { PropertyVisit, PropertyVisitStatus } from '@/lib/types';
import { PropertyVisitStatusLabels, propertyVisitStatusValues } from '@/lib/types';
import { getAllVisitsForAdminAction, type AdminVisitsOrderBy, getVisitCountsByStatusForAdmin } from '@/actions/visitActions';
import { Loader2, CalendarClock, AlertTriangle, Eye, User, HomeIcon as PropertyIcon, RefreshCw, Filter as FilterIcon, ListFilter, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const getStatusVariantForAdmin = (status: PropertyVisitStatus): { variant: "default" | "secondary" | "destructive" | "outline"; labelClass?: string } => {
  switch (status) {
    case 'pending_confirmation': return { variant: 'outline', labelClass: 'text-amber-600 border-amber-500 dark:border-amber-600 dark:text-amber-400' };
    case 'confirmed': return { variant: 'default', labelClass: 'bg-green-500 hover:bg-green-600 text-white border-green-600' };
    case 'cancelled_by_visitor':
    case 'cancelled_by_owner':
      return { variant: 'destructive', labelClass: 'bg-red-500 hover:bg-red-600 text-white border-red-600' };
    case 'rescheduled_by_owner': return { variant: 'outline', labelClass: 'text-blue-600 border-blue-500 dark:border-blue-600 dark:text-blue-400' };
    case 'completed': return { variant: 'default', labelClass: 'bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-600' };
    case 'visitor_no_show':
    case 'owner_no_show':
      return { variant: 'secondary', labelClass: 'text-slate-600 border-slate-500 dark:border-slate-600 dark:text-slate-400' };
    default: return { variant: 'secondary', labelClass: 'text-gray-600 border-gray-500 dark:border-gray-600 dark:text-gray-400' };
  }
};

const orderByOptions: { value: AdminVisitsOrderBy; label: string }[] = [
  { value: 'created_at_desc', label: 'Más Recientes (Creación)' },
  { value: 'created_at_asc', label: 'Más Antiguos (Creación)' },
  { value: 'proposed_datetime_desc', label: 'Fecha Propuesta (Desc)' },
  { value: 'proposed_datetime_asc', label: 'Fecha Propuesta (Asc)' },
  { value: 'status_asc', label: 'Estado (A-Z)' },
  { value: 'status_desc', label: 'Estado (Z-A)' },
];


export default function AdminVisitsPage() {
  const { toast } = useToast();
  const [visits, setVisits] = useState<PropertyVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, startRefreshingTransition] = useTransition();

  const [filterStatus, setFilterStatus] = useState<PropertyVisitStatus | 'all'>('all');
  const [orderBy, setOrderBy] = useState<AdminVisitsOrderBy>('created_at_desc');
  const [statusCounts, setStatusCounts] = useState<Record<PropertyVisitStatus, number> | null>(null);


  const fetchAllVisits = useCallback(async () => {
    if (isRefreshing) return;
    setIsLoading(true);
    try {
      const options = {
        filterStatus: filterStatus === 'all' ? undefined : filterStatus,
        orderBy: orderBy,
      };
      const [fetchedVisits, fetchedCounts] = await Promise.all([
        getAllVisitsForAdminAction(options),
        getVisitCountsByStatusForAdmin()
      ]);
      setVisits(fetchedVisits);
      setStatusCounts(fetchedCounts);
    } catch (error) {
      console.error("Error fetching all visits for admin:", error);
      toast({ title: "Error", description: "No se pudieron cargar todas las visitas.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, orderBy, isRefreshing, toast]);

  useEffect(() => {
    fetchAllVisits();
  }, [fetchAllVisits]); 

  const handleFilterChange = () => {
    startRefreshingTransition(() => {
        fetchAllVisits();
    });
  };
  
  const StatCard = ({ title, value, icon, colorClass,isLoading }: {title: string; value: number; icon: React.ReactNode, colorClass?: string, isLoading: boolean}) => (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        {React.cloneElement(icon as React.ReactElement, { className: `h-4 w-4 ${colorClass || 'text-muted-foreground'}` })}
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-7 w-12"/> : <div className="text-2xl font-bold">{value}</div>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-lg rounded-xl border">
        <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <CardTitle className="text-2xl font-headline flex items-center">
                        <CalendarClock className="h-7 w-7 mr-3 text-primary" /> Gestión de Todas las Visitas
                    </CardTitle>
                    <CardDescription>Supervisa todas las solicitudes y programaciones de visitas en la plataforma.</CardDescription>
                </div>
                 <Button onClick={handleFilterChange} variant="outline" size="sm" disabled={isRefreshing || isLoading} aria-label="Refrescar visitas">
                    <RefreshCw className={`h-4 w-4 ${isRefreshing || isLoading ? 'animate-spin_medium' : ''} mr-2`} /> Refrescar
                </Button>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Summary Cards */}
          {statusCounts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 mb-4">
                <StatCard title="Pendientes" value={statusCounts.pending_confirmation} icon={<History />} colorClass="text-amber-500" isLoading={isLoading}/>
                <StatCard title="Confirmadas" value={statusCounts.confirmed} icon={<CheckCircle2 />} colorClass="text-green-500" isLoading={isLoading}/>
                <StatCard title="Completadas" value={statusCounts.completed} icon={<CheckSquare />} colorClass="text-indigo-500" isLoading={isLoading}/>
                <StatCard title="Canceladas" value={statusCounts.cancelled_by_owner + statusCounts.cancelled_by_visitor} icon={<XCircle />} colorClass="text-red-500" isLoading={isLoading}/>
                <StatCard title="Reagendadas" value={statusCounts.rescheduled_by_owner} icon={<CalendarDays />} colorClass="text-blue-500" isLoading={isLoading}/>
            </div>
          ) : (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 mb-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-[88px] w-full rounded-md"/>)}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 p-3 border rounded-md bg-secondary/30">
            <div className="flex-1">
              <Label htmlFor="filter-status" className="text-xs text-muted-foreground">Filtrar por Estado</Label>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as PropertyVisitStatus | 'all')}>
                <SelectTrigger id="filter-status" className="h-9 text-sm">
                  <FilterIcon className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  {propertyVisitStatusValues.map(statusVal => (
                    <SelectItem key={statusVal} value={statusVal} className="capitalize text-sm">
                      {PropertyVisitStatusLabels[statusVal]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="order-by" className="text-xs text-muted-foreground">Ordenar Por</Label>
              <Select value={orderBy} onValueChange={(value) => setOrderBy(value as AdminVisitsOrderBy)}>
                <SelectTrigger id="order-by" className="h-9 text-sm">
                  <ListFilter className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  {orderByOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="text-sm">{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <Button onClick={handleFilterChange} className="self-end h-9 mt-3 sm:mt-0" disabled={isRefreshing || isLoading}>
                {isRefreshing || isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin_medium" /> : <FilterIcon className="mr-2 h-4 w-4" />}
                Aplicar
            </Button>
          </div>
          
          {isLoading && visits.length === 0 ? (
             <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /><p className="mt-2">Cargando visitas...</p></div>
          ) : visits.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Propiedad</TableHead>
                    <TableHead className="min-w-[120px]">Visitante</TableHead>
                    <TableHead className="min-w-[120px]">Propietario</TableHead>
                    <TableHead className="min-w-[140px]">Fecha Propuesta</TableHead>
                    <TableHead className="min-w-[140px]">Fecha Confirmada</TableHead>
                    <TableHead className="min-w-[140px]">Estado</TableHead>
                    <TableHead className="min-w-[150px]">Notas Visitante</TableHead>
                    <TableHead className="min-w-[150px]">Notas Propietario</TableHead>
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
                            {format(new Date(visit.proposed_datetime), "dd MMM yy, HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell className="text-xs">
                            {visit.confirmed_datetime ? format(new Date(visit.confirmed_datetime), "dd MMM yy, HH:mm", { locale: es }) : '-'}
                        </TableCell>
                        <TableCell>
                            <Badge variant={statusInfo.variant} className={`capitalize text-[10px] px-1.5 py-0.5 ${statusInfo.labelClass}`}>
                            {PropertyVisitStatusLabels[visit.status]}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate" title={visit.visitor_notes || undefined}>
                            {visit.visitor_notes || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate" title={visit.owner_notes || undefined}>
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
                    <p className="text-lg font-medium">No hay visitas que coincidan con los filtros seleccionados.</p>
                    <p className="text-sm mt-1">Intenta ajustar los filtros o espera a que se registren nuevas visitas.</p>
                </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

