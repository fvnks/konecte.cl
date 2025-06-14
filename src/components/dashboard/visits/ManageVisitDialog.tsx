
// src/components/dashboard/visits/ManageVisitDialog.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { updateVisitStatusFormSchema, type UpdateVisitStatusFormValues, type PropertyVisit, type PropertyVisitAction, PropertyVisitStatusLabels } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { updateVisitStatusAction } from '@/actions/visitActions';
import { Loader2, Save, CalendarClock, AlertTriangle } from 'lucide-react';

interface ManageVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: PropertyVisit | null;
  actionType: PropertyVisitAction | null;
  currentUserId: string;
  onVisitUpdated: () => void;
}

export default function ManageVisitDialog({
  open,
  onOpenChange,
  visit,
  actionType,
  currentUserId,
  onVisitUpdated,
}: ManageVisitDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [showCancellationReason, setShowCancellationReason] = useState(false);
  const [showOwnerNotes, setShowOwnerNotes] = useState(false);

  const form = useForm<UpdateVisitStatusFormValues>({
    resolver: zodResolver(updateVisitStatusFormSchema),
    defaultValues: {
      new_status: visit?.status,
      confirmed_datetime: null,
      owner_notes: '',
      cancellation_reason: '',
    },
  });

  useEffect(() => {
    if (visit && actionType) {
      form.reset({
        new_status: actionType === 'confirm' ? 'confirmed'
                  : actionType === 'cancel_by_owner' ? 'cancelled_by_owner'
                  : actionType === 'reschedule' ? 'rescheduled_by_owner'
                  : actionType === 'mark_completed' ? 'completed'
                  : actionType === 'mark_visitor_no_show' ? 'visitor_no_show'
                  : actionType === 'mark_owner_no_show' ? 'owner_no_show'
                  : actionType === 'cancel_by_visitor' ? 'cancelled_by_visitor'
                  : visit.status,
        confirmed_datetime: (actionType === 'confirm' || actionType === 'reschedule') && visit.proposed_datetime
                            ? new Date(visit.proposed_datetime).toISOString() 
                            : null,
        owner_notes: visit.owner_notes || '',
        cancellation_reason: visit.cancellation_reason || '',
      });

      setShowDateTimePicker(actionType === 'confirm' || actionType === 'reschedule');
      setShowCancellationReason(actionType === 'cancel_by_owner' || actionType === 'cancel_by_visitor');
      setShowOwnerNotes(actionType === 'confirm' || actionType === 'reschedule' || actionType === 'cancel_by_owner');

    } else if (!open) { // Reset on close if no visit/action
       form.reset({
            new_status: undefined,
            confirmed_datetime: null,
            owner_notes: '',
            cancellation_reason: '',
        });
        setShowDateTimePicker(false);
        setShowCancellationReason(false);
        setShowOwnerNotes(false);
    }
  }, [visit, actionType, open, form]);


  async function onSubmit(values: UpdateVisitStatusFormValues) {
    if (!visit || !actionType || !currentUserId) {
      toast({ title: 'Error', description: 'Faltan datos para procesar la acción.', variant: 'destructive' });
      return;
    }
    
    // Ensure new_status is set from the actionType if not directly in form (e.g. simple "mark completed")
    const finalValues: UpdateVisitStatusFormValues = {
      ...values,
      new_status: form.getValues('new_status'), // This is correctly set by useEffect now
    };


    setIsSubmitting(true);
    const result = await updateVisitStatusAction(visit.id, currentUserId, finalValues);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: 'Visita Actualizada', description: `El estado de la visita ha sido actualizado a: ${PropertyVisitStatusLabels[finalValues.new_status]}.` });
      onVisitUpdated();
      onOpenChange(false);
    } else {
      toast({ title: 'Error al Actualizar', description: result.message || 'No se pudo actualizar la visita.', variant: 'destructive' });
    }
  }

  if (!visit || !actionType) return null;

  const getDialogTitle = () => {
    switch (actionType) {
      case 'confirm': return 'Confirmar Visita';
      case 'cancel_by_owner': return 'Rechazar/Cancelar Visita (Propietario)';
      case 'reschedule': return 'Reagendar Visita (Propietario)';
      case 'mark_completed': return 'Marcar Visita como Completada';
      case 'mark_visitor_no_show': return 'Marcar como Visitante No Asistió';
      case 'mark_owner_no_show': return 'Marcar como Propietario No Asistió';
      case 'cancel_by_visitor': return 'Cancelar Solicitud de Visita (Visitante)';
      default: return 'Gestionar Visita';
    }
  };
  
  const getDialogDescription = () => {
    switch (actionType) {
        case 'confirm': return `Vas a confirmar la visita para "${visit.property_title}". Puedes ajustar la fecha/hora si es necesario.`;
        case 'cancel_by_owner': return `Estás por rechazar/cancelar la visita a "${visit.property_title}".`;
        case 'reschedule': return `Propón una nueva fecha/hora para la visita a "${visit.property_title}".`;
        case 'mark_completed': return `Confirma que la visita a "${visit.property_title}" se realizó exitosamente.`;
        case 'mark_visitor_no_show': return `Registra que el visitante no se presentó a la visita de "${visit.property_title}".`;
        case 'mark_owner_no_show': return `Registra que el propietario/agente no se presentó a la visita de "${visit.property_title}".`;
        case 'cancel_by_visitor': return `Estás por cancelar tu solicitud de visita para "${visit.property_title}".`;
        default: return `Gestionando la visita para "${visit.property_title}".`;
    }
  };

  const getSubmitButtonText = () => {
     switch (actionType) {
      case 'confirm': return 'Confirmar Visita';
      case 'cancel_by_owner': return 'Rechazar/Cancelar';
      case 'reschedule': return 'Proponer Nuevo Horario';
      case 'mark_completed': return 'Marcar Completada';
      case 'mark_visitor_no_show': return 'Registrar No Asistencia';
      case 'mark_owner_no_show': return 'Registrar No Asistencia';
      case 'cancel_by_visitor': return 'Confirmar Cancelación';
      default: return 'Guardar Cambios';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {actionType.includes('cancel') ? <AlertTriangle className="mr-2 h-5 w-5 text-destructive" /> : <CalendarClock className="mr-2 h-5 w-5 text-primary" />}
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
            {showDateTimePicker && (
              <FormField
                control={form.control}
                name="confirmed_datetime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha y Hora {actionType === 'reschedule' ? 'Reagendada' : 'Confirmada'} *</FormLabel>
                    <DatePicker
                      value={field.value ? new Date(field.value) : new Date(visit.proposed_datetime)}
                      onChange={(date) => field.onChange(date?.toISOString())}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {showOwnerNotes && (
              <FormField
                control={form.control}
                name="owner_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Adicionales (Propietario)</FormLabel>
                    <FormControl><Textarea placeholder="Ej: Por favor, llegar puntual..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {showCancellationReason && (
              <FormField
                control={form.control}
                name="cancellation_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo de Cancelación (Opcional)</FormLabel>
                    <FormControl><Textarea placeholder="Explica brevemente por qué se cancela..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
             <FormField control={form.control} name="new_status" render={({ field }) => <Input type="hidden" {...field} />} />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cerrar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {getSubmitButtonText()}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

