
// src/components/property/RequestVisitDialog.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { requestVisitFormSchema, type RequestVisitFormValues, type User as StoredUserType, type PropertyVisit } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { requestVisitAction, getBookedTimeSlotsForPropertyOnDateAction } from '@/actions/visitActions'; // Importar nueva acción
import { Loader2, CalendarPlus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns'; // Importar format

interface RequestVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyOwnerId: string;
  propertyTitle: string;
  visitorUser: StoredUserType | null;
  onVisitRequested?: (visit: PropertyVisit) => void;
}

const generateTimeSlots = (startHour: number, endHour: number): string[] => {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${String(hour).padStart(2, '0')}:00`);
  }
  return slots;
};
const availableTimeSlots = generateTimeSlots(8, 18); // 08:00 to 17:00

export default function RequestVisitDialog({
  open,
  onOpenChange,
  propertyId,
  propertyOwnerId,
  propertyTitle,
  visitorUser,
  onVisitRequested,
}: RequestVisitDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDatePart, setSelectedDatePart] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);
  const [isLoadingBookedSlots, setIsLoadingBookedSlots] = useState(false);


  const form = useForm<RequestVisitFormValues>({
    resolver: zodResolver(requestVisitFormSchema),
    defaultValues: {
      proposed_datetime: '', 
      visitor_notes: '',
    },
  });

  const fetchBookedSlots = useCallback(async (date: Date) => {
    if (!propertyId) return;
    setIsLoadingBookedSlots(true);
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const slots = await getBookedTimeSlotsForPropertyOnDateAction(propertyId, dateString);
      setBookedTimeSlots(slots);
    } catch (error) {
      console.error("Error fetching booked slots:", error);
      toast({ title: "Error", description: "No se pudieron cargar los horarios ocupados.", variant: "destructive" });
      setBookedTimeSlots([]);
    } finally {
      setIsLoadingBookedSlots(false);
    }
  }, [propertyId, toast]);


  useEffect(() => {
    if (open) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      setSelectedDatePart(tomorrow);
      fetchBookedSlots(tomorrow); // Fetch slots for default date
      setSelectedTimeSlot(null);    
      form.reset({
        proposed_datetime: '',
        visitor_notes: `Hola, estoy interesado/a en visitar la propiedad "${propertyTitle}".`,
      });
    } else {
      setSelectedDatePart(null);
      setSelectedTimeSlot(null);
      setBookedTimeSlots([]);
      form.reset({
        proposed_datetime: '',
        visitor_notes: '',
      });
    }
  }, [open, form, propertyTitle, fetchBookedSlots]);

  const handleDateSelect = (date?: Date) => {
    if (date) {
      setSelectedDatePart(date);
      setSelectedTimeSlot(null); 
      form.setValue('proposed_datetime', '', { shouldValidate: true }); 
      fetchBookedSlots(date); // Fetch slots for the new date
    }
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    if (selectedDatePart) {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const combinedDateTime = new Date(selectedDatePart);
      combinedDateTime.setHours(hours, minutes, 0, 0);
      form.setValue('proposed_datetime', combinedDateTime.toISOString(), { shouldValidate: true, shouldDirty: true });
    }
  };

  async function onSubmit(values: RequestVisitFormValues) {
    if (!visitorUser?.id) {
      toast({ title: 'Error', description: 'Debes iniciar sesión para solicitar una visita.', variant: 'destructive' });
      return;
    }
    if (visitorUser.id === propertyOwnerId) {
      toast({ title: 'Acción no permitida', description: 'No puedes solicitar una visita a tu propia propiedad.', variant: 'destructive' });
      return;
    }
    if (!values.proposed_datetime) {
        toast({ title: 'Información Faltante', description: 'Por favor, selecciona una fecha y una hora para la visita.', variant: 'warning' });
        return;
    }

    setIsSubmitting(true);
    const result = await requestVisitAction(propertyId, propertyOwnerId, visitorUser.id, values);
    setIsSubmitting(false);

    if (result.success && result.visit) {
      toast({
        title: 'Solicitud de Visita Enviada',
        description: 'Tu solicitud ha sido enviada al propietario. Recibirás una notificación cuando sea gestionada.',
      });
      onVisitRequested?.(result.visit);
      onOpenChange(false);
    } else {
      toast({
        title: 'Error al Enviar Solicitud',
        description: result.message || 'No se pudo enviar tu solicitud. Intenta de nuevo.',
        variant: 'destructive',
      });
    }
  }

  if (!visitorUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CalendarPlus className="mr-2 h-5 w-5 text-primary" />
            Solicitar Visita para:
          </DialogTitle>
          <DialogDescription className="pt-1">
            <span className="font-medium text-foreground">{propertyTitle}</span>
            <br />
            Elige un día y luego una hora para tu visita.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <FormItem>
              <FormLabel>1. Selecciona el Día</FormLabel>
              <DatePicker
                value={selectedDatePart} 
                onChange={handleDateSelect}
                placeholder="Elige un día"
              />
              <FormField
                control={form.control}
                name="proposed_datetime"
                render={() => <FormMessage />}
              />
            </FormItem>

            {selectedDatePart && (
              <FormItem>
                <FormLabel className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-primary" />
                  2. Selecciona la Hora (para el {selectedDatePart.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long'})})
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
                          onClick={() => handleTimeSlotSelect(slot)}
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

            <FormField
              control={form.control}
              name="visitor_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>3. Notas Adicionales (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Preferiblemente por la tarde, ¿Tiene mascotas el actual ocupante?, etc."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !form.getValues('proposed_datetime') || isLoadingBookedSlots}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
                Enviar Solicitud
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
