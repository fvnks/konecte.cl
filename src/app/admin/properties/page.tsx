
// src/app/admin/properties/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { PropertyListing } from '@/lib/types';
import { getPropertiesAction, updatePropertyStatusAction, deletePropertyByAdminAction } from '@/actions/propertyActions';
import { Loader2, ListOrdered, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
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

const translatePropertyType = (type: 'rent' | 'sale'): string => {
  if (type === 'rent') return 'Arriendo';
  if (type === 'sale') return 'Venta';
  return type;
}

export default function AdminPropertiesPage() {
  const { toast } = useToast();
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const fetchedProperties = await getPropertiesAction({ includeInactive: true });
      setProperties(fetchedProperties);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar las propiedades.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []); 

  const handleToggleStatus = async (propertyId: string, currentStatus: boolean) => {
    startTransition(async () => {
      const result = await updatePropertyStatusAction(propertyId, !currentStatus);
      if (result.success) {
        toast({ title: "Estado Actualizado", description: result.message });
        setProperties(prevProperties => 
          prevProperties.map(p => p.id === propertyId ? { ...p, isActive: !currentStatus } : p)
        );
      } else {
        toast({ title: "Error al Actualizar Estado", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleDeleteProperty = async (propertyId: string) => {
    startTransition(async () => {
      const result = await deletePropertyByAdminAction(propertyId);
      if (result.success) {
        toast({ title: "Propiedad Eliminada", description: result.message });
        setProperties(prevProperties => prevProperties.filter(p => p.id !== propertyId));
      } else {
        toast({ title: "Error al Eliminar Propiedad", description: result.message, variant: "destructive" });
      }
    });
  };
  
  if (isLoading && properties.length === 0) { 
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando propiedades...</p>
      </div>
    );
  }

  const formatPriceForDisplay = (price: number, currency: string) => {
    try {
      return new Intl.NumberFormat('es-CL', { style: 'currency', currency: currency || 'CLP' }).format(price);
    } catch {
      return `${price.toLocaleString('es-CL')} ${currency}`;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <ListOrdered className="h-6 w-6 mr-2 text-primary" /> Gestión de Propiedades
          </CardTitle>
          <CardDescription>Visualiza, activa/desactiva y elimina propiedades listadas en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && properties.length > 0 && <p className="text-sm text-muted-foreground mb-2">Actualizando lista de propiedades...</p>}
          {properties.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Título</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right min-w-[180px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((prop) => (
                    <TableRow key={prop.id}>
                      <TableCell className="font-medium max-w-xs truncate" title={prop.title}>
                        <Link href={`/properties/${prop.slug}`} className="hover:underline" target="_blank">
                            {prop.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{prop.author?.name || 'N/A'}</TableCell>
                      <TableCell>{formatPriceForDisplay(prop.price, prop.currency)}</TableCell>
                      <TableCell className="capitalize">{translatePropertyType(prop.propertyType)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(prop.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                            <Switch
                            id={`status-${prop.id}`}
                            checked={prop.isActive}
                            onCheckedChange={() => handleToggleStatus(prop.id, prop.isActive)}
                            disabled={isPending}
                            aria-label={prop.isActive ? "Desactivar propiedad" : "Activar propiedad"}
                            />
                            <Badge variant={prop.isActive ? "default" : "outline"} className="text-xs w-[70px] justify-center">
                                {prop.isActive ? <ToggleRight className="mr-1 h-3 w-3"/> : <ToggleLeft className="mr-1 h-3 w-3"/>}
                                {prop.isActive ? 'Activa' : 'Inactiva'}
                            </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" asChild title="Ver propiedad">
                          <Link href={`/properties/${prop.slug}`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" disabled={isPending} title="Eliminar propiedad">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Eliminarás permanentemente la propiedad "{prop.title}".
                                Todos los datos asociados, como comentarios, también podrían ser eliminados (dependiendo de la configuración de la BD).
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProperty(prop.id)} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Sí, eliminar propiedad
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
            !isLoading && <p className="text-muted-foreground text-center py-4">No hay propiedades listadas en el sistema.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
