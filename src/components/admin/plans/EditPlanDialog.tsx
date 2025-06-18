
// src/components/admin/plans/EditPlanDialog.tsx
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { Plan } from '@/lib/types';
import { updatePlanAction } from '@/actions/planActions';
import { Loader2, Save, MessageSquare, Eye, Briefcase, Gauge, BarChartHorizontalBig, Shield, UserCog } from 'lucide-react';
import { Separator } from '@/components/ui/separator';


interface EditPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  onPlanUpdated: () => void;
}

type PlanFormValues = {
  name: string;
  description: string | null;
  price_monthly: string;
  price_currency: string;
  // Detalles Generales
  max_properties_allowed: string | null;
  max_requests_allowed: string | null;
  property_listing_duration_days: string | null;
  can_feature_properties: boolean;
  // Permisos y Límites
  can_view_contact_data: boolean;
  manual_searches_daily_limit: string | null;
  automated_alerts_enabled: boolean; 
  max_ai_searches_monthly: string | null;
  advanced_dashboard_access: boolean;
  daily_profile_views_limit: string | null;
  weekly_matches_reveal_limit: string | null;
  // Flags del Plan
  is_active: boolean;
  is_publicly_visible: boolean;
  is_enterprise_plan: boolean;
};

export default function EditPlanDialog({ open, onOpenChange, plan, onPlanUpdated }: EditPlanDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<PlanFormValues>({
    defaultValues: {
      name: '',
      description: '',
      price_monthly: '0',
      price_currency: 'CLP',
      max_properties_allowed: '',
      max_requests_allowed: '',
      property_listing_duration_days: '',
      can_feature_properties: false,
      can_view_contact_data: false,
      manual_searches_daily_limit: '',
      automated_alerts_enabled: false,
      max_ai_searches_monthly: '',
      advanced_dashboard_access: false,
      daily_profile_views_limit: '',
      weekly_matches_reveal_limit: '',
      is_active: true,
      is_publicly_visible: true,
      is_enterprise_plan: false,
    },
  });

  useEffect(() => {
    if (plan && open) {
      form.reset({
        name: plan.name,
        description: plan.description || '',
        price_monthly: Number.isFinite(plan.price_monthly) ? plan.price_monthly.toString() : '0',
        price_currency: plan.price_currency || 'CLP',
        max_properties_allowed: plan.max_properties_allowed?.toString() || '',
        max_requests_allowed: plan.max_requests_allowed?.toString() || '',
        property_listing_duration_days: plan.property_listing_duration_days?.toString() || '',
        can_feature_properties: plan.can_feature_properties || false,
        
        can_view_contact_data: plan.can_view_contact_data || false,
        manual_searches_daily_limit: plan.manual_searches_daily_limit?.toString() || '',
        automated_alerts_enabled: plan.automated_alerts_enabled || false,
        max_ai_searches_monthly: plan.max_ai_searches_monthly?.toString() || '',
        advanced_dashboard_access: plan.advanced_dashboard_access || false,
        daily_profile_views_limit: plan.daily_profile_views_limit?.toString() || '',
        weekly_matches_reveal_limit: plan.weekly_matches_reveal_limit?.toString() || '',
        
        is_active: plan.is_active,
        is_publicly_visible: plan.is_publicly_visible === undefined ? true : plan.is_publicly_visible,
        is_enterprise_plan: plan.is_enterprise_plan || false,
      });
    } else if (!open) {
      form.reset(); 
    }
  }, [plan, open, form]);

  const handleSubmit = async (values: PlanFormValues) => {
    if (!plan?.id) {
      toast({ title: "Error", description: "ID del plan no encontrado.", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append('name', values.name);
    if (values.description) formData.append('description', values.description);
    formData.append('price_monthly', values.price_monthly);
    formData.append('price_currency', values.price_currency);
    
    // Detalles Generales
    if (values.max_properties_allowed) formData.append('max_properties_allowed', values.max_properties_allowed);
    if (values.max_requests_allowed) formData.append('max_requests_allowed', values.max_requests_allowed);
    if (values.property_listing_duration_days) formData.append('property_listing_duration_days', values.property_listing_duration_days);
    if (values.can_feature_properties) formData.append('can_feature_properties', 'on');

    // Permisos y Límites
    if (values.can_view_contact_data) formData.append('can_view_contact_data', 'on');
    if (values.manual_searches_daily_limit) formData.append('manual_searches_daily_limit', values.manual_searches_daily_limit);
    if (values.automated_alerts_enabled) formData.append('automated_alerts_enabled', 'on');
    if (values.max_ai_searches_monthly) formData.append('max_ai_searches_monthly', values.max_ai_searches_monthly);
    if (values.advanced_dashboard_access) formData.append('advanced_dashboard_access', 'on');
    if (values.daily_profile_views_limit) formData.append('daily_profile_views_limit', values.daily_profile_views_limit);
    if (values.weekly_matches_reveal_limit) formData.append('weekly_matches_reveal_limit', values.weekly_matches_reveal_limit);
    
    // Flags del Plan
    if (values.is_active) formData.append('is_active', 'on');
    if (values.is_publicly_visible) formData.append('is_publicly_visible', 'on');
    if (values.is_enterprise_plan) formData.append('is_enterprise_plan', 'on');
    
    startTransition(async () => {
      const result = await updatePlanAction(plan.id, formData);
      if (result.success) {
        toast({ title: "Plan Actualizado", description: result.message });
        onPlanUpdated();
        onOpenChange(false);
      } else {
        toast({ title: "Error al Actualizar Plan", description: result.message, variant: "destructive" });
      }
    });
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl"> {/* Increased width */}
        <DialogHeader>
          <DialogTitle className="text-xl">Editar Plan: <span className="text-primary">{plan.name}</span></DialogTitle>
          <DialogDescription>Modifica los detalles y permisos del plan de suscripción.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 py-2 max-h-[75vh] overflow-y-auto pr-3 pl-1">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
              <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Nombre del Plan *</FormLabel> <FormControl><Input placeholder="Ej: Básico, Premium" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="price_monthly" render={({ field }) => ( <FormItem> <FormLabel>Precio Mensual ({form.watch('price_currency')}) *</FormLabel> <FormControl><Input type="number" step="0.01" min="0" placeholder="Ej: 14900" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            </div>
            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Descripción</FormLabel> <FormControl><Textarea placeholder="Breve descripción del plan" rows={2} {...field} value={field.value ?? ''} /></FormControl> <FormMessage /> </FormItem> )}/>
            
            <Separator className="my-5"/>
            <h4 className="text-md font-semibold text-muted-foreground flex items-center"><Briefcase className="h-5 w-5 mr-2 text-primary/80"/>Límites Generales de Publicación</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-5">
                <FormField control={form.control} name="max_properties_allowed" render={({ field }) => ( <FormItem> <FormLabel>Máx. Propiedades</FormLabel> <FormControl><Input type="number" min="0" placeholder="Vacío ilimitado" {...field} value={field.value ?? ''}/></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="max_requests_allowed" render={({ field }) => ( <FormItem> <FormLabel>Máx. Solicitudes</FormLabel> <FormControl><Input type="number" min="0" placeholder="Vacío ilimitado" {...field} value={field.value ?? ''}/></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="property_listing_duration_days" render={({ field }) => ( <FormItem> <FormLabel>Duración Public. (días)</FormLabel> <FormControl><Input type="number" min="0" placeholder="Vacío indefinido" {...field} value={field.value ?? ''}/></FormControl> <FormMessage /> </FormItem> )}/>
            </div>
            <FormField control={form.control} name="can_feature_properties" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-1"> <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl> <Label htmlFor={field.name} className="font-normal text-sm">Permite Destacar Propiedades</Label> </FormItem> )}/>
            
            <Separator className="my-5"/>
            <h4 className="text-md font-semibold text-muted-foreground flex items-center"><Shield className="h-5 w-5 mr-2 text-primary/80"/>Permisos y Límites Específicos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                <FormField control={form.control} name="manual_searches_daily_limit" render={({ field }) => ( <FormItem> <FormLabel>Búsquedas Manuales/Día</FormLabel> <FormControl><Input type="number" min="0" placeholder="Vacío ilimitado" {...field} value={field.value ?? ''}/></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="max_ai_searches_monthly" render={({ field }) => ( <FormItem> <FormLabel>Búsquedas IA/Mes</FormLabel> <FormControl><Input type="number" min="0" placeholder="Vacío ilimitado" {...field} value={field.value ?? ''}/></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="daily_profile_views_limit" render={({ field }) => ( <FormItem> <FormLabel>Vistas de Perfil/Día</FormLabel> <FormControl><Input type="number" min="0" placeholder="Vacío ilimitado" {...field} value={field.value ?? ''}/></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="weekly_matches_reveal_limit" render={({ field }) => ( <FormItem> <FormLabel>Revelar Contactos/Semana</FormLabel> <FormControl><Input type="number" min="0" placeholder="Vacío ilimitado" {...field} value={field.value ?? ''}/></FormControl> <FormMessage /> </FormItem> )}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 pt-1">
                <FormField control={form.control} name="can_view_contact_data" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-2 space-y-0"> <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl> <Label htmlFor={field.name} className="font-normal text-sm flex items-center gap-1"><Eye className="h-4 w-4 text-primary/70"/>Permite Ver Datos de Contacto</Label> </FormItem> )}/>
                <FormField control={form.control} name="automated_alerts_enabled" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-2 space-y-0"> <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl> <Label htmlFor={field.name} className="font-normal text-sm flex items-center gap-1"><MessageSquare className="h-4 w-4 text-green-600"/>Alertas Automáticas (IA + WhatsApp)</Label> </FormItem> )}/>
                <FormField control={form.control} name="advanced_dashboard_access" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-2 space-y-0"> <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl> <Label htmlFor={field.name} className="font-normal text-sm flex items-center gap-1"><BarChartHorizontalBig className="h-4 w-4 text-indigo-600"/>Acceso a Panel Avanzado</Label> </FormItem> )}/>
            </div>
            
            <Separator className="my-5"/>
            <h4 className="text-md font-semibold text-muted-foreground flex items-center"><UserCog className="h-5 w-5 mr-2 text-primary/80"/>Configuración del Plan</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3 pt-1">
                <FormField control={form.control} name="is_active" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-2 space-y-0"> <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl> <Label htmlFor={field.name} className="font-normal text-sm">Activo (puede ser asignado)</Label> </FormItem> )}/>
                <FormField control={form.control} name="is_publicly_visible" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-2 space-y-0"> <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl> <Label htmlFor={field.name} className="font-normal text-sm">Visible Públicamente</Label> </FormItem> )}/>
                <FormField control={form.control} name="is_enterprise_plan" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-2 space-y-0"> <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl> <Label htmlFor={field.name} className="font-normal text-sm">Plan Corporativo</Label> </FormItem> )}/>
            </div>
            <Input type="hidden" {...form.register('price_currency')} />

            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || !form.formState.isDirty}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

