
// src/app/admin/requests/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { SearchRequest } from '@/lib/types';
import { getRequestsAction, updateRequestStatusAction, adminDeleteRequestAction } from '@/actions/requestActions';
import { Loader2, FileSearch, Trash2, Eye, ToggleLeft, ToggleRight, Edit3, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminRequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<SearchRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const fetchedRequests = await getRequestsAction({ includeInactive: true });
      setRequests(fetchedRequests);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar las solicitudes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []); 

  const handleToggleStatus = async (requestId: string, currentStatus: boolean) => {
    startTransition(async () => {
      const result = await updateRequestStatusAction(requestId, !currentStatus);
      if (result.success) {
        toast({ title: "Estado Actualizado", description: result.message });
        setRequests(prevRequests => 
          prevRequests.map(r => r.id === requestId ? { ...r, isActive: !currentStatus } : r)
        );
      } else {
        toast({ title: "Error al Actualizar Estado", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleDeleteRequest = async (requestId: string) => {
    startTransition(async () => {
      const result = await adminDeleteRequestAction(requestId);
      if (result.success) {
        toast({ title: "Solicitud Eliminada", description: result.message });
        setRequests(prevRequests => prevRequests.filter(r => r.id !== requestId));
      } else {
        toast({ title: "Error al Eliminar Solicitud", description: result.message, variant: "destructive" });
      }
    });
  };
  
  if (isLoading && requests.length === 0) { 
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando solicitudes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <FileSearch className="h-6 w-6 mr-2 text-primary" /> Gestión de Solicitudes
          </CardTitle>
          <CardDescription>Visualiza, activa/desactiva, edita y elimina solicitudes de propiedad.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && requests.length > 0 && <p className="text-sm text-muted-foreground mb-2">Actualizando lista de solicitudes...</p>}
          {requests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Título</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Ciudad Deseada</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right min-w-[260px]">Acciones</TableHead> 
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium max-w-xs truncate" title={req.title}>
                        <Link href={`/requests/${req.slug}`} className="hover:underline" target="_blank">
                            {req.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{req.author?.name || 'N/A'}</TableCell>
                      <TableCell>{req.desiredLocation?.city || 'N/A'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(req.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                            <Switch
                            id={`status-${req.id}`}
                            checked={req.isActive}
                            onCheckedChange={() => handleToggleStatus(req.id, req.isActive)}
                            disabled={isPending}
                            aria-label={req.isActive ? "Desactivar solicitud" : "Activar solicitud"}
                            />
                            <Badge variant={req.isActive ? "default" : "outline"} className="text-xs w-[70px] justify-center">
                                {req.isActive ? <ToggleRight className="mr-1 h-3 w-3"/> : <ToggleLeft className="mr-1 h-3 w-3"/>}
                                {req.isActive ? 'Activa' : 'Inactiva'}
                            </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" asChild title="Ver solicitud pública">
                          <Link href={`/requests/${req.slug}`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Editar solicitud (Próximamente)" disabled>
                          {/* <Link href={`/admin/requests/${req.id}/edit`}> */}
                            <Edit3 className="h-4 w-4" />
                          {/* </Link> */}
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Buscar propiedades coincidentes (IA)" className="text-purple-600 hover:text-purple-700">
                          <Link href={`/ai-matching-properties?requestId=${req.id}`}>
                            <Sparkles className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" disabled={isPending} title="Eliminar solicitud">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Eliminarás permanentemente la solicitud "{req.title}".
                                Todos los comentarios asociados también serán eliminados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteRequest(req.id)} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Sí, eliminar solicitud
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            !isLoading && <p className="text-muted-foreground text-center py-4">No hay solicitudes listadas en el sistema.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    
