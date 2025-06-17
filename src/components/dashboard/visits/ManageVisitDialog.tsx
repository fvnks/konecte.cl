// src/components/dashboard/visits/ManageVisitDialog.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { updateVisitStatusAction, getBookedTimeSlotsForPropertyOnDateAction } from '@/actions/visitActions';
import { Loader2, Save, CalendarClock, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; // Importación añadida

interface ManageVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: PropertyVisit | null;
  actionType: PropertyVisitAction | null;
  currentUserId: string;
  onVisitUpdated: () => void;
}

const generateTimeSlots = (startHour: number, endHour: number): string[] => {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${String(hour).padStart(2, '0')}:00`);
  }
  return slots;
};
const availableTimeSlots = generateTimeSlots(8, 18); // 08:00 to 17:00

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
  
  const [selectedDatePart, setSelectedDatePart] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);
  const [isLoadingBookedSlots, setIsLoadingBookedSlots] = useState(false);

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
  
  const fetchBookedSlots = useCallback(async (date: Date) => {
    if (!visit?.property_id) return;
    setIsLoadingBookedSlots(true);
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const slots = await getBookedTimeSlotsForPropertyOnDateAction(visit.property_id, dateString);
      setBookedTimeSlots(slots);
    } catch (error) {
      console.error("Error fetching booked slots:", error);
      setBookedTimeSlots([]);
    } finally {
      setIsLoadingBookedSlots(false);
    }
  }, [visit?.property_id]);

  useEffect(() => {
    if (visit && actionType && open) {
      let newStatus = visit.status;
      let confirmedDt: string | null = null;
      let needsDateTimePicker = false;
      let needsCancellationReason = false;
      let needsOwnerNotes = false;

      switch (actionType) {
        case 'confirm_original_proposal':
          newStatus = 'confirmed';
          confirmedDt = visit.proposed_datetime;
          needsOwnerNotes = true;
          break;
        case 'reschedule_proposal':
          newStatus = 'rescheduled_by_owner';
          needsDateTimePicker = true;
          needsOwnerNotes = true;
          const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(10,0,0,0);
          setSelectedDatePart(tomorrow);
          fetchBookedSlots(tomorrow);
          setSelectedTimeSlot(null);
          break;
        case 'cancel_pending_request':
          newStatus = 'cancelled_by_owner';
          needsCancellationReason = true;
          needsOwnerNotes = true;
          break;
        case 'cancel_confirmed_visit':
          newStatus = 'cancelled_by_owner';
          needsCancellationReason = true;
          needsOwnerNotes = true;
          break;
        case 'mark_completed':
          newStatus = 'completed';
          break;
        case 'mark_visitor_no_show':
          newStatus = 'visitor_no_show';
          break;
        case 'mark_owner_no_show':
          newStatus = 'owner_no_show';
          break;
        case 'accept_owner_reschedule':
          newStatus = 'confirmed';
          confirmedDt = visit.confirmed_datetime; // This should be the time owner proposed
          break;
        case 'reject_owner_reschedule':
          newStatus = 'cancelled_by_visitor';
          needsCancellationReason = true;
          break;
        case 'cancel_own_request':
          newStatus = 'cancelled_by_visitor';
          needsCancellationReason = true;
          break;
        default:
          newStatus = visit.status;
      }

      form.reset({
        new_status: newStatus,
        confirmed_datetime: confirmedDt,
        owner_notes: visit.owner_notes || '',
        cancellation_reason: visit.cancellation_reason || '',
      });

      setShowDateTimePicker(needsDateTimePicker);
      setShowCancellationReason(needsCancellationReason);
      setShowOwnerNotes(needsOwnerNotes);
      
      if (!needsDateTimePicker) {
          setSelectedDatePart(null);
          setSelectedTimeSlot(null);
          setBookedTimeSlots([]);
      }

    } else if (!open) {
       form.reset({ new_status: undefined, confirmed_datetime: null, owner_notes: '', cancellation_reason: '' });
       setShowDateTimePicker(false); setShowCancellationReason(false); setShowOwnerNotes(false);
       setSelectedDatePart(null); setSelectedTimeSlot(null); setBookedTimeSlots([]);
    }
  }, [visit, actionType, open, form, fetchBookedSlots]);

  const handleDatePartChange = (date?: Date) => {
    if (date) {
      setSelectedDatePart(date);
      setSelectedTimeSlot(null); 
      form.setValue('confirmed_datetime', '', { shouldValidate: true }); 
      fetchBookedSlots(date);
    }
  };

  const handleTimeSlotChange = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    if (selectedDatePart) {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const combinedDateTime = new Date(selectedDatePart);
      combinedDateTime.setHours(hours, minutes, 0, 0);
      form.setValue('confirmed_datetime', combinedDateTime.toISOString(), { shouldValidate: true, shouldDirty: true });
    }
  };


  async function onSubmit(values: UpdateVisitStatusFormValues) {
    if (!visit || !actionType || !currentUserId) {
      toast({ title: 'Error', description: 'Faltan datos para procesar la acción.', variant: 'destructive' });
      return;
    }
    
    if (showDateTimePicker && !values.confirmed_datetime) {
      toast({ title: 'Información Faltante', description: 'Por favor, selecciona una nueva fecha y hora para reagendar.', variant: 'warning'});
      return;
    }

    setIsSubmitting(true);
    const result = await updateVisitStatusAction(visit.id, currentUserId, values);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: 'Visita Actualizada', description: `El estado de la visita ha sido actualizado a: ${PropertyVisitStatusLabels[values.new_status]}.` });
      onVisitUpdated();
      onOpenChange(false);
    } else {
      toast({ title: 'Error al Actualizar', description: result.message || 'No se pudo actualizar la visita.', variant: 'destructive' });
    }
  }

  if (!visit || !actionType) return null;

  const getDialogTitle = () => {
    switch (actionType) {
      case 'confirm_original_proposal': return 'Confirmar Hora Propuesta';
      case 'reschedule_proposal': return 'Proponer Nuevo Horario';
      case 'cancel_pending_request': return 'Rechazar Solicitud de Visita';
      case 'cancel_confirmed_visit': return 'Cancelar Visita Confirmada';
      case 'mark_completed': return 'Marcar Visita como Completada';
      case 'mark_visitor_no_show': return 'Marcar como Visitante No Asistió';
      case 'mark_owner_no_show': return 'Marcar como Propietario No Asistió';
      case 'accept_owner_reschedule': return 'Aceptar Nueva Propuesta de Hora';
      case 'reject_owner_reschedule': return 'Rechazar Nueva Propuesta de Hora';
      case 'cancel_own_request': return 'Cancelar Solicitud de Visita';
      default: return 'Gestionar Visita';
    }
  };
  
  const getDialogDescription = () => {
    let baseDesc = `Gestionando la visita para "${visit.property_title}". `;
    switch (actionType) {
        case 'confirm_original_proposal': baseDesc = `Vas a confirmar la visita para "${visit.property_title}" en la hora propuesta por el visitante: ${format(new Date(visit.proposed_datetime), "dd MMM yyyy, HH:mm", { locale: es })}.`; break;
        case 'reschedule_proposal': baseDesc = `Proponiendo un nuevo horario para la visita a "${visit.property_title}". El visitante deberá aceptarlo.`; break;
        case 'cancel_pending_request': baseDesc = `Estás por rechazar/cancelar la solicitud de visita para "${visit.property_title}".`; break;
        case 'cancel_confirmed_visit': baseDesc = `Estás por cancelar la visita previamente confirmada para "${visit.property_title}".`; break;
        case 'mark_completed': baseDesc = `Confirma que la visita a "${visit.property_title}" se realizó exitosamente.`; break;
        case 'mark_visitor_no_show': baseDesc = `Registra que el visitante (${visit.visitor_name}) no se presentó a la visita de "${visit.property_title}".`; break;
        case 'mark_owner_no_show': baseDesc = `Registra que el propietario/agente no se presentó a la visita de "${visit.property_title}".`; break;
        case 'accept_owner_reschedule': baseDesc = `El propietario ha propuesto reagendar para ${visit.confirmed_datetime ? format(new Date(visit.confirmed_datetime), "dd MMM yyyy, HH:mm", { locale: es }) : 'una nueva fecha/hora'}. ¿Aceptas?`; break;
        case 'reject_owner_reschedule': baseDesc = `Vas a rechazar la nueva propuesta de horario del propietario para "${visit.property_title}".`; break;
        case 'cancel_own_request': baseDesc = `Estás por cancelar tu solicitud de visita para "${visit.property_title}".`; break;
    }
    return baseDesc;
  };

  const getSubmitButtonText = () => {
     switch (actionType) {
      case 'confirm_original_proposal': return 'Confirmar Hora Original';
      case 'reschedule_proposal': return 'Proponer Nuevo Horario';
      case 'cancel_pending_request': return 'Rechazar Solicitud';
      case 'cancel_confirmed_visit': return 'Cancelar Visita Confirmada';
      case 'mark_completed': return 'Marcar Completada';
      case 'mark_visitor_no_show': return 'Registrar No Asistencia';
      case 'mark_owner_no_show': return 'Registrar No Asistencia';
      case 'accept_owner_reschedule': return 'Aceptar Propuesta';
      case 'reject_owner_reschedule': return 'Rechazar Propuesta';
      case 'cancel_own_request': return 'Confirmar Cancelación';
      default: return 'Guardar Cambios';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {actionType.includes('cancel') || actionType.includes('reject') ? <AlertTriangle className="mr-2 h-5 w-5 text-destructive" /> : <CalendarClock className="mr-2 h-5 w-5 text-primary" />}
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
            
            {showDateTimePicker && (
              <>
                <FormItem>
                  <FormLabel>1. Selecciona el Nuevo Día</FormLabel>
                  <DatePicker
                    value={selectedDatePart} 
                    onChange={handleDatePartChange}
                    placeholder="Elige un día"
                  />
                </FormItem>
                {selectedDatePart && (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-primary" />
                      2. Selecciona la Nueva Hora (para el {format(selectedDatePart, "dd MMM yyyy", { locale: es})})
                    </FormLabel>
                    {isLoadingBookedSlots ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">Cargando horarios...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                        {availableTimeSlots.map(slot => {
                          const isBooked = bookedTimeSlots.includes(slot);
                          return (
                            <Button
                              key={slot}
                              type="button"
                              variant={selectedTimeSlot === slot ? "default" : "outline"}
                              onClick={() => handleTimeSlotChange(slot)}
                              className={cn(
                                "w-full text-xs h-9", 
                                selectedTimeSlot === slot && "ring-2 ring-primary ring-offset-1",
                                isBooked && "bg-destructive/10 border-destructive/30 text-destructive/70 cursor-not-allowed hover:bg-destructive/10 hover:text-destructive/70"
                              )}
                              disabled={isBooked}
                              title={isBooked ? "No disponible" : undefined}
                            >
                              {slot} {isBooked && " (X)"}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </FormItem>
                )}
                <FormField control={form.control} name="confirmed_datetime" render={({ field }) => <FormMessage />} />
              </>
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
                    <FormLabel>Motivo de Cancelación/Rechazo (Opcional)</FormLabel>
                    <FormControl><Textarea placeholder="Explica brevemente por qué..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
             <FormField control={form.control} name="new_status" render={({ field }) => <input type="hidden" {...field} />} />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cerrar
              </Button>
              <Button type="submit" disabled={isSubmitting || (showDateTimePicker && !form.getValues('confirmed_datetime'))}>
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
