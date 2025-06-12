
// src/app/admin/plans/page.tsx
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Plan } from '@/lib/types';
import { addPlanAction, deletePlanAction, getPlansAction, togglePlanStatusAction, getPlanByIdAction } from '@/actions/planActions';
import { Loader2, PlusCircle, CreditCard, Trash2, ToggleLeft, ToggleRight, Edit } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import EditPlanDialog from '@/components/admin/plans/EditPlanDialog';

export default function AdminPlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('0');

  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);


  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const fetchedPlans = await getPlansAction();
      setPlans(fetchedPlans);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los planes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []); 

  const handleAddPlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    startTransition(async () => {
      const result = await addPlanAction(formData);
      if (result.success && result.plan) {
        toast({ title: "Plan Añadido", description: result.message });
        form.reset(); 
        setNewPlanName(''); 
        setNewPlanDescription('');
        setNewPlanPrice('0');
        await fetchPlans(); 
      } else {
        toast({ title: "Error al Añadir Plan", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleDeletePlan = async (planId: string) => {
    startTransition(async () => {
      const result = await deletePlanAction(planId);
      if (result.success) {
        toast({ title: "Plan Eliminado", description: result.message });
        setPlans(prevPlans => prevPlans.filter(p => p.id !== planId));
      } else {
        toast({ title: "Error al Eliminar Plan", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleToggleStatus = async (planId: string, currentStatus: boolean) => {
    startTransition(async () => {
      const result = await togglePlanStatusAction(planId, !currentStatus);
      if (result.success) {
        toast({ title: "Estado Actualizado", description: result.message });
        setPlans(prevPlans => 
          prevPlans.map(p => p.id === planId ? { ...p, is_active: !currentStatus } : p)
        );
      } else {
        toast({ title: "Error al Actualizar Estado", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleEditPlanRequest = async (planId: string) => {
    startTransition(async () => {
      const planToEdit = await getPlanByIdAction(planId);
      if (planToEdit) {
        setEditingPlan(planToEdit);
        setIsEditModalOpen(true);
      } else {
        toast({ title: "Error", description: "No se pudo encontrar el plan para editar.", variant: "destructive" });
      }
    });
  };

  const handlePlanUpdated = async () => {
    setIsEditModalOpen(false);
    setEditingPlan(null);
    await fetchPlans(); // Recargar la lista de planes
  };
  
  if (isLoading && plans.length === 0) { 
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando planes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <CreditCard className="h-6 w-6 mr-2 text-primary" /> Gestión de Planes
          </CardTitle>
          <CardDescription>Crea, visualiza y gestiona los planes de suscripción o uso.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPlan} className="space-y-4 mb-8 p-4 border rounded-lg bg-secondary/30">
            <h3 className="text-lg font-semibold">Añadir Nuevo Plan</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium mb-1">Nombre del Plan *</Label>
                <Input id="name" name="name" value={newPlanName} onChange={e => setNewPlanName(e.target.value)} placeholder="Ej: Básico, Premium" required />
              </div>
              <div>
                <Label htmlFor="price_monthly" className="block text-sm font-medium mb-1">Precio Mensual (CLP) *</Label>
                <Input id="price_monthly" name="price_monthly" type="number" step="0.01" min="0" value={newPlanPrice} onChange={e => setNewPlanPrice(e.target.value)} placeholder="Ej: 5000" required />
              </div>
            </div>

            <div>
                <Label htmlFor="description" className="block text-sm font-medium mb-1">Descripción</Label>
                <Textarea id="description" name="description" value={newPlanDescription} onChange={e => setNewPlanDescription(e.target.value)} placeholder="Breve descripción del plan" rows={2}/>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <Label htmlFor="max_properties_allowed" className="block text-sm font-medium mb-1">Máx. Propiedades</Label>
                    <Input id="max_properties_allowed" name="max_properties_allowed" type="number" min="0" placeholder="Vacío para ilimitado" />
                </div>
                <div>
                    <Label htmlFor="max_requests_allowed" className="block text-sm font-medium mb-1">Máx. Solicitudes</Label>
                    <Input id="max_requests_allowed" name="max_requests_allowed" type="number" min="0" placeholder="Vacío para ilimitado" />
                </div>
                <div>
                    <Label htmlFor="property_listing_duration_days" className="block text-sm font-medium mb-1">Duración Publicación (días)</Label>
                    <Input id="property_listing_duration_days" name="property_listing_duration_days" type="number" min="0" placeholder="Vacío para indefinido" />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
                <div className="flex items-center space-x-2">
                    <Checkbox id="can_feature_properties" name="can_feature_properties" />
                    <Label htmlFor="can_feature_properties">Permite Destacar Propiedades</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <Checkbox id="is_active" name="is_active" defaultChecked={true} />
                    <Label htmlFor="is_active">Plan Activo al crear</Label>
                </div>
            </div>
            <Input type="hidden" name="price_currency" value="CLP" />


            <Button type="submit" disabled={isPending || !newPlanName.trim()}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Añadir Plan
            </Button>
          </form>

          <h3 className="text-lg font-semibold mb-2">Planes Existentes</h3>
          {isLoading && plans.length > 0 && <p className="text-sm text-muted-foreground mb-2">Actualizando lista de planes...</p>}
          {plans.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="min-w-[100px]">Precio</TableHead>
                    <TableHead>Prop.</TableHead>
                    <TableHead>Sol.</TableHead>
                    <TableHead>Dest.</TableHead>
                    <TableHead className="min-w-[100px]">Duración</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right min-w-[200px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>${plan.price_monthly.toLocaleString('es-CL')} {plan.price_currency}</TableCell>
                      <TableCell className="text-center">{plan.max_properties_allowed ?? '∞'}</TableCell>
                      <TableCell className="text-center">{plan.max_requests_allowed ?? '∞'}</TableCell>
                      <TableCell className="text-center">{plan.can_feature_properties ? 'Sí' : 'No'}</TableCell>
                      <TableCell className="text-center">{plan.property_listing_duration_days ?? 'Indef.'} {plan.property_listing_duration_days ? 'días' : ''}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleToggleStatus(plan.id, plan.is_active)}
                          disabled={isPending}
                          className={`h-auto px-2 py-1 text-xs ${plan.is_active ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}`}
                        >
                          {isPending && editingPlan?.id === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (plan.is_active ? <ToggleRight className="mr-1 h-4 w-4" /> : <ToggleLeft className="mr-1 h-4 w-4" />)}
                          {plan.is_active ? 'Activo' : 'Inactivo'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditPlanRequest(plan.id)} disabled={isPending} aria-label="Editar plan" title="Editar plan">
                          {isPending && editingPlan?.id === plan.id ? <Loader2 className="h-3 w-3 animate-spin md:mr-1" /> : <Edit className="h-3 w-3 md:mr-1"/>}
                          <span className="hidden md:inline">Editar</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isPending} aria-label="Eliminar plan" title="Eliminar plan">
                              <Trash2 className="h-3 w-3 md:mr-1" /> <span className="hidden md:inline">Eliminar</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Eliminarás permanentemente el plan "{plan.name}".
                                Los usuarios asignados a este plan quedarán sin plan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePlan(plan.id)} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                                {isPending && editingPlan?.id === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Sí, eliminar plan
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
            !isLoading && <p className="text-muted-foreground text-center py-4">No hay planes definidos. ¡Crea el primero!</p>
          )}
        </CardContent>
      </Card>
       <Card className="mt-6 bg-secondary/30">
        <CardHeader>
            <CardTitle className="text-xl">Notas sobre Planes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Campos con asterisco (*) son requeridos.</strong></p>
            <p>Los límites de propiedades/solicitudes y la duración de publicación pueden ser dejados en blanco para indicar "ilimitado" o "indefinido".</p>
            <p>Si un plan se elimina, los usuarios asignados perderán esa asignación.</p>
        </CardContent>
      </Card>
      {editingPlan && (
        <EditPlanDialog
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            plan={editingPlan}
            onPlanUpdated={handlePlanUpdated}
        />
      )}
    </div>
  );
}
