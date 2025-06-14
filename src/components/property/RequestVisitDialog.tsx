
// src/components/property/RequestVisitDialog.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { requestVisitFormSchema, type RequestVisitFormValues, type User as StoredUserType, type PropertyVisit } from '@/lib/types';
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
import { requestVisitAction } from '@/actions/visitActions';
import { Loader2, CalendarPlus } from 'lucide-react';

interface RequestVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyOwnerId: string;
  propertyTitle: string;
  visitorUser: StoredUserType | null; // El usuario que está solicitando la visita
  onVisitRequested?: (visit: PropertyVisit) => void;
}

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

  const form = useForm<RequestVisitFormValues>({
    resolver: zodResolver(requestVisitFormSchema),
    defaultValues: {
      proposed_datetime: new Date().toISOString(), // Default to now, user will change
      visitor_notes: '',
    },
  });
  
  useEffect(() => {
    if (open) {
        // Establecer una fecha por defecto razonable, ej. mañana a las 10 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);

        form.reset({
            proposed_datetime: tomorrow.toISOString(),
            visitor_notes: `Hola, estoy interesado/a en visitar la propiedad "${propertyTitle}".`,
        });
    }
  }, [open, form, propertyTitle]);


  async function onSubmit(values: RequestVisitFormValues) {
    if (!visitorUser?.id) {
      toast({ title: 'Error', description: 'Debes iniciar sesión para solicitar una visita.', variant: 'destructive' });
      return;
    }
    if (visitorUser.id === propertyOwnerId) {
      toast({ title: 'Acción no permitida', description: 'No puedes solicitar una visita a tu propia propiedad.', variant: 'destructive' });
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

  if (!visitorUser) return null; // No mostrar el diálogo si no hay usuario

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
            <br/>
            Propón una fecha y hora para tu visita.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="proposed_datetime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha y Hora Propuesta *</FormLabel>
                  <DatePicker
                    value={field.value ? new Date(field.value) : new Date()}
                    onChange={(date) => field.onChange(date?.toISOString())}
                    placeholder="Selecciona fecha y hora"
                  />
                  <FormDescription>Elige una fecha y hora tentativa para la visita.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visitor_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionales (Opcional)</FormLabel>
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
              <Button type="submit" disabled={isSubmitting}>
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

