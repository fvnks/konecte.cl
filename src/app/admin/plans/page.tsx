
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
import { addPlanAction, deletePlanAction, getPlansAction, togglePlanStatusAction, getPlanByIdAction, togglePlanVisibilityAction } from '@/actions/planActions';
import { Loader2, PlusCircle, CreditCard, Trash2, ToggleLeft, ToggleRight, Brain, Eye, EyeOff, MessageSquare, Gauge, Briefcase, BarChartHorizontalBig, Shield, UserCog, Info } from 'lucide-react'; // Added new icons
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
import StyledEditButton from '@/components/ui/StyledEditButton'; 
import { Separator } from '@/components/ui/separator';

export default function AdminPlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);


  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const fetchedPlans = await getPlansAction({ showAllAdmin: true }); 
      setPlans(fetchedPlans);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los planes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleToggleVisibility = async (planId: string, currentVisibility: boolean) => {
    startTransition(async () => {
      const result = await togglePlanVisibilityAction(planId, !currentVisibility);
      if (result.success) {
        toast({ title: "Visibilidad Actualizada", description: result.message });
        setPlans(prevPlans =>
          prevPlans.map(p => p.id === planId ? { ...p, is_publicly_visible: !currentVisibility } : p)
        );
      } else {
        toast({ title: "Error al Actualizar Visibilidad", description: result.message, variant: "destructive" });
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
    await fetchPlans(); 
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
          <CardDescription>Crea, visualiza y gestiona los planes de suscripción o uso para corredores.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPlan} className="space-y-5 mb-8 p-4 border rounded-lg bg-secondary/30">
            <h3 className="text-lg font-semibold">Añadir Nuevo Plan</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
              <div> <Label htmlFor="name" className="block text-sm font-medium mb-1">Nombre del Plan *</Label> <Input id="name" name="name" placeholder="Ej: Básico, Premium" required /> </div>
              <div> <Label htmlFor="price_monthly" className="block text-sm font-medium mb-1">Precio Mensual (CLP) *</Label> <Input id="price_monthly" name="price_monthly" type="number" step="0.01" min="0" placeholder="Ej: 14900" required /> </div>
            </div>
            <div> <Label htmlFor="description" className="block text-sm font-medium mb-1">Descripción</Label> <Textarea id="description" name="description" placeholder="Breve descripción del plan" rows={2}/> </div>
            
            <Separator className="my-4"/>
            <h4 className="text-md font-semibold text-muted-foreground flex items-center"><Briefcase className="h-4 w-4 mr-2 text-primary/70"/>Límites Generales de Publicación</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-5">
              <div> <Label htmlFor="max_properties_allowed" className="block text-sm font-medium mb-1">Máx. Propiedades</Label> <Input id="max_properties_allowed" name="max_properties_allowed" type="number" min="0" placeholder="Vacío para ilimitado" /> </div>
              <div> <Label htmlFor="max_requests_allowed" className="block text-sm font-medium mb-1">Máx. Solicitudes</Label> <Input id="max_requests_allowed" name="max_requests_allowed" type="number" min="0" placeholder="Vacío para ilimitado" /> </div>
              <div> <Label htmlFor="property_listing_duration_days" className="block text-sm font-medium mb-1">Duración Publicación (días)</Label> <Input id="property_listing_duration_days" name="property_listing_duration_days" type="number" min="0" placeholder="Vacío para indefinido" /> </div>
            </div>
            <div className="flex items-center space-x-2 pt-1"> <Checkbox id="can_feature_properties_add" name="can_feature_properties" /> <Label htmlFor="can_feature_properties_add">Permite Destacar Propiedades</Label> </div>

            <Separator className="my-4"/>
            <h4 className="text-md font-semibold text-muted-foreground flex items-center"><Shield className="h-4 w-4 mr-2 text-primary/70"/>Permisos y Límites Específicos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-5">
              <div> <Label htmlFor="manual_searches_daily_limit_add" className="block text-sm font-medium mb-1">Búsquedas Manuales/Día</Label> <Input id="manual_searches_daily_limit_add" name="manual_searches_daily_limit" type="number" min="0" placeholder="Vacío ilimitado" /> </div>
              <div> <Label htmlFor="max_ai_searches_monthly_add" className="block text-sm font-medium mb-1">Búsquedas IA/Mes</Label> <Input id="max_ai_searches_monthly_add" name="max_ai_searches_monthly" type="number" min="0" placeholder="Vacío ilimitado" /> </div>
              <div> <Label htmlFor="daily_profile_views_limit_add" className="block text-sm font-medium mb-1">Vistas de Perfil/Día</Label> <Input id="daily_profile_views_limit_add" name="daily_profile_views_limit" type="number" min="0" placeholder="Vacío ilimitado" /> </div>
              <div> <Label htmlFor="weekly_matches_reveal_limit_add" className="block text-sm font-medium mb-1">Revelar Contactos/Semana</Label> <Input id="weekly_matches_reveal_limit_add" name="weekly_matches_reveal_limit" type="number" min="0" placeholder="Vacío ilimitado" /> </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 pt-1">
              <div className="flex items-center space-x-2"> <Checkbox id="can_view_contact_data_add" name="can_view_contact_data" /> <Label htmlFor="can_view_contact_data_add" className="flex items-center gap-1"><Eye className="h-4 w-4 text-primary/70"/>Ver Datos de Contacto</Label> </div>
              <div className="flex items-center space-x-2"> <Checkbox id="automated_alerts_enabled_add" name="automated_alerts_enabled" /> <Label htmlFor="automated_alerts_enabled_add" className="flex items-center gap-1"><MessageSquare className="h-4 w-4 text-green-600"/>Alertas Automáticas (IA+WA)</Label> </div>
              <div className="flex items-center space-x-2"> <Checkbox id="advanced_dashboard_access_add" name="advanced_dashboard_access" /> <Label htmlFor="advanced_dashboard_access_add" className="flex items-center gap-1"><BarChartHorizontalBig className="h-4 w-4 text-indigo-600"/>Panel Avanzado</Label> </div>
            </div>

            <Separator className="my-4"/>
            <h4 className="text-md font-semibold text-muted-foreground flex items-center"><UserCog className="h-4 w-4 mr-2 text-primary/70"/>Configuración del Plan</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3 pt-1">
              <div className="flex items-center space-x-2"> <Checkbox id="is_active_add" name="is_active" defaultChecked={true} /> <Label htmlFor="is_active_add">Activo al crear</Label> </div>
              <div className="flex items-center space-x-2"> <Checkbox id="is_publicly_visible_add" name="is_publicly_visible" defaultChecked={true} /> <Label htmlFor="is_publicly_visible_add">Visible Públicamente</Label> </div>
              <div className="flex items-center space-x-2"> <Checkbox id="is_enterprise_plan_add" name="is_enterprise_plan" /> <Label htmlFor="is_enterprise_plan_add">Plan Corporativo</Label> </div>
            </div>

            <Input type="hidden" name="price_currency" value="CLP" />
            <Button type="submit" disabled={isPending} className="mt-4">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Añadir Plan
            </Button>
          </form>

          <h3 className="text-lg font-semibold mb-2 mt-8">Planes Existentes</h3>
          {isLoading && plans.length > 0 && <p className="text-sm text-muted-foreground mb-2">Actualizando lista de planes...</p>}
          {plans.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nombre</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead title="Ver Contactos">V.Contact</TableHead>
                    <TableHead title="Alertas Auto.">A.Auto</TableHead>
                    <TableHead title="Panel Avanzado">P.Avanz</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Visibilidad</TableHead>
                    <TableHead className="text-right min-w-[200px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>${plan.price_monthly.toLocaleString('es-CL')} {plan.price_currency}</TableCell>
                      <TableCell className="text-center">{plan.can_view_contact_data ? <Eye className="h-4 w-4 text-green-600 mx-auto" title="Permitido"/> : <EyeOff className="h-4 w-4 text-muted-foreground/50 mx-auto" title="No Permitido"/>}</TableCell>
                      <TableCell className="text-center">{plan.automated_alerts_enabled ? <MessageSquare className="h-4 w-4 text-green-600 mx-auto" title="Activado"/> : <MessageSquare className="h-4 w-4 text-muted-foreground/50 mx-auto" title="Desactivado"/>}</TableCell>
                      <TableCell className="text-center">{plan.advanced_dashboard_access ? <BarChartHorizontalBig className="h-4 w-4 text-green-600 mx-auto" title="Sí"/> : <BarChartHorizontalBig className="h-4 w-4 text-muted-foreground/50 mx-auto" title="No"/>}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(plan.id, plan.is_active)} disabled={isPending} className={`h-auto px-2 py-1 text-xs ${plan.is_active ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}`}>
                          {plan.is_active ? <ToggleRight className="mr-1 h-4 w-4" /> : <ToggleLeft className="mr-1 h-4 w-4" />} {plan.is_active ? 'Activo' : 'Inactivo'}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleVisibility(plan.id, plan.is_publicly_visible)} disabled={isPending} className={`h-auto px-2 py-1 text-xs ${plan.is_publicly_visible ? 'text-green-600 hover:text-green-700' : 'text-slate-500 hover:text-slate-600'}`}>
                          {plan.is_publicly_visible ? <Eye className="mr-1 h-4 w-4" /> : <EyeOff className="mr-1 h-4 w-4" />} {plan.is_publicly_visible ? 'Visible' : 'Oculto'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <StyledEditButton onClick={() => handleEditPlanRequest(plan.id)} disabled={isPending} title="Editar plan"/>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="h-10 w-10" disabled={isPending} title="Eliminar plan"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Eliminarás permanentemente el plan "{plan.name}". Los usuarios asignados a este plan quedarán sin plan.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePlan(plan.id)} disabled={isPending} className="bg-destructive hover:bg-destructive/90">{isPending && editingPlan?.id === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Sí, eliminar plan</AlertDialogAction></AlertDialogFooter>
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
            <CardTitle className="text-xl flex items-center"><Info className="h-5 w-5 mr-2 text-blue-600"/>Notas sobre Planes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Campos con asterisco (*) son requeridos.</strong></p>
            <p>Los límites (Propiedades, Solicitudes, Búsquedas IA, etc.) pueden ser dejados en blanco para indicar "ilimitado" o "indefinido".</p>
            <p>Un plan "Activo" puede ser asignado a usuarios. Un plan "Visible Públicamente" aparecerá en la página de `/plans` para los visitantes.</p>
            <p>"Alertas Automáticas" habilita notificaciones vía IA y WhatsApp para los corredores con ese plan.</p>
            <p>"Plan Corporativo" es una marca para planes especiales; su lógica específica se define por los otros campos de permisos y límites.</p>
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

